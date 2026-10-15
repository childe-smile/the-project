const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve('client');
const output = path.resolve('.tmp/palette-review');
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg'};
  fs.readFile(file, (err,data) => { res.writeHead(err?404:200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}); res.end(err?'Missing':data); });
});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let browser, ws;
(async()=>{
  await new Promise(r=>server.listen(8765,'127.0.0.1',r));
  browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-sandbox','--remote-debugging-port=9228','--user-data-dir='+path.join(output,'chrome-profile-restored'),'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'], {windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.stderr.on('data', d=>process.stderr.write(d));
  let tabs;
  for(let i=0;i<20;i++) { try {tabs=await(await fetch('http://127.0.0.1:9228/json',{signal:AbortSignal.timeout(1000)})).json();break;}catch{await sleep(250);} }
  if(!tabs) throw new Error('Headless browser did not expose its debugging endpoint');
  ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let seq=0; const pending=new Map(); const errors=[];
  ws.addEventListener('message',e=>{ const m=JSON.parse(e.data); if(m.id) {const p=pending.get(m.id);pending.delete(m.id);if(p){m.error?p.reject(m.error):p.resolve(m.result);}} else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text); });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*']});
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:'http://127.0.0.1:8765/'});
  for(let i=0;i<50;i++){if(await evaluate(`document.querySelectorAll('.card').length > 0`))break;await sleep(100);}
  await sleep(600);
  const results=[];
  const dashboard = await evaluate(`({landing:document.querySelector('.view.active').id,worldLists:document.querySelectorAll('#world-list').length,summary:document.querySelector('#world-overview-card-count').textContent})`);
  if (dashboard.landing !== 'view-world' || dashboard.worldLists !== 1) throw new Error('Dashboard landing structure failed');
  results.push(dashboard);
  await evaluate(`document.querySelector('#world-overview-new-wiki').click()`);
  const wikiOpen = await evaluate(`!document.querySelector('#wiki-entry-modal-backdrop').hidden`);
  if (!wikiOpen) throw new Error('Dashboard wiki action failed');
  await evaluate(`document.querySelector('#wiki-entry-modal-close').click();document.querySelector('#manage-card-types').click()`);
  const types = await evaluate(`({active:document.querySelector('.view.active').id,focusedType:document.activeElement.dataset.type})`);
  if(types.active!=='view-cards'||types.focusedType!=='All')throw new Error('Manage Types action failed');
  await evaluate(`document.querySelector('#world-overview-button').click();document.querySelector('.world-summary [data-world-destination="graph"]').click()`);
  if(await evaluate(`document.querySelector('.view.active').id`)!=='view-graph')throw new Error('See Connections action failed');
  await evaluate(`document.querySelector('#world-overview-button').click();document.querySelector('[data-world-destination="timeline"]').click()`);
  if(await evaluate(`document.querySelector('.view.active').id`)!=='view-timeline')throw new Error('Read Timeline action failed');
  await evaluate(`document.querySelector('#new-world-button').click();document.querySelector('#world-input').value='Dashboard QA World';document.querySelector('#world-form').requestSubmit()`);
  const created = await evaluate(`({title:document.querySelector('#world-overview-title').textContent,count:document.querySelector('#world-overview-card-count').textContent,worlds:document.querySelectorAll('#world-list button').length})`);
  if(created.title!=='Dashboard QA World'||created.count!=='0'||created.worlds!==2)throw new Error('Sidebar world creation failed');
  await evaluate(`Array.from(document.querySelectorAll('#world-list button')).find(b=>b.textContent==='Ashes of Valduna').click()`);
  if(await evaluate(`document.querySelector('#world-overview-card-count').textContent`)!=='14')throw new Error('Sidebar world switching failed');
  const currentWorld = await evaluate(`(()=>{const first=document.querySelector('#world-list button');const style=getComputedStyle(first);return {name:first.textContent,current:first.getAttribute('aria-current'),highlighted:style.backgroundColor!=='rgba(0, 0, 0, 0)',position:style.position,selectedCount:document.querySelectorAll('#world-list [aria-current="true"]').length};})()`);
  if(currentWorld.name!=='Ashes of Valduna'||currentWorld.current!=='true'||!currentWorld.highlighted||currentWorld.position!=='sticky'||currentWorld.selectedCount!==1)throw new Error('Current world is not first and highlighted');
  results.push({currentWorld});
  results.push({wikiOpen,types,created,worldSwitch:true});
  for(const theme of ['ocean','dark','light','sepia','parchment']) {
    await evaluate(`import('/js/app/theme.js').then(m=>m.setTheme('${theme}'))`);
    await sleep(600);
    const report=await evaluate(`(()=>{
      const style=s=>{const el=document.querySelector(s); if(!el)return null;const c=getComputedStyle(el);return {color:c.color,background:c.backgroundColor,backgroundImage:c.backgroundImage};};
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
      const rgb=s=>{ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
      const lum=s=>rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const ratio=(a,b)=>{a=lum(a);b=lum(b);return +((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2);};
      const targets=['.card-name','.card-desc','.card-alias','.card-foot','.btn-gold','.chip.active','.sidebar .nav-item.active'];
      return {theme:'${theme}',cards:document.querySelectorAll('.card').length,styles:Object.fromEntries(targets.map(s=>[s,style(s)])),contrast:targets.map(s=>{const e=document.querySelector(s);if(!e)return {selector:s,missing:true};let p=e;while(p&&getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)')p=p.parentElement;return {selector:s,ratio:ratio(getComputedStyle(e).color,p?getComputedStyle(p).backgroundColor:'rgb(0,0,0)')};})};
    })()`);
    results.push(report);
    if(['ocean','light'].includes(theme)) {
      const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,theme+'.png'),Buffer.from(shot.data,'base64'));
    }
  }
  for(const view of ['graph','trees','timeline','canvas','quill','wiki','maps']) {
    await evaluate(`document.querySelector('[data-view="${view}"]').click()`);await sleep(100);
    results.push(await evaluate(`({view:'${view}',active:document.querySelector('.view.active')?.id,textColor:getComputedStyle(document.querySelector('.view.active')).color})`));
  }
  await evaluate(`document.querySelector('[data-view="cards"]').click();document.querySelector('#new-card-button').click()`);
  results.push(await evaluate(`({modalVisible:!document.querySelector('#modal-backdrop').hidden,inputColor:getComputedStyle(document.querySelector('#card-name')).color,inputBackground:getComputedStyle(document.querySelector('#card-name')).backgroundColor})`));
  await evaluate(`document.querySelector('#modal-close').click()`);
  await evaluate(`document.querySelector('#theme-toggle').click();document.querySelector('#theme-toggle').focus()`);
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  results.push(await evaluate(`({toggleTheme:document.documentElement.dataset.theme,focused:document.activeElement.id,focusOutline:getComputedStyle(document.activeElement).outlineStyle})`));
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate(`import('/js/app/theme.js').then(m=>m.setTheme('ocean'));document.querySelector('#world-overview-button').click()`);await sleep(500);
  results.push(await evaluate(`({mobileWidth:innerWidth,documentWidth:document.documentElement.scrollWidth})`));
  const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'mobile.png'),Buffer.from(shot.data,'base64'));
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({results,errors},null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));
  await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});

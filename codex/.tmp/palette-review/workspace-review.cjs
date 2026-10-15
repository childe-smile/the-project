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
  browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-sandbox','--remote-debugging-port=9228','--user-data-dir='+path.join(output,'chrome-profile-workspace-'+Date.now()),'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'], {windowsHide:true,stdio:['ignore','ignore','pipe']});
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
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const go=async view=>{await evaluate('document.querySelector(\'[data-view="'+view+'"]\').click()');await sleep(100);};
  const screenshot=async name=>{const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
  const search=async query=>{await evaluate('(()=>{const input=document.querySelector("#search-input");input.value='+JSON.stringify(query)+';input.dispatchEvent(new Event("input",{bubbles:true}));})()');await sleep(250);};
  const sort=async value=>{await evaluate('document.querySelector(".cards-sort-label .custom-select-trigger").click();document.querySelector(".cards-sort-label .custom-select-option[data-value='+value+']").click()');await sleep(100);};
  await go('cards');
  assert(await evaluate('document.querySelector("#cards-summary").textContent==="Showing 14 of 14 cards"'),'Card summary incorrect');
  const layout=await evaluate('(()=>{const card=document.querySelector("#card-grid .card"),visual=card.querySelector(".card-visual").getBoundingClientRect(),desc=card.querySelector(".card-desc").getBoundingClientRect(),footer=card.querySelector(".card-foot"),grid=getComputedStyle(document.querySelector("#card-grid"));return {columns:grid.gridTemplateColumns,stats:[...footer.children].map(e=>e.textContent),icon:visual.toJSON(),description:desc.toJSON(),fourStats:footer.children.length===4,footerColumns:getComputedStyle(footer).gridTemplateColumns,descriptionBesideIcon:desc.left>visual.right,headDescription:card.querySelector(".card-header-content").contains(card.querySelector(".card-desc"))};})()');
  assert(layout.columns.split(' ').length===3&&layout.fourStats&&layout.descriptionBesideIcon&&layout.headDescription,'Card structure does not match reference');results.push({desktop:layout});await screenshot('workspace-desktop');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1140,height:800,deviceScaleFactor:1,mobile:false});await sleep(100);await screenshot('workspace-reference-width');
  assert(await evaluate('getComputedStyle(document.querySelector("#card-grid")).gridTemplateColumns.split(" ").length===3'),'Reference width did not show three columns');
  await evaluate('document.querySelector(".chip[data-type=Character]").click()');
  assert(await evaluate('document.querySelectorAll("#card-grid .card").length===4&&document.querySelector("#cards-summary").textContent==="Showing 4 of 14 cards"&&document.querySelector(".chip[data-type=Character]").getAttribute("aria-pressed")==="true"'),'Type filter failed');
  await search('Iren');assert(await evaluate('document.querySelectorAll("#card-grid .card").length===1&&document.querySelector("#card-grid .card-name").textContent==="Iren Vasth"'),'Combined filter/search failed');
  await search('no-match-card-review');assert(await evaluate('document.querySelectorAll("#card-grid .card").length===0&&!document.querySelector("#empty-state").hidden'),'Empty search failed');
  await search('');await evaluate('document.querySelector(".chip[data-type=All]").click()');
  await sort('name');assert(await evaluate('(()=>{const names=[...document.querySelectorAll("#card-grid .card-name")].map(e=>e.textContent);return JSON.stringify(names)===JSON.stringify([...names].sort((a,b)=>a.localeCompare(b)));})()'),'Name sort failed');
  await sort('type');assert(await evaluate('(()=>{const cards=[...document.querySelectorAll("#card-grid .card")].map(e=>({name:e.querySelector(".card-name").textContent,type:e.querySelector(".card-type").textContent}));return JSON.stringify(cards)===JSON.stringify([...cards].sort((a,b)=>a.type.localeCompare(b.type)||a.name.localeCompare(b.name)));})()'),'Type sort failed');
  await evaluate('(async()=>{const service=await import("/js/services/card-service.js");const last=service.getCards().at(-1);service.updateCard(last.id,{description:last.description});window.__recentCard=last.id;})()');await sort('updated');assert(await evaluate('document.querySelector("#card-grid .card").dataset.cardId===window.__recentCard'),'Recently updated sort failed');
  await evaluate('document.querySelector("#card-grid .card").click()');assert(await evaluate('document.querySelector("#drawer-name").textContent===document.querySelector("#card-grid .card-name").textContent'),'Card opening failed');await evaluate('document.querySelector("#drawer-close").click();document.querySelector("#card-grid .card").focus()');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert(await evaluate('document.querySelector("#drawer-name").textContent===document.querySelector("#card-grid .card-name").textContent'),'Keyboard card opening failed');await evaluate('document.querySelector("#drawer-close").click()');
  results.push({controls:'Type filters, search, empty results, all sort options, mouse and keyboard opening passed'});
  const mentions=await evaluate('(async()=>{const {countCardMentions}=await import("/js/services/card-mentions.js");const cards=[{id:"a",name:"Ária (I)",text:"Ária (I) in her own article"},{id:"b",name:"Beta",text:"<p>ÁRIA (I) meets <strong>Ária</strong> (I).</p><p>Ária (I)land does not count.</p>"},{id:"c",name:"Gamma",text:"aria (i) without accent"}];const drafts=[{title:"Ária (I)",content:"<p>Ária (I)</p><p>Ária (I)</p><span data-name=Ária&#32;(I)>No mention</span><script>Ária (I)</script>"}];return countCardMentions(cards,drafts).get("a");})()');
  assert(mentions.wiki===2&&mentions.quill===3,'Mention counting failed: '+JSON.stringify(mentions));results.push({mentions});
  const before=await evaluate('document.querySelector(".card[data-card-id=f1a10001-0001-4000-8000-000000000001] [data-stat=quill] strong").textContent');
  await go('quill');await evaluate('document.querySelector("#quill-editor").insertAdjacentHTML("beforeend","<p>Valduna Valduna</p>");document.querySelector("#quill-editor").dispatchEvent(new Event("input",{bubbles:true}))');await sleep(500);await go('cards');
  const after=await evaluate('document.querySelector(".card[data-card-id=f1a10001-0001-4000-8000-000000000001] [data-stat=quill] strong").textContent');assert(Number(after)===Number(before)+2,'Mention counts did not refresh after editing Quill');results.push({quillMentions:{before,after}});
  for(const width of [900,390,320]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await sleep(150);
    const geometry=await evaluate('(()=>{const grid=document.querySelector("#card-grid"),main=document.querySelector(".main"),cards=[...grid.children];return {columns:getComputedStyle(grid).gridTemplateColumns.split(" ").length,mainWidth:main.clientWidth,mainScroll:main.scrollWidth,overflow:cards.some(card=>card.scrollWidth>card.clientWidth||card.getBoundingClientRect().right>innerWidth),iconWidth:cards[0].querySelector(".card-visual").getBoundingClientRect().width};})()');
    assert(!geometry.overflow&&geometry.mainScroll<=geometry.mainWidth&&geometry.columns===(width===900?2:1),'Responsive overflow at '+width+': '+JSON.stringify(geometry));results.push({atWidth:width,...geometry});if(width===390)await screenshot('workspace-mobile');
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate('document.querySelector("#theme-toggle").click()');await sleep(150);await screenshot('workspace-light');
  assert(await evaluate('getComputedStyle(document.querySelector("#card-grid .card-name")).color===getComputedStyle(document.querySelector("#view-cards .view-title")).color'),'Light theme text inconsistent');
  await evaluate('(async()=>{const service=await import("/js/services/world-service.js");service.createWorld("Workspace review empty world");})()');await go('cards');assert(await evaluate('document.querySelector("#cards-summary").textContent==="Showing 0 of 0 cards"&&document.querySelectorAll("#card-grid .card").length===0&&!document.querySelector("#empty-state").hidden'),'Empty world failed');
  assert(errors.length===0,'Browser errors: '+JSON.stringify(errors));results.push({emptyWorld:true,browserErrors:errors});fs.writeFileSync(path.join(output,'workspace-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve('client');
const output = path.resolve('.tmp/palette-review');
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
  fs.readFile(file, (err,data) => { res.writeHead(err?404:200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}); res.end(err?'Missing':data); });
});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let browser, ws;
(async()=>{
  await new Promise(r=>server.listen(8765,'127.0.0.1',r));
  browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-sandbox','--remote-debugging-port=9228','--user-data-dir='+path.join(output,'chrome-profile-maps-'+Date.now()),'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'], {windowsHide:true,stdio:['ignore','ignore','pipe']});
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
  const rect=selector=>evaluate('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()');
  const clickAt=async(x,y)=>{await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1});await sleep(100);};
  await go('maps');
  assert(await evaluate('document.querySelector("#pin-customizer").hidden && document.querySelectorAll("#map-template-grid .map-template").length===6'),'Initial selection/template layout failed');
  assert(await evaluate('document.querySelector(".map-canvas-visual").contains(document.querySelector("#map-zoom-in"))'),'Zoom controls are outside the map');
  const initial=await evaluate('(()=>{const map=document.querySelector(".map-canvas-visual").getBoundingClientRect(),menu=document.querySelector(".map-inspector").getBoundingClientRect();return {map:map.toJSON(),menu:menu.toJSON(),pins:document.querySelectorAll(".map-marker").length};})()');assert(initial.map.right<initial.menu.left&&Math.abs(initial.map.top-initial.menu.top)<1,'Map/menu alignment failed');results.push({initial});await screenshot('maps-desktop');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1140,height:637,deviceScaleFactor:1,mobile:false});await sleep(150);await screenshot('maps-reference-width');
  assert(await evaluate('document.querySelector(".map-canvas-visual").getBoundingClientRect().bottom<=innerHeight'),'Map exceeds viewport at reference size');
  await evaluate('document.querySelector(".map-marker").click()');
  assert(await evaluate('!document.querySelector("#pin-customizer").hidden && document.querySelector(".map-marker.selected") && !document.querySelector("#drawer").classList.contains("show")'),'Selecting a pin did not show its editor');
  const markerId=await evaluate('document.querySelector(".map-marker.selected").dataset.cardId');
  await evaluate('document.querySelector("#map-pin-color").value="#b64b68";document.querySelector("#map-pin-color").dispatchEvent(new Event("input"));document.querySelector("#map-pin-size").value="large";document.querySelector("#map-pin-size").dispatchEvent(new Event("change"));document.querySelector(".map-shape-picker [data-pin-shape=hexagon]").click()');
  assert(await evaluate('document.querySelector(".map-marker.selected").dataset.pinShape==="hexagon"&&document.querySelector(".map-marker.selected").dataset.pinSize==="large"&&document.querySelector(".map-marker.selected").style.getPropertyValue("--marker-color")==="#b64b68"'),'Style preview failed');
  assert(await evaluate('!(JSON.parse(localStorage.getItem("codex-map-pin-styles")||"{}")[document.querySelector(".map-marker.selected").dataset.cardId])'),'Preview saved without Confirm');
  await evaluate('document.querySelector("#map-pin-confirm").click()');
  assert(await evaluate('JSON.parse(localStorage.getItem("codex-map-pin-styles"))[document.querySelector(".map-marker.selected").dataset.cardId].shape==="hexagon"'),'Confirm did not save');await screenshot('maps-selected-pin');
  await evaluate('document.querySelector("#map-marker-info .btn").click()');assert(await evaluate('document.querySelector("#drawer").classList.contains("show")'),'Open card action failed');await evaluate('document.querySelector("#drawer-close").click()');
  await evaluate('document.querySelector("#map-pin-color").value="#111111";document.querySelector("#map-pin-color").dispatchEvent(new Event("input"));document.querySelector("#map-clear-selection").click()');
  assert(await evaluate('document.querySelector("#pin-customizer").hidden && !document.querySelector(".map-marker.selected")'),'Clearing selection failed');
  assert(await evaluate('document.querySelector(".map-marker[data-card-id='+markerId+']").style.getPropertyValue("--marker-color")==="#b64b68"'),'Unsaved preview not discarded');
  await evaluate('document.querySelector(".map-marker").click()');const map=await rect('.map-canvas-visual');await clickAt(map.x+20,map.y+20);assert(await evaluate('document.querySelector("#pin-customizer").hidden'),'Background click did not clear selection');
  await evaluate('document.querySelector(".map-marker").focus()');await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert(await evaluate('!document.querySelector("#pin-customizer").hidden'),'Keyboard selection failed');await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});assert(await evaluate('document.querySelector("#pin-customizer").hidden'),'Escape clear failed');
  await evaluate('document.querySelector("#map-zoom-in").click()');assert(await evaluate('document.querySelector("#map-zoom-level").textContent==="115%"'),'Zoom in failed');await evaluate('document.querySelector("#map-zoom-out").click()');assert(await evaluate('document.querySelector("#map-zoom-level").textContent==="100%"'),'Zoom out failed');
  const pan={x:map.x+100,y:map.y+70};await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...pan});await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...pan,button:'left',buttons:1,clickCount:1});await sleep(100);await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:pan.x+50,y:pan.y+25,button:'left',buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:pan.x+50,y:pan.y+25,button:'left',buttons:0,clickCount:1});await sleep(100);assert(await evaluate('document.querySelector(".map-content-layer").style.transform.includes("50px, 25px")'),'Map pan failed');await evaluate('document.querySelector("#map-fit").click()');assert(await evaluate('document.querySelector(".map-content-layer").style.transform==="translate(0px, 0px) scale(1)"'),'Fit failed');
  const marker=await rect('.map-marker');const p={x:marker.x+marker.width/2,y:marker.y+marker.height/2};await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});await sleep(100);await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x-50,y:p.y+35,button:'left',buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x-50,y:p.y+35,button:'left',buttons:0,clickCount:1});await sleep(100);assert(await evaluate('Boolean(JSON.parse(localStorage.getItem("codex-map-marker-positions"))["'+markerId+'"])'),'Pin drag did not persist');
  results.push({selection:'Mouse/keyboard selection, clearing, Escape, preview and Confirm passed',mapControls:'Zoom, pan, fit and pin dragging passed'});
  await evaluate('document.querySelector(".map-tools").open=true;document.querySelector("[data-map-layer=routes]").click()');assert(await evaluate('document.querySelector(".map-route")&&document.querySelector("[data-map-layer=routes]").getAttribute("aria-pressed")==="true"'),'Map layers failed');
  await evaluate('document.querySelector(".map-reset-button").click()');assert(await evaluate('document.querySelector("#pin-customizer").hidden&&Object.keys(JSON.parse(localStorage.getItem("codex-map-marker-positions"))).length===0'),'Reset failed');await evaluate('document.querySelector(".map-tools").open=false');
  await evaluate('document.querySelector("#map-new-pin-name").value="Watchtower QA";document.querySelector("#map-add-pin").click()');assert(await evaluate('!document.querySelector("#pin-customizer").hidden&&document.querySelector(".map-marker.selected strong").textContent==="Watchtower QA"'),'Add pin failed');await evaluate('document.querySelector(".map-remove-pin").click()');assert(await evaluate('document.querySelector("#pin-customizer").hidden&&![...document.querySelectorAll(".map-marker strong")].some(e=>e.textContent==="Watchtower QA")'),'Remove pin failed');
  await evaluate('document.querySelector("#map-previous-uploads").click()');assert(await evaluate('document.querySelector("#map-uploaded-templates").textContent.includes("No uploaded templates")'),'Empty upload gallery failed');
  await evaluate('(async()=>{const image=await(await fetch("/assets/images/maps/templates/riverlands.svg")).text();const input=document.querySelector("#map-template-upload"),transfer=new DataTransfer();transfer.items.add(new File([image],"My river map.svg",{type:"image/svg+xml"}));input.files=transfer.files;input.dispatchEvent(new Event("change",{bubbles:true}));})()');
  for(let i=0;i<30;i++){if(await evaluate('document.querySelector("#map-upload-status").textContent.includes("saved")'))break;await sleep(100);}
  assert(await evaluate('document.querySelector("#map-template-image").src.startsWith("data:image/svg+xml")&&document.querySelector("#map-uploaded-templates .map-template")&&localStorage.getItem("codex-map-template").startsWith("upload:")'),'Template upload failed');
  await evaluate('document.querySelector("#map-template-grid .map-template").click()');assert(await evaluate('document.querySelector("#map-template-image").src.endsWith("world-map.png")'),'Built-in template switching failed');await evaluate('document.querySelector("#map-uploaded-templates .map-template").click()');assert(await evaluate('document.querySelector("#map-template-image").src.startsWith("data:image/svg+xml")'),'Previous upload switching failed');
  await cdp('Page.reload');await sleep(200);for(let i=0;i<50;i++){if(await evaluate('document.querySelectorAll("#card-grid .card").length>0'))break;await sleep(100);}await go('maps');for(let i=0;i<30;i++){if(await evaluate('document.querySelector("#map-template-image").src.startsWith("data:image/svg+xml")'))break;await sleep(100);}console.log('reload state',await evaluate('({src:document.querySelector("#map-template-image").src.slice(0,70),key:localStorage.getItem("codex-map-template"),uploads:document.querySelectorAll("#map-uploaded-templates .map-template").length,view:document.querySelector(".view.active").id})'));assert(await evaluate('document.querySelector("#pin-customizer").hidden&&document.querySelector("#map-template-image").src.startsWith("data:image/svg+xml")'),'Upload/selection state after reload failed');await evaluate('document.querySelector("#map-previous-uploads").click()');assert(await evaluate('document.querySelectorAll("#map-uploaded-templates .map-template").length===1'),'Uploaded template not persisted');
  await evaluate('document.querySelector("#map-template-grid .map-template").click();document.querySelector(".map-marker").click()');assert(await evaluate('document.querySelector("#map-pin-color").value==="#b64b68"&&document.querySelector("#map-pin-shape").value==="hexagon"'),'Pin style persistence failed');await evaluate('document.querySelector("#map-clear-selection").click()');
  results.push({templates:'Six presets, upload, saved gallery, switching and reload persistence passed',pins:'Create/remove and confirmed style persistence passed'});
  await evaluate('(()=>{const input=document.querySelector("#map-template-upload"),transfer=new DataTransfer();transfer.items.add(new File(["invalid image"],"broken.png",{type:"image/png"}));input.files=transfer.files;input.dispatchEvent(new Event("change",{bubbles:true}));})()');await sleep(200);assert(await evaluate('document.querySelector("#map-upload-status").textContent.includes("couldn\'t load")&&document.querySelector("#map-template-image").src.endsWith("world-map.png")'),'Invalid image upload not handled');
  for(const width of [900,390,320]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await sleep(150);
    const g=await evaluate('(()=>{const main=document.querySelector(".main"),map=document.querySelector(".map-canvas-visual").getBoundingClientRect(),menu=document.querySelector(".map-inspector").getBoundingClientRect();return {mainWidth:main.clientWidth,scroll:main.scrollWidth,map:map.toJSON(),menu:menu.toJSON()};})()');assert(g.scroll<=g.mainWidth&&g.map.right<=width&&g.menu.right<=width,'Horizontal overflow at '+width);if(width<760)assert(g.menu.top>=g.map.bottom,'Mobile menu did not stack');results.push({atWidth:width,mapWidth:g.map.width,menuWidth:g.menu.width});if(width===390)await screenshot('maps-mobile');
  }
  await evaluate('document.querySelector(".map-marker").click()');assert(await evaluate('!document.querySelector("#pin-customizer").hidden'),'Selection before world change failed');await evaluate('(async()=>{const worlds=await import("/js/services/world-service.js");worlds.createWorld("Maps QA empty world");})()');await go('maps');assert(await evaluate('document.querySelector("#pin-customizer").hidden&&!document.querySelector(".map-marker")'),'Empty world selection/pins incorrect');
  assert(errors.length===0,'Browser errors: '+JSON.stringify(errors));results.push({emptyWorld:true,browserErrors:errors});fs.writeFileSync(path.join(output,'maps-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});

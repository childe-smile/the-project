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
  browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--mute-audio','--no-sandbox','--remote-debugging-port=9228','--user-data-dir='+path.join(output,'chrome-profile-spotify-'+(process.argv.includes('--live')?'live':'mock')+'-'+Date.now()),'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'], {windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.stderr.on('data', d=>process.stderr.write(d));
  let tabs;
  for(let i=0;i<20;i++) { try {tabs=await(await fetch('http://127.0.0.1:9228/json',{signal:AbortSignal.timeout(1000)})).json();break;}catch{await sleep(250);} }
  if(!tabs) throw new Error('Headless browser did not expose its debugging endpoint');
  ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let seq=0; const pending=new Map(); const errors=[];
  ws.addEventListener('message',e=>{ const m=JSON.parse(e.data); if(m.id) {const p=pending.get(m.id);pending.delete(m.id);if(p){m.error?p.reject(m.error):p.resolve(m.result);}} else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text); });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*']});
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:'http://127.0.0.1:8765/'});
  for(let i=0;i<50;i++){if(await evaluate(`document.querySelectorAll('.card').length > 0`))break;await sleep(100);}
  await sleep(600);


  const reports=[];
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const go=async view=>{await evaluate('document.querySelector(\'[data-view="'+view+'"]\').click()');await sleep(150);};
  const pcm=Buffer.alloc(44+8000*2*60);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(8000,24);pcm.writeUInt32LE(16000,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
  for(let i=0;i<8000*60;i++)pcm.writeInt16LE(Math.round(Math.sin(i/8000*440*Math.PI*2)*1000),44+i*2);
  const mock = 'window.__spotifyTest={creates:0,destroys:0,loads:[]};window.onSpotifyIframeApiReady({createController(element,options,callback){const frame=document.createElement("iframe");frame.srcdoc='+JSON.stringify('<html><body style="margin:0;background:#193829;color:white;font:13px sans-serif;padding:18px">Spotify controlled playback<audio loop src="data:audio/wav;base64,'+pcm.toString('base64')+'"></audio></body></html>')+';element.replaceWith(frame);window.__spotifyTest.creates++;const listeners={};const emit=()=>listeners.playback_update?.({data:{isPaused:frame.contentDocument.querySelector("audio").paused,isBuffering:false}});const controller={addListener(name,fn){listeners[name]=fn;},loadEntity(uri){window.__spotifyTest.loads.push(uri);frame.contentDocument.querySelector("audio").pause();emit();},togglePlay(){const audio=frame.contentDocument.querySelector("audio");if(audio.paused)audio.play().then(emit);else{audio.pause();emit();}},destroy(){window.__spotifyTest.destroys++;frame.remove();}};frame.onload=()=>{callback(controller);setTimeout(()=>listeners.ready?.(),30);};}});';
  if(!process.argv.includes('--live')) {
    ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);if(m.method!=='Fetch.requestPaused')return;const p=m.params;const api=p.request.url.includes('iframe-api');await cdp('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from(api?mock:JSON.stringify({title:'My Spotify selection'})).toString('base64'),responseHeaders:[{name:'Content-Type',value:api?'application/javascript':'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}]});});
    await cdp('Fetch.enable',{patterns:[{urlPattern:'*open.spotify.com/embed/iframe-api/v1*'},{urlPattern:'*open.spotify.com/oembed*'}]});
  }
  assert(await evaluate('document.querySelector("#codex-radio").hidden'),'Player appears on dashboard');
  if(process.argv.includes('--live')) await evaluate('(()=>{let callback;Object.defineProperty(window,"onSpotifyIframeApiReady",{configurable:true,get:()=>callback,set(fn){callback=api=>{const create=api.createController.bind(api);api.createController=(element,options,done)=>create(element,options,controller=>{window.__liveSpotifyController=controller;window.__liveSpotifyUpdates=[];controller.addListener("playback_update",event=>window.__liveSpotifyUpdates.push(event.data));done(controller);});fn(api);};}});})()');
  await go('wiki');
  for(let i=0;i<200;i++){if(await evaluate('document.querySelector("#codex-radio").dataset.phase === "paused"'))break;await sleep(100);}
  reports.push(await evaluate('({phase:document.querySelector("#codex-radio").dataset.phase,status:document.querySelector("#spotify-status").textContent,frame:document.querySelector(".spotify-embed iframe")?.src})'));
  await cdp('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,process.argv.includes('--live')?'spotify-live.png':'spotify-desktop.png'),Buffer.from(r.data,'base64')));
  assert(await evaluate('document.querySelector("#codex-radio").dataset.phase === "paused"'),'Spotify player failed to become ready');
  if(process.argv.includes('--live')) {
    await evaluate('document.querySelector(".radio-preset[data-genre=rock]").click()');await sleep(2000);
    reports.push(await evaluate('({phase:document.querySelector("#codex-radio").dataset.phase,frame:document.querySelector(".spotify-embed iframe")?.src})'));
    await evaluate('window.__originalFrame=document.querySelector(".spotify-embed iframe");document.querySelector(".radio-play-toggle").click()');
    for(let i=0;i<80;i++){if(await evaluate('document.querySelector("#codex-radio").dataset.phase === "playing"'))break;await sleep(100);}
    const playing=await evaluate('({phase:document.querySelector("#codex-radio").dataset.phase,update:window.__liveSpotifyUpdates.at(-1)})');
    reports.push({livePlayback:playing});
    if(playing.phase==='playing') {
      await evaluate('document.querySelector(".radio-minimize").click()');await go('cards');await sleep(1200);await go('quill');await sleep(1200);
      const after=await evaluate('({phase:document.querySelector("#codex-radio").dataset.phase,update:window.__liveSpotifyUpdates.at(-1),sameFrame:window.__originalFrame===document.querySelector(".spotify-embed iframe")})');
      assert(after.phase==='playing'&&after.sameFrame&&after.update.position>playing.update.position,'Spotify playback interrupted by hide/minimize');reports.push({liveBackgroundPlayback:after});
    }
  } else {
    await evaluate('window.__originalFrame=document.querySelector(".spotify-embed iframe");document.querySelector(".radio-play-toggle").click()');await sleep(500);
    const initial=await evaluate('window.__originalFrame.contentDocument.querySelector("audio").currentTime');
    await evaluate('document.querySelector(".radio-minimize").click()');await sleep(200);
    assert(await evaluate('document.querySelector("#codex-radio").classList.contains("is-minimized") && document.querySelector(".spotify-embed").classList.contains("is-parked")'),'Minimize did not park frame');
    for(const view of ['cards','graph','maps','trees','timeline','canvas']){await go(view);assert(await evaluate('document.querySelector("#codex-radio").hidden'),'Unexpected visibility on '+view);}
    await go('quill');
    assert(await evaluate('!document.querySelector("#codex-radio").hidden && document.querySelector("#codex-radio").classList.contains("is-minimized")'),'Minimized state not preserved across views');
    await evaluate('document.querySelector(".radio-minimize").click()');await sleep(200);
    const playback=await evaluate('({time:window.__originalFrame.contentDocument.querySelector("audio").currentTime,paused:window.__originalFrame.contentDocument.querySelector("audio").paused,same:window.__originalFrame===document.querySelector(".spotify-embed iframe"),...window.__spotifyTest})');
    assert(!playback.paused&&playback.time>initial&&playback.same&&playback.creates===1&&playback.destroys===0,'Playback interrupted while hiding/minimizing');reports.push({backgroundPlayback:playback});
    const getHandle=()=>evaluate('(()=>{const r=document.querySelector(".radio-drag-handle").getBoundingClientRect();return {x:r.x+30,y:r.y+r.height/2};})()');
    await evaluate('window.__pointers=[];["pointerdown","pointermove","pointerup"].forEach(name=>window.addEventListener(name,e=>window.__pointers.push({type:e.type,target:e.target.className,x:e.clientX,y:e.clientY,primary:e.isPrimary,button:e.button})))');
    const drag=async(x,y)=>{const p=await getHandle();await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...p});await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});console.log('after down',await evaluate('({dragging:document.querySelector("#codex-radio").classList.contains("is-dragging"),capture:document.querySelector(".radio-drag-handle").hasPointerCapture(1)})'));await sleep(100);await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'left',buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1});await sleep(150);};
    await drag(400,200);
    console.log('drag geometry',await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect(),s=document.querySelector(".spotify-embed-slot").getBoundingClientRect(),e=document.querySelector(".spotify-embed").getBoundingClientRect();return {r:r.toJSON(),s:s.toJSON(),e:e.toJSON()};})()'));
    console.log('pointer events',await evaluate('window.__pointers'),'errors',errors);
    assert(await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect(),s=document.querySelector(".spotify-embed-slot").getBoundingClientRect(),e=document.querySelector(".spotify-embed").getBoundingClientRect();return r.x<500&&r.y<250&&Math.abs(s.x-e.x)<1&&Math.abs(s.y-e.y)<1;})()'),'Drag or iframe alignment failed');
    await drag(1800,1200);
    assert(await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect();return r.right<=innerWidth-7&&r.bottom<=innerHeight-7;})()'),'Drag exceeded viewport');
    await evaluate('document.querySelector(".radio-drag-handle").focus()');
    const before=await evaluate('document.querySelector("#codex-radio").getBoundingClientRect().x');
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
    assert(await evaluate('document.querySelector("#codex-radio").getBoundingClientRect().x')===before-12,'Keyboard move failed');
    reports.push({drag:'Pointer and keyboard movement, clamping, iframe alignment passed'});
    await evaluate('document.querySelector("#spotify-link").value="https://open.spotify.com.evil.test/track/1234567890123456789012";document.querySelector(".spotify-link-form").requestSubmit()');await sleep(100);
    assert(await evaluate('document.querySelector("#spotify-link").getAttribute("aria-invalid")==="true"&&window.__spotifyTest.loads.length===0'),'Invalid Spotify link accepted');
    await evaluate('document.querySelector("#spotify-link").value="https://open.spotify.com/track/1234567890123456789012?si=test";document.querySelector(".spotify-link-form").requestSubmit()');await sleep(200);
    assert(await evaluate('window.__spotifyTest.loads.at(-1)==="spotify:track:1234567890123456789012"&&document.querySelector(".radio-mini-title").textContent==="My Spotify selection"'),'Spotify link failed');
    await evaluate('document.querySelector(".radio-preset[data-genre=rock]").click()');await sleep(100);
    assert(await evaluate('window.__spotifyTest.loads.at(-1)==="spotify:playlist:37i9dQZF1DWXRqgorJj26U"'),'Preset failed');
    reports.push({spotifyLinks:'Validation, metadata, presets passed'});
    await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await sleep(300);
    assert(await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-7&&r.bottom<=innerHeight-7&&document.querySelector(".radio-dial").getBoundingClientRect().width===25;})()'),'Mobile position or dial width failed');
    await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    const p=await getHandle();await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:65,y:100}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(150);
    assert(await evaluate('document.querySelector("#codex-radio").getBoundingClientRect().top<150'),'Touch drag failed');
    await cdp('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,'spotify-mobile.png'),Buffer.from(r.data,'base64')));
    await evaluate('document.querySelector(".radio-minimize").click()');await sleep(100);
    assert(await evaluate('JSON.parse(localStorage.getItem("codex-music-panel")).minimized'),'Minimized state not stored');
    await cdp('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,'spotify-minimized.png'),Buffer.from(r.data,'base64')));
    reports.push({mobile:'Touch drag, viewport bounds, 25px dial and saved minimized state passed'});
  }
  assert(errors.length===0,'Browser errors: '+JSON.stringify(errors));
  reports.push({browserErrors:errors});
  fs.writeFileSync(path.join(output,process.argv.includes('--live')?'spotify-live-results.json':'spotify-results.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});

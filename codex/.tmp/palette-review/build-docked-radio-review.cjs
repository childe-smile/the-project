const fs = require('node:fs');
let prefix = fs.readFileSync('.tmp/palette-review/radio-review.cjs', 'utf8').split('  const reports=[];')[0].replace("'chrome-profile-radio-live'", "'chrome-profile-radio-dock-'+Date.now()");
const tests = String.raw`
  const reports=[];
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const go=async view=>{await evaluate('document.querySelector(\'[data-view="'+view+'"]\').click()');await sleep(150);};
  const screenshot=async name=>{const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
  const pcm=Buffer.alloc(44+8000*2*60);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(8000,24);pcm.writeUInt32LE(16000,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
  for(let i=0;i<8000*60;i++)pcm.writeInt16LE(Math.round(Math.sin(i/8000*440*Math.PI*2)*1000),44+i*2);
  let directoryFails=false;
  if(!process.argv.includes('--live')) {
    ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);if(m.method!=='Fetch.requestPaused')return;const p=m.params;let body=pcm,contentType='audio/wav';if(p.request.url.includes('api.radio-browser.info')){const genre=new URL(p.request.url).searchParams.get('tag');body=Buffer.from(JSON.stringify([1,2,3].map(i=>({name:genre+' Station '+i,url_resolved:'https://radio-test.invalid/'+genre+'-'+i+'.wav',country:'Live radio',bitrate:128,hls:0}))));contentType='application/json';}await cdp('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:directoryFails&&contentType==='application/json'?503:200,body:body.toString('base64'),responseHeaders:[{name:'Content-Type',value:contentType},{name:'Access-Control-Allow-Origin',value:'*'}]});});
    await cdp('Fetch.enable',{patterns:[{urlPattern:'*api.radio-browser.info*'},{urlPattern:'*radio-test.invalid*'}]});
  }
  assert(await evaluate('document.querySelector("#codex-radio").hidden && document.querySelector("#radio-dock-button").hidden'),'Player appears on dashboard');
  await go('wiki');
  assert(await evaluate('!document.querySelector("#codex-radio").hidden && document.querySelector(".radio-band").textContent==="FMAM" && !document.querySelector(".spotify-embed") && !document.querySelector(".spotify-link-form")'),'Original layout not restored');
  assert(await evaluate('document.querySelector(".radio-spotify-login").href==="https://accounts.spotify.com/en/login" && document.querySelector(".radio-spotify-login").target==="_blank"'),'Spotify login link incorrect');
  await screenshot('radio-restored-desktop');
  await evaluate('document.querySelector(".radio-preset[data-genre='+ (process.argv.includes('--live')?'rock':'pop') +']").click()');
  for(let i=0;i<180;i++){if(await evaluate('document.querySelector("#codex-radio").dataset.phase === "playing"'))break;await sleep(100);}
  const liveState=await evaluate('({phase:document.querySelector("#codex-radio").dataset.phase,station:document.querySelector(".radio-station-name").textContent,status:document.querySelector(".radio-status").textContent,src:document.querySelector("#codex-radio-audio").src,error:document.querySelector("#codex-radio-audio").error?.code})');reports.push(liveState);console.log('initial radio state',liveState);
  assert(await evaluate('document.querySelector("#codex-radio").dataset.phase === "playing"'),'Radio playback did not start');
  await evaluate('window.__originalAudio=document.querySelector("#codex-radio-audio")');
  const initial=await evaluate('window.__originalAudio.currentTime');
  const handle=await evaluate('(()=>{const r=document.querySelector(".radio-drag-handle").getBoundingClientRect();return {x:r.x+25,y:r.y+r.height/2};})()');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...handle});await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...handle,button:'left',buttons:1,clickCount:1});await sleep(100);await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:400,y:210,button:'left',buttons:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:400,y:210,button:'left',buttons:0,clickCount:1});await sleep(150);
  const expandedPosition=await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect();return {x:r.x,y:r.y};})()');
  assert(expandedPosition.x<500&&expandedPosition.y<250,'Dragging failed');
  await evaluate('document.querySelector(".radio-minimize").click()');await sleep(100);
  assert(await evaluate('document.querySelector("#codex-radio").hidden && !document.querySelector("#radio-dock-button").hidden'),'Minimize did not dock');
  const geometry=()=>evaluate('(()=>{const s=document.querySelector(".topbar .search").getBoundingClientRect(),d=document.querySelector("#radio-dock-button").getBoundingClientRect();return {s:s.toJSON(),d:d.toJSON(),width:innerWidth};})()');
  for(const width of [1440,900,768,680,390,320]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await sleep(100);
    const g=await geometry();assert(g.d.left>=g.s.right&&g.d.right<=width&&Math.abs((g.d.y+g.d.height/2)-(g.s.y+g.s.height/2))<3,'Dock misplaced at width '+width+': '+JSON.stringify(g));
    reports.push({dockAtWidth:width,searchRight:g.s.right,buttonLeft:g.d.left,buttonRight:g.d.right});
    if(width===1440)await screenshot('radio-docked-desktop');if(width===390)await screenshot('radio-docked-mobile');
  }
  for(const view of ['cards','graph','maps','trees','timeline','canvas']){await go(view);assert(await evaluate('document.querySelector("#codex-radio").hidden && document.querySelector("#radio-dock-button").hidden && !window.__originalAudio.paused'),'Unexpected visibility or stopped audio on '+view);}
  await go('quill');await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await sleep(150);
  await evaluate('document.querySelector("#radio-dock-button").click()');await sleep(100);
  assert(await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect();return !document.querySelector("#codex-radio").hidden&&document.querySelector("#radio-dock-button").hidden&&Math.abs(r.x-'+expandedPosition.x+')<1&&Math.abs(r.y-'+expandedPosition.y+')<1;})()'),'Restore did not retain position');
  const playback=await evaluate('({time:window.__originalAudio.currentTime,paused:window.__originalAudio.paused,same:window.__originalAudio===document.querySelector("#codex-radio-audio")})');
  assert(!playback.paused&&playback.time>initial&&playback.same,'Playback interrupted');reports.push({backgroundPlayback:playback});
  if(!process.argv.includes('--live')) {
    await evaluate('document.querySelector("[data-radio=next]").click()');await sleep(150);assert(await evaluate('document.querySelector(".radio-station-name").textContent==="pop Station 2"'),'Next failed');
    await evaluate('document.querySelector("[data-radio=previous]").click()');await sleep(150);assert(await evaluate('document.querySelector(".radio-station-name").textContent==="pop Station 1"'),'Previous failed');
    await evaluate('document.querySelector("[data-radio=shuffle]").click()');await sleep(150);assert(await evaluate('document.querySelector(".radio-station-name").textContent!=="pop Station 1"'),'Shuffle failed');
    await evaluate('const slider=document.querySelector(".radio-volume input");slider.value="25";slider.dispatchEvent(new Event("input"));document.querySelector("[data-radio=mute]").click()');assert(await evaluate('window.__originalAudio.volume===.25&&window.__originalAudio.muted'),'Volume/mute failed');
    await evaluate('document.querySelector("[data-radio=power]").click()');assert(await evaluate('window.__originalAudio.paused'),'Pause failed');await evaluate('document.querySelector("[data-radio=power]").click()');await sleep(150);assert(await evaluate('!window.__originalAudio.paused'),'Resume failed');
    reports.push({controls:'Next, previous, shuffle, volume, mute, pause and resume passed'});
    await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await sleep(150);await screenshot('radio-restored-mobile');
    assert(await evaluate('(()=>{const r=document.querySelector("#codex-radio").getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-7&&document.querySelector(".radio-dial").getBoundingClientRect().width===25;})()'),'Mobile panel bounds/dial failed');
    await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});const p=await evaluate('(()=>{const r=document.querySelector(".radio-drag-handle").getBoundingClientRect();return {x:r.x+25,y:r.y+r.height/2};})()');await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:70,y:160}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100);assert(await evaluate('document.querySelector("#codex-radio").getBoundingClientRect().top<180'),'Touch drag failed');
    directoryFails=true;await evaluate('document.querySelector(".radio-preset[data-genre=rap]").click()');await sleep(300);assert(await evaluate('document.querySelector("#codex-radio").dataset.phase==="error"'),'Directory error missing');
    await evaluate('document.querySelector(".radio-minimize").click()');assert(await evaluate('JSON.parse(localStorage.getItem("codex-music-panel")).minimized'),'Minimization not saved');
    await cdp('Page.reload');await sleep(800);await go('wiki');assert(await evaluate('document.querySelector("#codex-radio").hidden&&!document.querySelector("#radio-dock-button").hidden'),'Saved dock state not restored');reports.push({touchDrag:true,directoryOutage:true,savedMinimization:true});
  }
  assert(errors.length===0,'Browser errors: '+JSON.stringify(errors));reports.push({browserErrors:errors});
  fs.writeFileSync(path.join(output,process.argv.includes('--live')?'radio-dock-live-results.json':'radio-dock-results.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
`;
fs.writeFileSync('.tmp/palette-review/docked-radio-review.cjs',prefix+tests);

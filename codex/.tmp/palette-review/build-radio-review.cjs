const fs = require('node:fs');
const base = fs.readFileSync('.tmp/palette-review/review.cjs', 'utf8');
let head = base.slice(0, base.indexOf('  const results=[];'));
head = head.replace("'chrome-profile-restored'", "'chrome-profile-radio-live'").replace("'--headless=new'", "'--headless=new','--mute-audio'");
head = head.replace('awaitPromise:true,returnByValue:true', 'awaitPromise:true,returnByValue:true,userGesture:true');
const tests = `
  const reports=[];
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const go=async view=>{await evaluate(\`document.querySelector('[data-view="\${view}"]').click()\`);await sleep(120);};
  const visible=()=>evaluate(\`!document.querySelector('#codex-radio').hidden\`);
  assert(!(await visible()),'Radio visible on dashboard');
  for(const view of ['cards','graph','maps','trees','timeline','canvas']){await go(view);assert(!(await visible()),'Radio visible on '+view);}
  for(const view of ['wiki','quill']){await go(view);assert(await visible(),'Radio missing on '+view);}
  reports.push({visibility:'Wiki and Quill only'});

  // Inspect a real directory response separately from controlled audio tests.
  reports.push(await evaluate(\`fetch('https://de1.api.radio-browser.info/json/stations/search?tag=pop&hidebroken=true&is_https=true&limit=2',{signal:AbortSignal.timeout(5000)}).then(async r=>({liveDirectoryStatus:r.status,stationCount:(await r.json()).length})).catch(e=>({liveDirectoryError:e.message}))\`));
  reports.push(await evaluate(\`(async()=>{try{const {getRadioStations}=await import('/js/services/radio-service.js');const stations=await getRadioStations('rock');const live=new Audio(stations[0].url);live.volume=0;const result=await new Promise(resolve=>{let timer;const finish=value=>{clearTimeout(timer);resolve(value);};live.addEventListener('playing',()=>finish({livePlayback:true,station:stations[0].name}),{once:true});live.addEventListener('error',()=>finish({livePlayback:false,station:stations[0].name,error:live.error?.code}),{once:true});timer=setTimeout(()=>finish({livePlayback:false,station:stations[0].name,error:'timeout'}),7000);live.play().catch(e=>finish({livePlayback:false,error:e.message}));});live.pause();live.removeAttribute('src');live.load();return result;}catch(e){return {livePlayback:false,error:e.message};}})()\`));
  const pcm=Buffer.alloc(44+8000*2*60);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(8000,24);pcm.writeUInt32LE(16000,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
  for(let i=0;i<8000*60;i++)pcm.writeInt16LE(Math.round(Math.sin(i/8000*440*Math.PI*2)*1000),44+i*2);
  let directoryFails=false;
  ws.addEventListener('message',async e=>{
    const message=JSON.parse(e.data);if(message.method!=='Fetch.requestPaused')return;
    const p=message.params;
    if(p.request.url.includes('api.radio-browser.info')){
      if(directoryFails){await cdp('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,body:Buffer.from('Unavailable').toString('base64'),responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'}]});return;}
      const genre=new URL(p.request.url).searchParams.get('tag');
      const body=JSON.stringify([1,2,3].map(i=>({name:genre+' Station '+i,url_resolved:'https://radio-test.invalid/'+encodeURIComponent(genre)+'-'+i+'.wav',country:'Test station',bitrate:128,hls:0})));
      await cdp('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from(body).toString('base64'),responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'}]});
    }else await cdp('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:pcm.toString('base64'),responseHeaders:[{name:'Content-Type',value:'audio/wav'},{name:'Content-Length',value:String(pcm.length)}]});
  });
  await cdp('Fetch.enable',{patterns:[{urlPattern:'*api.radio-browser.info*'},{urlPattern:'*radio-test.invalid*'}]});
  await evaluate(\`document.querySelector('.radio-preset[data-genre="pop"]').click()\`);
  for(let i=0;i<40;i++){if(await evaluate(\`document.querySelector('#codex-radio').dataset.phase==='playing'\`))break;await sleep(100);}
  assert(await evaluate(\`!document.querySelector('#codex-radio-audio').paused\`),'Radio audio did not start');
  const initial=await evaluate(\`({src:document.querySelector('#codex-radio-audio').src,time:document.querySelector('#codex-radio-audio').currentTime})\`);
  for(const view of ['cards','graph','maps','trees','timeline','canvas']){
    await go(view);await sleep(100);
    assert(await evaluate(\`!document.querySelector('#codex-radio-audio').paused\`),'Navigation stopped playback on '+view);
  }
  await evaluate(\`document.querySelector('#world-overview-button').click()\`);
  assert(!(await visible()),'Radio visible on home');
  const continued=await evaluate(\`({src:document.querySelector('#codex-radio-audio').src,time:document.querySelector('#codex-radio-audio').currentTime,paused:document.querySelector('#codex-radio-audio').paused})\`);
  assert(continued.src===initial.src&&continued.time>initial.time&&!continued.paused,'Playback was replaced or restarted');
  reports.push({backgroundPlayback:{initial,continued}});
  await go('wiki');
  const desktop=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'radio-desktop.png'),Buffer.from(desktop.data,'base64'));
  await evaluate(\`document.querySelector('[data-radio="next"]').click()\`);await sleep(150);
  assert(await evaluate(\`document.querySelector('.radio-station-name').textContent==='pop Station 2'\`),'Next station failed');
  await evaluate(\`document.querySelector('[data-radio="previous"]').click()\`);await sleep(150);
  assert(await evaluate(\`document.querySelector('.radio-station-name').textContent==='pop Station 1'\`),'Previous station failed');
  await evaluate(\`const slider=document.querySelector('.radio-volume input');slider.value='25';slider.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-radio="mute"]').click()\`);
  assert(await evaluate(\`document.querySelector('#codex-radio-audio').volume===.25&&document.querySelector('#codex-radio-audio').muted\`),'Volume or mute failed');
  await evaluate(\`document.querySelector('[data-radio="power"]').click()\`);
  assert(await evaluate(\`document.querySelector('#codex-radio-audio').paused\`),'Pause failed');
  await evaluate(\`document.querySelector('[data-radio="power"]').click()\`);await sleep(200);
  assert(await evaluate(\`!document.querySelector('#codex-radio-audio').paused\`),'Resume failed');
  reports.push({stationNavigation:true,volume:true,mute:true,pauseResume:true});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(200);
  await go('quill');
  const geometry=await evaluate(\`(()=>{const r=document.querySelector('#codex-radio').getBoundingClientRect();const c=getComputedStyle(document.querySelector('#codex-radio'));return {left:r.left,right:r.right,width:innerWidth,opacity:c.opacity,background:c.backgroundImage};})()\`);
  assert(geometry.left>=0&&geometry.right<=geometry.width&&geometry.opacity==='1','Radio overflows or fades its elements');
  reports.push({mobile:geometry});
  const mobile=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'radio-mobile.png'),Buffer.from(mobile.data,'base64'));
  directoryFails=true;
  await evaluate(\`document.querySelector('.radio-preset[data-genre="rap"]').click()\`);await sleep(400);
  assert(await evaluate(\`document.querySelector('#codex-radio').dataset.phase==='error'\`),'Directory outage state failed');
  reports.push({directoryOutageHandled:true});
  assert(errors.length===0,'Runtime errors detected');
  fs.writeFileSync(path.join(output,'radio-results.json'),JSON.stringify({reports,errors},null,2));console.log(JSON.stringify({reports,errors},null,2));
  ws.send(JSON.stringify({id:++seq,method:'Browser.close'}));await sleep(300);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
`;
fs.writeFileSync('.tmp/palette-review/radio-review.cjs',head+tests);

// Desktop-only ball play integration check. All assets must work offline.
const {app,BrowserWindow}=require('electron');const path=require('node:path');const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:700,height:800,webPreferences:{backgroundThrottling:false}});
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 w.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_d,cb)=>cb({cancel:true}));
 const run=code=>w.webContents.executeJavaScript(code),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function setup(){
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));assert.equal(await run('preview.ready'),true);
  await run(`window.playEvents=[];document.getElementById('pet').addEventListener('cat-yarn-complete',e=>playEvents.push(e.detail));preview.setPersonality('playful');`);
 }
 try{
  await setup();
  assert.equal(await run("preview.react('play')"),true);assert.equal(await run('preview.play()'),false);
  await wait(500);assert.equal(await run('preview.getPose()'),'playing');assert.equal(await run('playEvents.length'),0);
  await wait(3400);assert.equal(await run('playEvents.length'),1);assert.equal(await run('preview.getPose()'),'idle');
  assert.ok(await run("document.getElementById('careQuote').textContent.length>0"));
  assert.equal(await run('preview.play()'),true);await wait(3900);assert.equal(await run('playEvents.length'),2);
  assert.notEqual(await run('playEvents[0].message'),await run('playEvents[1].message'));
  for(const action of ["preview.giveCare('water')","preview.beginManualCare('snack')","search.value='work';search.dispatchEvent(new Event('input'))","window.dispatchEvent(new Event('blur'))","preview.react('tilt')","preview.searchCompleted()"]){
   assert.equal(await run('preview.play()'),true);await wait(100);await run(action);assert.notEqual(await run('preview.getPose()'),'playing');
  }
  // Interruption during the wag finale must also suppress the completion quote.
  await run('preview.play()');await wait(2400);await run("window.dispatchEvent(new Event('blur'))");await wait(3900);assert.equal(await run('playEvents.length'),2);
  await run('preview.play();preview.destroy();preview.destroy()');await wait(3900);
  assert.equal(await run('playEvents.length'),2);assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  await w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setup();await run('preview.play()');await wait(200);const a=(await w.webContents.capturePage()).toBitmap();await wait(200);const b=(await w.webContents.capturePage()).toBitmap();
  assert.ok(a.equals(b),'Reduced-motion ball should remain stationary');await wait(600);assert.equal(await run('playEvents.length'),1);
  await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await setup();await run('preview.play()');await wait(100);
  await run('(()=>{const until=performance.now()+1200;while(performance.now()<until){};})()');await wait(150);
  assert.equal(await run('preview.getPose()'),'idle');assert.equal(await run('playEvents.length'),0);
  assert.deepEqual(errors,[]);console.log('Offline play, repeat suppression, completion-only quotes, interruption, cleanup, reduced motion and stalled-frame checks passed.');w.destroy();app.quit();
 }catch(e){console.error(e);app.exit(1);}
});

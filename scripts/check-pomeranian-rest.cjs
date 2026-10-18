const {app,BrowserWindow}=require('electron');const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const timeout=setTimeout(()=>{console.error('Rest check timed out');app.exit(1);},30000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,transparent:true,frame:false,width:400,height:400,backgroundColor:'#00000000',webPreferences:{backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function capture(name){const im=await w.capturePage({x:50,y:40,width:300,height:300});fs.writeFileSync('/private/tmp/pomeranian-'+name+'.png',im.toPNG());return im.toBitmap();}
 function top(pixels){for(let y=0;y<300;y++)for(let x=0;x<300;x++)if(pixels[(y*300+x)*4+3]>100)return y;return 300;}
 try{
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');
  await run("preview.destroy();document.body.replaceChildren();document.body.style.background='transparent';window.restClock=0;window.testPet=document.createElement('div');testPet.style.cssText='position:absolute;left:50px;top:40px;width:300px;height:300px';document.body.appendChild(testPet);window.subject=Pomeranian.mount(testPet,{restPolicy:CompanionRest.create({now:()=>restClock})});void 0;");assert.equal(await run('subject.ready'),true);
  await wait(100);const stand=await capture('standing');assert.equal(await run('subject.sit()'),true);await wait(900);await capture('sitting');assert.equal(await run('subject.getPose()'),'sitting');
  assert.equal(await run('subject.sleep()'),true);await wait(900);const sleep=await capture('sleeping');assert.equal(await run('subject.getPose()'),'sleeping');assert.ok(top(sleep)>top(stand)+20,'head lowers visibly into the lying pose');
  assert.equal(await run('subject.wake()'),true);assert.equal(await run('subject.getPose()'),'idle');await wait(100);
  await run('restClock=45001');await wait(120);assert.equal(await run('subject.getPose()'),'sitting');
  await run('restClock=125001');await wait(120);assert.equal(await run('subject.getPose()'),'sleeping');await wait(800);
  assert.equal(await run('subject.play()'),true);assert.equal(await run('subject.getPose()'),'waking');await wait(600);assert.equal(await run('subject.getPose()'),'playing');
  await run("window.dispatchEvent(new Event('blur'));subject.sleep()");await wait(800);assert.equal(await run("subject.giveCare('water')"),true);assert.equal(await run('subject.getPose()'),'waking');await wait(600);assert.equal(await run('subject.getPose()'),'water');
  await run("window.dispatchEvent(new Event('blur'));subject.sleep()");await wait(800);await run('window.waking=subject.wake();subject.destroy()');assert.equal(await run('waking'),false);assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await run('window.reducedSubject=Pomeranian.mount(testPet);void 0;');assert.equal(await run('reducedSubject.ready'),true);
  assert.equal(await run('reducedSubject.sleep()'),true);await wait(100);assert.equal(await run('reducedSubject.getPose()'),'sleeping');assert.equal(await run('reducedSubject.wake()'),true);assert.equal(await run('reducedSubject.getPose()'),'idle');await run('reducedSubject.destroy()');
  clearTimeout(timeout);console.log('Rendered sit/lie, timed idle progression, wake-before-play/care and cancelled wake cleanup passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

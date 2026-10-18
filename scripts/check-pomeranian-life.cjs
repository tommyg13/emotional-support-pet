// Facial motion uses an injected clock; real WebGL pixels verify the exported shapes.
const {app,BrowserWindow}=require('electron');const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const timeout=setTimeout(()=>{console.error('Life check timed out');app.exit(1);},30000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,transparent:true,frame:false,width:400,height:400,backgroundColor:'#00000000',webPreferences:{backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function capture(name){const im=await w.capturePage({x:50,y:40,width:300,height:300});if(name)fs.writeFileSync('/private/tmp/pomeranian-'+name+'.png',im.toPNG());return im.toBitmap();}
 function changed(a,b,top,bottom){let n=0;for(let y=top;y<bottom;y++)for(let x=0;x<300;x++){const i=(y*300+x)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>30)n++;}return n;}
 try{
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');
  await run("preview.destroy();document.body.replaceChildren();document.body.style.background='transparent';window.lifeClock=0;window.lifeSamples=0;window.testPet=document.createElement('div');testPet.style.cssText='position:absolute;left:50px;top:40px;width:300px;height:300px';document.body.appendChild(testPet);window.clockLife=CompanionLife.create({now:()=>lifeClock,random:()=>0});window.subject=Pomeranian.mount(testPet,{lifePolicy:{...clockLife,sample:options=>{lifeSamples++;return window.lastFace=clockLife.sample(options);}}});void 0;");assert.equal(await run('subject.ready'),true);await wait(120);
  const open=await capture('eyes-open-live');assert.equal(await run('subject.blink()'),true);await run('lifeClock=95');await wait(100);const closed=await capture('eyes-closed-live');assert.ok(changed(open,closed,40,145)>150,'eyelids visibly close');assert.equal(changed(open,closed,255,300),0,'blinking never moves paws');
  await run('lifeClock=190');await wait(120);assert.ok(changed(open,await capture(),40,125)<10,'eyes reopen to their original appearance');
  await run('lifeClock=1150');await wait(130);const inhale=await capture('breathing-live');assert.ok(changed(open,inhale,130,255)>20,'chest breathing is visible');assert.equal(changed(open,inhale,265,300),0,'breathing keeps the paws planted');
  await run('subject.sleep();lifeClock=1450');await wait(100);await run('lifeClock=1550');await wait(800);assert.equal(await run('lastFace.blink'),1);assert.equal(await run('subject.blink()'),false);await capture('sleep-closed-live');
  await run('window.wakeDone=subject.wake();lifeClock=1650');await wait(100);await run('lifeClock=1750');await wait(100);assert.equal(await run('wakeDone'),true);assert.equal(await run('lastFace.blink'),0);
  await run("testPet.style.visibility='hidden'");await wait(100);const samples=await run('lifeSamples');await wait(200);assert.equal(await run('lifeSamples'),samples,'hidden dock does not keep animating');await run("testPet.style.visibility='visible';lifeClock=2000");await wait(150);assert.ok(await run('lifeSamples')>samples);
  await run('subject.destroy()');const count=await run('lifeSamples');await wait(100);assert.equal(await run('lifeSamples'),count);
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await run('window.reducedSubject=Pomeranian.mount(testPet);void 0;');assert.equal(await run('reducedSubject.ready'),true);assert.equal(await run('reducedSubject.blink()'),false);await run('reducedSubject.sleep()');await wait(100);await capture('sleep-reduced-live');assert.equal(await run('reducedSubject.getPose()'),'sleeping');await run('reducedSubject.wake()');await wait(80);assert.equal(await run('reducedSubject.getPose()'),'idle');await run('reducedSubject.destroy()');
  clearTimeout(timeout);console.log('Visible blink/reopen, quiet breathing, fixed paws, closed sleep eyes, wake, hidden-surface pause and reduced motion passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

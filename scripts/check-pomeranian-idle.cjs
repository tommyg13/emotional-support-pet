// Policy clock injection avoids waiting minutes while animation still uses real time.
const {app,BrowserWindow}=require('electron');const path=require('node:path');const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:700,height:800,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 w.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_d,cb)=>cb({cancel:true}));
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function setup(){
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');
  await run(`preview.destroy();window.idleClock=0;window.welcomes=[];
   document.getElementById('pet').addEventListener('companion-bubble',e=>welcomes.push(e.detail));
   window.subject=SearchCharacters.mount('pomeranian','docked',document.getElementById('pet'),{input:search,idlePolicy:CompanionIdle.create({now:()=>idleClock,random:()=>.5})});void 0;`);
  assert.equal(await run('subject.ready'),true);
 }
 try{
  await setup();await run('idleClock=31000');await wait(150);assert.equal(await run('subject.getPose()'),'idle-tilt');
  await run("window.dispatchEvent(new PointerEvent('pointermove',{clientX:600,clientY:140}))");await wait(100);assert.equal(await run('subject.getPose()'),'idle');
  await run("idleClock=125000;search.dispatchEvent(new Event('focus'))");assert.equal(await run('welcomes.length'),1);assert.equal(await run('subject.getPose()'),'welcome');
  const message=await run('welcomes[0].message');assert.equal(await run("document.getElementById('careQuote').textContent"),message);
  await run("search.value='back to work';search.dispatchEvent(new Event('input'))");assert.equal(await run('subject.getPose()'),'idle');assert.equal(await run("document.getElementById('careQuote').textContent"),message);
  // Passive reactions never interrupt an active care or play session.
  await run("subject.giveCare('water');idleClock=225001;search.dispatchEvent(new Event('focus'))");await wait(100);
  assert.equal(await run('welcomes.length'),1);assert.equal(await run("subject.react('idle')"),false);assert.equal(await run("subject.react('welcome')"),false);
  await run("subject.play();idleClock=315002;window.dispatchEvent(new PointerEvent('pointermove',{clientX:620,clientY:150}))");await wait(100);
  assert.equal(await run('subject.getPose()'),'playing');assert.equal(await run('welcomes.length'),1);
  await run("window.dispatchEvent(new Event('blur'));idleClock=410003;window.dispatchEvent(new Event('focus'))");
  assert.equal(await run('welcomes.length'),2);assert.notEqual(await run('welcomes[1].message'),message);
  await run("window.dispatchEvent(new Event('blur'));idleClock=540004;window.dispatchEvent(new Event('focus'))");assert.equal(await run('welcomes.length'),3);
  await run('subject.destroy();idleClock=999999;window.dispatchEvent(new Event("focus"))');await wait(150);
  assert.equal(await run('welcomes.length'),3);assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  await w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setup();await run('idleClock=31000');await wait(150);assert.equal(await run('subject.getPose()'),'idle');assert.equal(await run("subject.react('idle')"),false);
  await run("idleClock=95000;window.dispatchEvent(new Event('focus'))");assert.equal(await run('welcomes.length'),1);await run('subject.destroy()');
  assert.deepEqual(errors,[]);console.log('Automatic idle timing, welcome replies, typing priority, care/play protection, cleanup and reduced motion passed.');w.destroy();app.quit();
 }catch(e){console.error(e);app.exit(1);}
});

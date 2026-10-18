// Rendered pose checks plus real pointer capture on the shared desktop page.
const {app,BrowserWindow,ipcMain}=require('electron');const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const timeout=setTimeout(()=>{console.error('Pickup check timed out');app.exit(1);},40000);
app.whenReady().then(async()=>{
 let homes=0;ipcMain.handle('get-settings',()=>({searchCharacter:'pomeranian',catPersonality:'calm'}));ipcMain.handle('cat-home',()=>{homes++;return true;});
 const w=new BrowserWindow({show:false,transparent:true,frame:false,width:900,height:650,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'../src/preload.js'),backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const mouse=(type,x,y)=>w.webContents.sendInputEvent({type,x,y,button:'left',clickCount:1});
 async function shot(name){const im=await w.capturePage({x:50,y:40,width:300,height:300});fs.writeFileSync('/private/tmp/pomeranian-'+name+'.png',im.toPNG());return im.toBitmap();}
 function difference(a,b){let n=0;for(let y=200;y<300;y++)for(let x=0;x<300;x++){const i=(y*300+x)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>50)n++;}return n;}
 async function roam(){await w.loadFile(path.join(__dirname,'../src/roaming-cat.html'),{query:{character:'pomeranian',x:'350',y:'400'}});assert.equal(await run('cat.ready'),true);await run('clearTimeout(firstWalk)');}
 try{
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');
  await run("preview.destroy();document.body.replaceChildren();document.body.style.background='transparent';window.testPet=document.createElement('div');testPet.style.cssText='position:absolute;left:50px;top:40px;width:300px;height:300px';document.body.appendChild(testPet);window.subject=Pomeranian.mount(testPet,{lifePolicy:{sample:()=>({blink:0,breath:0,fast:false}),blink:()=>false,pause(){},setPersonality(){},destroy(){}}});void 0;");assert.equal(await run('subject.ready'),true);await wait(100);
  const standing=await shot('pickup-standing');assert.equal(await run('subject.pickUp()'),true);await wait(300);assert.equal(await run('subject.getPose()'),'held');const held=await shot('pickup-held');assert.ok(difference(standing,held)>120,'relaxed legs differ visibly from standing');
  assert.equal(await run('subject.releasePickup()'),true);assert.equal(await run('subject.getPose()'),'landing');await wait(140);await shot('pickup-landing');await wait(650);assert.equal(await run('subject.getPose()'),'idle');assert.equal(difference(standing,await shot('pickup-settled')),0);
  await run('subject.pickUp()');await wait(250);await run('subject.releasePickup(true)');assert.notEqual(await run('subject.getPose()'),'landing');await wait(550);assert.equal(await run('subject.getPose()'),'idle');
  await run('subject.sleep()');await wait(850);await run('subject.pickUp();subject.releasePickup(true)');await wait(650);assert.equal(await run('subject.getPose()'),'idle');await run('subject.destroy()');
  await roam();mouse('mouseDown',350,310);await wait(40);mouse('mouseMove',420,350);await wait(300);assert.equal(await run('cat.isHeld()'),true);
  const transform=await run('cat.element.style.transform');assert.ok(!transform.endsWith('rotate(0deg)'),'held body has a bounded swing');mouse('mouseUp',420,350);await wait(40);assert.equal(await run('cat.isHeld()'),false);assert.equal(await run('cat.getPose()'),'landing');assert.equal(homes,0);
  await wait(1900);assert.equal(await run('cat.getPose()'),'idle');assert.ok((await run('cat.element.style.transform')).endsWith('rotate(0deg)'));
  await run('cat.setPosition(350,400)');mouse('mouseDown',350,310);await wait(40);mouse('mouseUp',350,310);await wait(80);assert.equal(homes,1);assert.notEqual(await run('cat.getPose()'),'landing');
  mouse('mouseDown',350,310);await wait(40);mouse('mouseMove',430,350);await wait(250);await run("window.dispatchEvent(new Event('blur'))");assert.equal(await run('cat.isHeld()'),false);await wait(650);assert.notEqual(await run('cat.getPose()'),'landing');assert.equal(homes,1);
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await roam();
  mouse('mouseDown',350,310);await wait(40);mouse('mouseMove',430,350);await wait(120);assert.equal(await run('cat.isHeld()'),true);assert.ok((await run('cat.element.style.transform')).endsWith('rotate(0deg)'));mouse('mouseUp',430,350);await wait(80);assert.equal(await run('cat.getPose()'),'idle');await run('cat.destroy()');assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  clearTimeout(timeout);console.log('Visible relaxed paws, landing/rest recovery, cancelled wake, real drag/drop, click-to-home, blur cleanup and reduced motion passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

// Uses the real desktop-window manager, preload and both renderer pages.
const {app,BrowserWindow,ipcMain}=require('electron');const {EventEmitter}=require('node:events');const path=require('node:path');const assert=require('node:assert/strict');
const watchdog=setTimeout(()=>{console.error('Roaming check timed out');app.exit(1);},40000);
app.whenReady().then(async()=>{
 const settings={searchCharacter:'pomeranian',puppyName:'Biscuit',catPersonality:'playful',aiEnabled:false};
 ipcMain.handle('get-settings',()=>settings);ipcMain.handle('ai-status',()=>({configured:false}));
 const preload=path.join(__dirname,'../src/preload.js');
 const dock=new BrowserWindow({show:false,x:100,y:100,width:560,height:270,webPreferences:{preload,backgroundThrottling:false}});
 let roam,click,clicksStopped=false;const handlers={},screen=new EventEmitter();screen.getDisplayMatching=()=>({workArea:{x:0,y:0,width:900,height:650}});screen.getCursorScreenPoint=()=>({x:0,y:0});
 const manager=require('../src/roaming-cat')({app,screen,ipcMain:{handle:(name,fn)=>{handlers[name]=fn;ipcMain.handle(name,fn);},on:(...args)=>ipcMain.on(...args)},BrowserWindow:function(opts){roam=new BrowserWindow({...opts,webPreferences:{...opts.webPreferences,backgroundThrottling:false}});roam.webContents.on('console-message',event=>{if(event.level==='error')console.error(event.message);});return roam;},getDockWindow:()=>dock,getPersonality:()=>settings.catPersonality,getCharacter:()=>settings.searchCharacter,preload,page:path.join(__dirname,'../src/roaming-cat.html'),startClicks:fn=>{click=fn;return {enabled:true,stop(){clicksStopped=true;}};}});
 const run=s=>roam.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function closeRoam(){if(!roam||roam.isDestroyed())return;await new Promise(resolve=>{roam.once('closed',resolve);manager.home();});}
 try{
  await dock.loadFile(path.join(__dirname,'../src/dock.html'));await dock.webContents.executeJavaScript('catController.ready');
  assert.equal(await handlers['cat-release']({sender:dock.webContents}),true);
  assert.equal(await run('cat.ready'),true);await run('clearTimeout(firstWalk)');
  assert.equal(await run('character'),'pomeranian');assert.equal(await dock.webContents.executeJavaScript('catRoaming'),true);
  assert.equal(await dock.webContents.executeJavaScript("document.getElementById('catSit').hidden"),false);
  assert.equal(await dock.webContents.executeJavaScript("document.getElementById('chaseYarn').querySelector('span').textContent"),'Ball');
  await run('cat.setPosition(250,350)');assert.equal(await run('cat.runTo(500,350)'),true);
  assert.deepEqual(await run('cat.getPosition()'),{x:500,y:350});
  assert.equal(await run('cat.walkTo(NaN,100)'),false);
  assert.equal(await run('window.interrupted=cat.walkTo(100,450);cat.stop();interrupted'),false);
  await run('cat.setPosition(650,350);window.reverseMove=cat.walkTo(100,350);void 0;');await wait(80);
  assert.ok((await run('cat.getPosition()')).x>648,'sharp reversal pauses travel while the body turns');
  await wait(650);assert.ok((await run('cat.getPosition()')).x<649,'travel resumes after turning');
  await run('cat.stop()');assert.equal(await run('reverseMove'),false);
  click({x:750,y:500});await wait(150);assert.equal(await run('cat.getPose()'),'walking');await run('cat.stop()');
  assert.equal((await handlers['cat-roam-command']({sender:dock.webContents},'speed')).fast,true);
  assert.equal((await handlers['cat-roam-command']({sender:dock.webContents},'sit')).ok,true);
  await run('cat.setPosition(400,350)');
  const start=await run('cat.getPosition()');
  roam.webContents.sendInputEvent({type:'mouseDown',x:400,y:260,button:'left',clickCount:1});await wait(60);
  assert.equal(await run('cat.isHeld()'),true);
  roam.webContents.sendInputEvent({type:'mouseMove',x:510,y:320,button:'left'});await wait(60);
  roam.webContents.sendInputEvent({type:'mouseUp',x:510,y:320,button:'left',clickCount:1});await wait(80);
  assert.equal(await run('cat.isHeld()'),false);assert.ok((await run('cat.getPosition()')).x>start.x+60);
  await run("document.getElementById('tip').style.opacity='0'");await wait(150);
  require('node:fs').writeFileSync('/private/tmp/pomeranian-roaming.png',(await roam.capturePage()).toPNG());
  await handlers['cat-roam-command']({sender:dock.webContents},'yarn');await wait(800);assert.equal(await run("document.getElementById('chaseYarn').hidden"),false);
  await handlers['cat-home']({sender:dock.webContents});for(let i=0;i<60&&!roam.isDestroyed();i++)await wait(100);
  assert.equal(roam.isDestroyed(),true);assert.equal(clicksStopped,true);assert.equal(await dock.webContents.executeJavaScript('catRoaming'),false);
  
  // Remount with reduced motion; movement completes without bounce or swing.
  assert.equal(await handlers['cat-release']({sender:dock.webContents}),true);await run('cat.ready');
  roam.webContents.debugger.attach('1.3');await roam.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await new Promise(resolve=>{roam.webContents.once('did-finish-load',resolve);roam.reload();});assert.equal(await run('cat.ready'),true);await run('clearTimeout(firstWalk)');
  assert.equal(await run('reduce'),true);assert.equal(await run('cat.runTo(-500,9999)'),true);
  assert.deepEqual(await run('cat.getPosition()'),{x:90,y:642});assert.ok((await run('cat.element.style.transform')).endsWith('rotate(0deg)'));
  await run('cat.jump()');assert.notEqual(await run('cat.getPose()'),'jumping');
  await run('cat.destroy()');assert.equal(await run('cat.walkTo(200,300)'),false);assert.equal(await run('document.querySelectorAll("canvas").length'),0);
  await closeRoam();
  
  // A graphics failure can be retried in place, or brought home without motion.
  assert.equal(await handlers['cat-release']({sender:dock.webContents}),true);await run('cat.ready');await run('clearTimeout(firstWalk)');
  await run("document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");await wait(150);
  assert.equal(await run('cat.getPose()'),'error');
  await run("document.querySelector('button[aria-label=\"Retry loading puppy\"]').click()");assert.equal(await run('cat.ready'),true);assert.equal(await run("document.querySelectorAll('canvas').length"),1);
  await run("document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");await wait(150);
  await handlers['cat-home']({sender:dock.webContents});await wait(150);assert.equal(roam.isDestroyed(),true);
  
  // A second display with a negative origin uses local screen coordinates, and disconnect safely returns home.
  screen.getDisplayMatching=()=>({workArea:{x:-900,y:0,width:900,height:650}});
  assert.equal(await handlers['cat-release']({sender:dock.webContents}),true);await run('cat.ready');await run('clearTimeout(firstWalk)');
  assert.ok(roam.getBounds().x<0);await run('cat.setPosition(400,350)');click({x:roam.getBounds().x+600,y:roam.getBounds().y+450});await wait(150);assert.equal(await run('cat.getPose()'),'walking');
  const disconnected=roam;screen.emit('display-removed');await wait(120);assert.equal(disconnected.isDestroyed(),true);assert.equal(await dock.webContents.executeJavaScript('catRoaming'),false);
  screen.getDisplayMatching=()=>({workArea:{x:0,y:0,width:900,height:650}});
  // The shared page still mounts and moves the original SVG cat.
  settings.searchCharacter='wizard-cat';assert.equal(await handlers['cat-release']({sender:dock.webContents}),true);
  await run('clearTimeout(firstWalk)');assert.equal(await run('character'),'wizard-cat');assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  await run('cat.setPosition(300,400)');assert.equal(await run('cat.runTo(350,400)'),true);
  manager.home();dock.destroy();clearTimeout(watchdog);console.log('Puppy undock, bounded movement, cancellation, desktop targets, drag/drop, ball chase and running home passed.');app.quit();
 }catch(error){console.error(error);manager.home();dock.destroy();app.exit(1);}
});

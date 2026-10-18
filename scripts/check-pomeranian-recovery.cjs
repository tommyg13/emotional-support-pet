// Failure injection checks local loading, actual WebGL loss and retry in the real dock.
const {app,BrowserWindow,ipcMain}=require('electron');const path=require('node:path');const assert=require('node:assert/strict');
const watchdog=setTimeout(()=>{console.error('Recovery check timed out');app.exit(1);},25000);
app.whenReady().then(async()=>{
 ipcMain.handle('get-settings',()=>({searchCharacter:'pomeranian',puppyName:'Biscuit',catPersonality:'playful',aiEnabled:false}));
 ipcMain.handle('ai-status',()=>({configured:false}));
 const w=new BrowserWindow({show:false,width:400,height:193,webPreferences:{preload:path.join(__dirname,'../src/preload.js'),backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function retry(){await run("document.querySelector('#cat button[aria-label=\"Retry loading puppy\"]').click()");assert.equal(await run('catController.ready'),true);assert.equal(await run("catController.element.dataset.state"),'ready');assert.equal(await run("document.querySelectorAll('#cat canvas').length"),1);}
 try{
  let blockModel=true;
  w.webContents.session.webRequest.onBeforeRequest({urls:['file:///*']},(details,done)=>done({cancel:blockModel&&details.url.endsWith('/pomeranian.glb')}));
  await w.loadFile(path.join(__dirname,'../src/dock.html'));assert.equal(await run('catController.ready'),false);
  assert.equal(await run('catController.element.dataset.state'),'error');assert.equal(await run('catController.play()'),false);
  assert.equal(await run("catController.element.getAttribute('aria-busy')"),'false');
  blockModel=false;await retry();
  await run("catController.react('welcome')");assert.ok((await run("document.getElementById('yarnBubble').textContent")).startsWith('Biscuit says: '));
  assert.equal(await run("!!document.querySelector('#cat canvas').getContext('webgl2').getExtension('WEBGL_lose_context')"),true);
  await run("document.querySelector('#cat canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");await wait(150);
  assert.equal(await run('catController.element.dataset.state'),'error');assert.equal(await run('catController.giveCare("water")'),false);
  assert.equal(await run("document.getElementById('yarnBubble').hidden"),true);await retry();
  await run("selectSearchCharacter('wizard-cat')");assert.equal(await run("document.querySelectorAll('#cat canvas').length"),0);
  clearTimeout(watchdog);console.log('Blocked model recovery, real graphics-context loss, retry, preserved name and cat switching passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

// Exercises the real preload IPC listener and dock renderer without changing saved settings.
const {app,BrowserWindow,ipcMain}=require('electron');const path=require('node:path');const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 ipcMain.handle('get-settings',()=>({searchCharacter:'pomeranian',puppyName:'Biscuit',catPersonality:'calm',aiEnabled:false}));
 ipcMain.handle('ai-status',()=>({configured:false}));
 const w=new BrowserWindow({show:false,width:400,height:193,webPreferences:{preload:path.join(__dirname,'../src/preload.js'),backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function send(value){w.webContents.send('companion-dev-action',value);await wait(100);}
 try{
  await w.loadFile(path.join(__dirname,'../src/dock.html'));assert.equal(await run('catController.ready'),true);
  await send('idle');assert.ok(['idle-tilt','idle-look'].includes(await run('catController.getPose()')));
  await run("window.dispatchEvent(new Event('blur'))");await send('welcome');assert.equal(await run('catController.getPose()'),'welcome');
  assert.ok((await run("document.getElementById('yarnBubble').textContent")).startsWith('Biscuit says: '));
  await send('water');assert.equal(await run('catController.getPose()'),'water');await run("window.dispatchEvent(new Event('blur'))");await send('snack');assert.equal(await run('catController.getPose()'),'snack');
  await send('play');assert.equal(await run('catController.getPose()'),'playing');
  await send('invalid');assert.equal(await run('catController.getPose()'),'playing');
  await run("selectSearchCharacter('wizard-cat')");await send('welcome');assert.equal(await run('selectedCharacter'),'wizard-cat');assert.equal(await run("document.querySelectorAll('#cat canvas').length"),0);
  console.log('Real preload routes puppy developer reactions; named welcome, care, ball and cat isolation passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

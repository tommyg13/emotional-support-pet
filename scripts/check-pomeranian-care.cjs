// Desktop-only integration check: real pointer delivery plus cancellation paths.
const {app,BrowserWindow}=require('electron');const path=require('node:path');const assert=require('node:assert/strict');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:700,height:780,webPreferences:{backgroundThrottling:false}});
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 w.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_d,cb)=>cb({cancel:true}));
 const run=code=>w.webContents.executeJavaScript(code),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function setup(){
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));assert.equal(await run('preview.ready'),true);
  await run(`window.careEvents={delivered:0,completed:0,messages:[]};
   document.getElementById('pet').addEventListener('cat-manual-care-delivered',()=>careEvents.delivered++);
   document.getElementById('pet').addEventListener('cat-manual-care-complete',e=>{careEvents.completed++;careEvents.messages.push(e.detail.message);});`);
 }
 async function deliver(kind){
  assert.equal(await run(`preview.beginManualCare('${kind}')`),true);
  assert.equal(await run(`(()=>{const p=preview.renderer.getCareTarget();return preview.updateManualCare(p.x,p.y);})()`),true);
 }
 try{
  await setup();
  assert.equal(await run("preview.beginManualCare('constructor')"),false);
  assert.equal(await run("preview.giveCare('water')"),true);await wait(2000);
  assert.equal(await run('careEvents.completed'),0);
  assert.equal(await run("preview.beginManualCare('snack')"),true);
  assert.equal(await run('preview.updateManualCare(-200,-200)'),false);
  await run('preview.cancelManualCare()');await wait(300);assert.equal(await run('careEvents.delivered'),0);
  // Exercise the real long-press button and pointer capture in the preview.
  const button=await run("(()=>{const r=water.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()");
  w.webContents.sendInputEvent({type:'mouseMove',...button});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...button});await wait(650);
  assert.equal(await run("document.querySelector('[data-care-target]').style.display"),'block');
  const target=await run('preview.renderer.getCareTarget()'),point={x:Math.round(target.x),y:Math.round(target.y)};
  w.webContents.sendInputEvent({type:'mouseMove',...point});await wait(120);w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
  assert.equal(await run('careEvents.delivered'),1);assert.equal(await run('careEvents.completed'),0);
  await wait(250);
  assert.ok(await run(`(()=>{const item=document.querySelector('[data-care-item]'),p=preview.renderer.getCareTarget(),b=preview.element.getBoundingClientRect();
   const origin=getComputedStyle(item).transformOrigin.split(' ').map(parseFloat);
   const x=b.left+(parseFloat(item.style.left)+origin[0])*b.width/preview.element.clientWidth;
   const y=b.top+(parseFloat(item.style.top)+origin[1])*b.height/preview.element.clientHeight;
   return Math.hypot(x-p.x,y-p.y)<5;})()`));
  await wait(1500);assert.equal(await run('careEvents.completed'),1);
  assert.ok(await run("document.getElementById('careQuote').textContent.length>0"));
  w.webContents.sendInputEvent({type:'mouseMove',...button});w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...button});await wait(600);
  await run("search.value='interrupt';search.dispatchEvent(new Event('input'))");
  assert.equal(await run("document.querySelector('[data-care-carry]').style.display"),'none');
  w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...button});
  await run("preview.setPersonality('sleepy')");await deliver('snack');await wait(1700);assert.equal(await run('careEvents.completed'),2);
  await deliver('snack');await wait(1700);assert.equal(await run('careEvents.completed'),3);
  assert.notEqual(await run('careEvents.messages[1]'),await run('careEvents.messages[2]'));
  await deliver('water');await run('preview.play()');await wait(1700);assert.equal(await run('careEvents.completed'),3);
  await deliver('snack');await run("window.dispatchEvent(new Event('blur'))");await wait(1700);assert.equal(await run('careEvents.completed'),3);
  await deliver('water');await run('preview.destroy();preview.destroy()');await wait(1600);
  assert.equal(await run('careEvents.completed'),3);assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  await w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setup();await deliver('water');await wait(1700);assert.equal(await run('careEvents.completed'),1);
  assert.deepEqual(errors,[]);console.log('Long-press delivery, mouth anchoring, completion-only quotes, interruption, cleanup and reduced-motion checks passed.');w.destroy();app.quit();
 }catch(e){console.error(e);app.exit(1);}
});

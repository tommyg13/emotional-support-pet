// Inspect real rendered feeding and paw contact without exposing renderer internals in the app.
const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
const timeout=setTimeout(()=>app.exit(1),30000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:500,height:600,webPreferences:{backgroundThrottling:false}}),run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');await run('preview.destroy()');
  let source=fs.readFileSync(path.join(__dirname,'../src/pomeranian.js'),'utf8').replace('const Pomeranian =','window.TestPomeranian =').replace("new URL('.', document.currentScript.src)",JSON.stringify(pathToFileURL(path.join(__dirname,'../src/')).href));
  source=source.replace('const target=(manualCare||delivery)?getCareTarget():null;',`if(ballSession&&battingBones.length){const p=battingBones[2].bone.getWorldPosition(new T.Vector3());window.contactSamples.push({u:(now-ballSession.start)/ballSession.duration,paw:[p.x,p.y,p.z],ball:[ball.position.x,ball.position.y,ball.position.z]});}window.careSamples.push({...careMotion});const target=(manualCare||delivery)?getCareTarget():null;`);
  await run(source+";void 0;");await run("window.contactSamples=[];window.careSamples=[];window.subject=TestPomeranian.mount(document.getElementById('pet'),{lifePolicy:{sample:()=>({blink:0,breath:0,fast:false}),blink:()=>false,pause(){},setPersonality(){},destroy(){}}});void 0");assert.equal(await run('subject.ready'),true);
  for(const kind of ['water','snack']){
   await run(`careSamples=[];subject.giveCare('${kind}')`);await wait(700);fs.writeFileSync('/private/tmp/pomeranian-'+kind+'-live.png',(await w.capturePage()).toPNG());await wait(950);
   const samples=await run('careSamples');assert.ok(samples.some(s=>s.chew>.4||s.lap>.8));assert.deepEqual(samples.at(-1),{chew:0,lap:0,nod:0});
  }
  await run("subject.setPersonality('playful');subject.play()");await wait(1300);fs.writeFileSync('/private/tmp/pomeranian-paw-contact-live.png',(await w.capturePage()).toPNG());await wait(800);
  const samples=await run('contactSamples'),contact=samples.filter(s=>s.u>.31&&s.u<.36);assert.ok(contact.length>=2);
  assert.ok(contact.every(s=>s.ball.every(Number.isFinite)));
  const gap=Math.min(...contact.map(s=>Math.hypot(...s.paw.map((v,i)=>v-s.ball[i]))));assert.ok(gap<.18,`Paw reaches ball surface: center gap ${gap}`);
  await run("subject.react('tilt')");await wait(100);await run('subject.destroy()');assert.deepEqual(errors,[]);clearTimeout(timeout);console.log('Visible feeding, reset and paw-contact checks passed.');w.destroy();app.quit();
 }catch(e){console.error(e);app.exit(1);}
});

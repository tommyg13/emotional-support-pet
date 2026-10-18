// Pixel checks for actual body turns and leg animation, independent of desktop position.
const {app,BrowserWindow}=require('electron');const path=require('node:path');const fs=require('node:fs');const assert=require('node:assert/strict');
const timeout=setTimeout(()=>{console.error('Gait check timed out');app.exit(1);},30000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,transparent:true,frame:false,width:400,height:400,backgroundColor:'#00000000',webPreferences:{backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function capture(name){const image=await w.capturePage({x:50,y:40,width:300,height:300});if(name)fs.writeFileSync('/private/tmp/pomeranian-'+name+'.png',image.toPNG());return image.toBitmap();}
 function headCenter(pixels){let total=0,sum=0;for(let y=0;y<150;y++)for(let x=0;x<300;x++){const i=(y*300+x)*4;if(pixels[i+3]>100){total++;sum+=x;}}assert.ok(total>400);return sum/total;}
 function torsoCenter(pixels){let n=0,sum=0;for(let y=100;y<195;y++)for(let x=0;x<300;x++)if(pixels[(y*300+x)*4+3]>100){n++;sum+=y;}return sum/n;}
 function changed(a,b,top,bottom){let n=0;for(let y=top;y<bottom;y++)for(let x=0;x<300;x++){const i=(y*300+x)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>50)n++;}return n;}
 try{
  await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');
  await run("preview.destroy();document.body.replaceChildren();document.body.style.background='transparent';window.testPet=document.createElement('div');testPet.style.cssText='position:absolute;left:50px;top:40px;width:300px;height:300px';document.body.appendChild(testPet);window.subject=Pomeranian.mount(testPet,{lifePolicy:{sample:()=>({blink:0,breath:0,fast:false}),blink:()=>false,pause(){},setPersonality(){},destroy(){}}});void 0;");assert.equal(await run('subject.ready'),true);
  assert.equal(await run('subject.setHeading(1,0)'),true);await wait(1200);const right=await capture('face-right');
  assert.equal(await run('subject.setHeading(-1,0)'),true);await wait(1200);const left=await capture('face-left');
  assert.ok(headCenter(right)>headCenter(left)+35,'head visibly changes sides when the body turns');
  await run('subject.setHeading(1,0)');await wait(1200);
  assert.equal(await run("subject.setLocomotion('walk',80)"),true);await wait(150);const a=await capture('walk-a');await wait(180);const b=await capture('walk-b');
  assert.ok(changed(a,b,200,300)>120,'articulated paws visibly move');assert.ok(Math.abs(torsoCenter(a)-torsoCenter(b))<1.5,'weight shift does not turn into a whole-body hop');
  assert.equal(await run("subject.setLocomotion('run',150)"),true);await wait(200);assert.equal(await run('subject.getPose()'),'running');
  await run("subject.setLocomotion('idle')");await wait(350);assert.equal(await run('subject.getPose()'),'idle');
  const restA=await capture();await wait(200);const restB=await capture();assert.equal(changed(restA,restB,200,300),0);
  assert.equal(await run('subject.setHeading(NaN,0)'),false);await run('subject.destroy()');assert.equal(await run("document.querySelectorAll('canvas').length"),0);
  clearTimeout(timeout);console.log('Visible left/right body turns, moving paws, steady torso, trot, rest recovery and cleanup passed.');w.destroy();app.quit();
 }catch(error){console.error(error);app.exit(1);}
});

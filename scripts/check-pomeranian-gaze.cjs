// Run with npm run check:pomeranian (requires a desktop session).
const {app,BrowserWindow}=require('electron');const path=require('node:path');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:700,height:760,webPreferences:{backgroundThrottling:false}});
 const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>w.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const cap=async part=>{
 const r=await run(`(()=>{const r=document.querySelector('#pet canvas').getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y+r.height*${part==='feet'?.8:0}),width:Math.floor(r.width),height:Math.floor(r.height*${part==='feet'?.18:.65})};})()`);
 return (await w.webContents.capturePage(r)).toBitmap();};
 const diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>3)n++;return n;};
 try{
 await w.loadFile(path.join(__dirname,'../previews/pomeranian-studio.html'));await run('preview.ready');await wait(400);
 const feet=await cap('feet'),head=await cap('head');
 await run("window.dispatchEvent(new PointerEvent('pointermove',{clientX:650,clientY:130}))");await wait(1000);
 const headRight=await cap('head'),rightFeet=await cap('feet');

 if(diff(feet,rightFeet)>10)throw Error('Pointer moved the planted paws');if(diff(head,headRight)<100)throw Error('Head did not visibly move');
 await wait(1000);if(diff(headRight,await cap('head'))>300)throw Error('Head kept drifting');
 await run("window.dispatchEvent(new PointerEvent('pointermove',{clientX:20,clientY:350}))");await wait(1000);

 await run("window.dispatchEvent(new Event('blur'))");await wait(1200);
 if(diff(head,await cap('head'))>300)throw Error('Head did not return to neutral');
 await run("search.value='hello';search.dispatchEvent(new Event('input'))");await wait(600);
 if(diff(head,await cap('head'))<100)throw Error('No search glance');
 await run("preview.react('wag')");await wait(1800);await run('preview.destroy()');
 if(await run("document.querySelectorAll('canvas').length"))throw Error('Leaked canvas');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Visible head tracking, stationary paws, stable gaze, blur reset, search glance and cleanup passed.');w.destroy();app.quit();
 }catch(e){console.error(e);app.exit(1);}
});

const {test}=require('node:test');const assert=require('node:assert/strict');const {EventEmitter}=require('node:events');const install=require('../src/roaming-cat');
function fixture(fail=false,personality='calm',character='wizard-cat'){
 const handlers={},events=[],windows=[];let click,stopped=false;let cursor={x:0,y:0};
 class Win extends EventEmitter{constructor(bounds){super();this.bounds=bounds;this.dead=false;this.webContents=new EventEmitter();this.webContents.isDestroyed=()=>false;this.webContents.send=(...v)=>events.push(v);windows.push(this);}getBounds(){return this.bounds;}isDestroyed(){return this.dead;}setAlwaysOnTop(){}setVisibleOnAllWorkspaces(){}setIgnoreMouseEvents(v){this.ignored=v;}showInactive(){}async loadFile(){if(fail)throw Error('load failed');}close(){if(!this.dead){this.dead=true;this.emit('closed');}}}
 const dock=new Win({x:100,y:300,width:560,height:270});const app=new EventEmitter();app.whenReady=async()=>{};const screen=new EventEmitter();screen.getDisplayMatching=()=>({workArea:{x:0,y:0,width:1200,height:800}});screen.getCursorScreenPoint=()=>cursor;
 install({app,screen,BrowserWindow:Win,ipcMain:{handle:(n,f)=>handlers[n]=f,on:(n,f)=>handlers[n]=f},getDockWindow:()=>dock,preload:'preload.js',page:'roaming-cat.html',getPersonality:()=>personality,getCharacter:()=>character,startClicks:cb=>{click=cb;return {enabled:true,stop(){stopped=true;}};}});
 return {click:p=>click(p),stopped:()=>stopped,handlers,dock,events,windows,cursor:p=>cursor=p,event:()=>({sender:windows.at(-1).webContents})};
}
test('release is authorized, unique, and restores dock when clicked home',async()=>{
 const f=fixture();assert.equal(await f.handlers['cat-release']({sender:{}}),false);
 assert.equal(await f.handlers['cat-release']({sender:f.dock.webContents}),true);assert.ok(f.events.some(e=>e[0]==='cat-roaming'&&e[1]===true));
 await f.handlers['cat-release']({sender:f.dock.webContents});assert.equal(f.windows.length,2);
 assert.equal(f.handlers['cat-home']({sender:{}}),false);assert.equal(f.handlers['cat-home'](f.event()),true);
 assert.equal(f.windows.at(-1).isDestroyed(),false);assert.equal(f.events.at(-1)[0],'cat-roam-home');f.handlers['cat-home-arrived'](f.event());
 assert.deepEqual(f.events.at(-1),['cat-roaming',false]);
});
test('desktop stays click-through except at cat or during drag',async()=>{
 const f=fixture();await f.handlers['cat-release']({sender:f.dock.webContents});const win=f.windows.at(-1);
 f.handlers['cat-roam-hit'](f.event(),{x:100,y:100,width:160,height:140});f.cursor({x:120,y:120});await new Promise(r=>setTimeout(r,40));assert.equal(win.ignored,false);
 f.cursor({x:500,y:500});await new Promise(r=>setTimeout(r,40));assert.equal(win.ignored,true);
 f.handlers['cat-roam-held'](f.event(),true);await new Promise(r=>setTimeout(r,40));assert.equal(win.ignored,false);
 f.dock.close();assert.equal(win.isDestroyed(),true);
});
test('failed page load restores dock and cleans up temporary window',async()=>{
 const f=fixture(true);assert.equal(await f.handlers['cat-release']({sender:f.dock.webContents}),false);assert.equal(f.windows.at(-1).isDestroyed(),true);assert.deepEqual(f.events.at(-1),['cat-roaming',false]);
});

test('desktop clicks redirect, ignore dock clicks, and stop listening on return',async()=>{
 const f=fixture();await f.handlers['cat-release']({sender:f.dock.webContents});
 f.click({x:800,y:600});assert.deepEqual(f.events.at(-1),['cat-roam-target',{x:800,y:600}]);
 const count=f.events.length;f.click({x:200,y:400});assert.equal(f.events.length,count);
 f.handlers['cat-home'](f.event());f.click({x:900,y:400});assert.equal(f.events.at(-1)[0],'cat-roam-home');
 f.handlers['cat-home-arrived'](f.event());assert.equal(f.stopped(),true);
});

test('dock commands release cat when needed, toggle speed, and reject unauthorized input',async()=>{
 const f=fixture();assert.deepEqual(await f.handlers['cat-roam-command']({sender:{}},'jump'),{ok:false});
 assert.deepEqual(await f.handlers['cat-roam-command']({sender:f.dock.webContents},'invalid'),{ok:false});
 assert.deepEqual(await f.handlers['cat-roam-command']({sender:f.dock.webContents},'jump'),{ok:true,fast:false});assert.equal(f.windows.length,2);
 assert.deepEqual(f.events.at(-1),['cat-roam-command',{command:'jump',fast:false}]);
 assert.equal((await f.handlers['cat-roam-command']({sender:f.dock.webContents},'speed')).fast,true);
 assert.equal((await f.handlers['cat-roam-command']({sender:f.dock.webContents},'speed')).fast,false);
 f.dock.close();
});

test('typing attracts roamer with personality, scales dock coordinates, and is throttled',async()=>{
 const f=fixture(false,'playful');await f.handlers['cat-release']({sender:f.dock.webContents});
 const count=f.events.length;f.handlers['cat-search-typing']({sender:{}});assert.equal(f.events.length,count);
 f.handlers['cat-search-typing']({sender:f.dock.webContents});assert.deepEqual(f.events.at(-1),['cat-roam-curious',{x:535,y:480,lookX:320,lookY:530,personality:'playful'}]);
 const after=f.events.length;f.handlers['cat-search-typing']({sender:f.dock.webContents});assert.equal(f.events.length,after);
 f.dock.close();
});
test('typing does not override scruff dragging or a home request',async()=>{
 const f=fixture();await f.handlers['cat-release']({sender:f.dock.webContents});f.handlers['cat-roam-held'](f.event(),true);
 const count=f.events.length;f.handlers['cat-search-typing']({sender:f.dock.webContents});assert.equal(f.events.length,count);
 f.handlers['cat-roam-held'](f.event(),false);f.handlers['cat-home'](f.event());const returning=f.events.length;
 f.handlers['cat-search-typing']({sender:f.dock.webContents});assert.equal(f.events.length,returning);f.dock.close();
});

test('static Pomeranian cannot start a roaming window through commands or release IPC',async()=>{
 const f=fixture(false,'calm','pomeranian');
 assert.equal(await f.handlers['cat-release']({sender:f.dock.webContents}),false);
 assert.equal((await f.handlers['cat-roam-command']({sender:f.dock.webContents},'jump')).ok,false);
 assert.equal(f.windows.length,1);
});

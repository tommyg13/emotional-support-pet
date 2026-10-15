const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.join(__dirname,'../src');
function fixture(search='') {
 let now=0,interval=null,registered,unload,removed=false;const dismissed=[],elements={};
 const get=id=>elements[id]||=( {hidden:['countdown','done'].includes(id),textContent:'',value:0} );
 const html=fs.readFileSync(path.join(root,'break-reminder.html'),'utf8');
 const context=vm.createContext({document:{getElementById:get},Date:{now:()=>now},URLSearchParams,location:{search},window:{addEventListener(n,f){if(n==='beforeunload')unload=f;}},
 api:{dismissBreak:v=>dismissed.push(v),onStartStretch:f=>{registered=f;return()=>{removed=true;};}},setInterval:f=>{interval=f;return 1;},clearInterval:()=>{interval=null;}});
 vm.runInContext(fs.readFileSync(path.join(root,'cat-name.js'),'utf8'),context);
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],context);
 return {name:v=>{context.nameValue=v;vm.runInContext("updateCatName(nameValue)",context);},get,dismissed,start:()=>get('start').onclick(),advance:t=>{now=t;interval?.();},active:()=>!!interval,signal:()=>registered(),unload:()=>unload(),removed:()=>removed};
}
test('20-second activity completes once using elapsed time and allows explicit finish',()=>{
 const f=fixture();f.start();assert.ok(f.active());assert.equal(f.get('start').hidden,true);
 f.advance(9000);assert.equal(f.get('seconds').textContent,'11 seconds');assert.equal(f.get('progress').value,9);
 f.signal();f.advance(19000);assert.equal(f.get('seconds').textContent,'1 second');
 f.advance(25000);assert.equal(f.active(),false);assert.equal(f.get('title').textContent,'Nice—welcome back!');
 assert.equal(f.get('done').hidden,false);assert.equal(f.get('snooze').hidden,false);
 f.get('done').onclick();assert.deepEqual(f.dismissed,[false]);
});
test('close and snooze remain usable during activity and clear timer',()=>{
 for(const id of ['close','snooze']) {const f=fixture();f.start();f.get(id).onclick();assert.equal(f.active(),false);assert.deepEqual(f.dismissed,[true]);}
});
test('developer launch starts immediately and unload removes timer and listener',()=>{
 const f=fixture('?stretch=1');assert.ok(f.active());assert.equal(f.get('countdown').hidden,false);
 f.unload();assert.equal(f.active(),false);assert.equal(f.removed(),true);
});
test('popup and settings scripts parse and developer action preserves access guard',()=>{
 for(const name of ['settings.html','break-reminder.html']) {
  const html=fs.readFileSync(path.join(root,name),'utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 }
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');new vm.Script(main);new vm.Script(fs.readFileSync(path.join(root,'preload.js'),'utf8'));
 assert.match(main,/if \(!DEV_MODE \|\| !settingsWin \|\| event.sender !== settingsWin.webContents\) return false;/);
 assert.match(main,/action === 'stretch'/);
});

test('stretch name updates in ready, activity, and completed states; empty name restores default',()=>{
 const f=fixture();f.name('Mochi');assert.match(f.get('message').textContent,/Mochi thinks/);
 f.start();assert.equal(f.get('title').textContent,'Stretch with Mochi');
 f.name('<Pip>');assert.equal(f.get('title').textContent,'Stretch with <Pip>');
 f.advance(20000);assert.match(f.get('message').textContent,/<Pip> approves/);
 f.name('');assert.match(f.get('message').textContent,/Your cat approves/);
});

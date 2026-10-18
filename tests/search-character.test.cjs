const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function fixture() {
 const calls=[];let destroyed=0;let resolve;
 const renderer={element:{querySelector:()=>({getBoundingClientRect:()=>({x:12,width:90})})},
  walkTo:(...args)=>{calls.push(['walkTo',...args]);return new Promise(r=>{resolve=r;});},
  watchAt:(...args)=>calls.push(['look',...args]),
  destroy:()=>{destroyed++;resolve?.(false);}};
 for(const name of ['sit','stop','jump','setSpeed','setPosition','getPosition','getPose','isHeld','drop','setPersonality','searchCompleted','queryReset','giveCare','beginManualCare','updateManualCare','cancelManualCare','playYarn','setMood']) renderer[name]=(...args)=>{calls.push([name,...args]);return name==='getPose'?'idle':true;};
 const context=vm.createContext({TypingCat:{mount:()=>renderer,careIcons:{water:'water-svg'},yarnIcon:'yarn-svg'},WalkingCat:{mount:()=>renderer}});
 vm.runInContext('const TypingCat = globalThis.TypingCat; const WalkingCat = globalThis.WalkingCat; delete globalThis.TypingCat; delete globalThis.WalkingCat;',context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/search-character.js'),'utf8'),context);
 return {api:context.SearchCharacters,calls,destroyed:()=>destroyed,arrive:()=>resolve(true)};
}
test('predefined registry rejects arbitrary character IDs and unsupported modes before mounting',()=>{
 const f=fixture();assert.equal(f.api.predefined[0].type,'svg');
 assert.ok(Object.isFrozen(f.api.predefined));assert.ok(Object.isFrozen(f.api.predefined[0].items));
 assert.throws(()=>f.api.mount('/tmp/custom.glb','docked',{}),/Unknown predefined/);
 assert.throws(()=>f.api.mount('wizard-cat','3d',{}),/Unsupported character mode/);
});
test('docked controller routes care, play and search to existing animations and reports capabilities',()=>{
 const f=fixture(),c=f.api.mount('wizard-cat','docked',{}, {input:{}});
 assert.equal(c.supports('giveCare'),true);assert.equal(c.supports('walkTo'),false);
 assert.equal(c.walkTo(1,2),false);c.giveCare('snack');c.play();c.searchCompleted();c.react('happy');
 assert.deepEqual(f.calls,[['giveCare','snack'],['playYarn'],['searchCompleted'],['setMood','happy']]);
 assert.equal(c.icons.toy,'yarn-svg');assert.equal(c.definition.items.food,'fish');
});
test('roaming controller preserves arrival results and forces running without losing home bounds',async()=>{
 const f=fixture(),c=f.api.mount('wizard-cat','roaming',{});
 assert.equal(c.supports('runTo'),true);assert.equal(c.supports('giveCare'),false);
 const arrival=c.runTo(30,40,{home:true,run:false});f.arrive();assert.equal(await arrival,true);
 assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])),['walkTo',30,40,{home:true,run:true}]);
 c.lookAt({x:1,y:2},12);c.sit();assert.equal(c.getPose(),'idle');assert.equal(c.getBounds().width,90);
});
test('destroy resolves pending movement, cleans up exactly once and disables all actions',async()=>{
 const f=fixture(),c=f.api.mount('wizard-cat','roaming',{});
 const arrival=c.walkTo(20,30);c.destroy();c.destroy();assert.equal(await arrival,false);
 assert.equal(f.destroyed(),1);assert.equal(c.supports('sit'),false);assert.equal(c.sit(),false);
 assert.equal(c.getBounds(),false);assert.equal(f.calls.length,1);
});

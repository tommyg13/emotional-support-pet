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
 for(const name of ['blink','sit','sleep','wake','setName','stop','jump','setSpeed','setPosition','getPosition','getPose','isHeld','drop','setPersonality','searchCompleted','queryReset','giveCare','beginManualCare','updateManualCare','cancelManualCare','playYarn','play','setMood','react']) renderer[name]=(...args)=>{calls.push([name,...args]);return name==='getPose'?'idle':true;};
 const context=vm.createContext({Panda:{mount:()=>renderer,careIcons:{water:'water-svg',snack:'bamboo-svg'},toyIcon:'leaf-svg'},Pomeranian:{mount:()=>renderer,careIcons:{water:'bowl-svg',snack:'bone-svg'},toyIcon:'ball-svg'},TypingCat:{mount:()=>renderer,careIcons:{water:'water-svg'},yarnIcon:'yarn-svg'},WalkingCat:{mount:()=>renderer},RoamingDog:{mount:()=>renderer}});
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

test('Pomeranian advertises its own items and only supported docked actions',async()=>{
 const f=fixture(),c=f.api.mount('pomeranian','docked',{});
 assert.equal(c.definition.type,'3d');assert.equal(c.definition.items.food,'bone');
 assert.equal(c.icons.toy,'ball-svg');assert.equal(c.supports('walkTo'),false);
 assert.equal(c.supports('beginManualCare'),true);assert.equal(c.supports('play'),true);
 c.play();c.giveCare('snack');c.searchCompleted();assert.equal(await c.ready,true);
 assert.deepEqual(f.calls,[['play'],['giveCare','snack'],['searchCompleted']]);
 assert.ok(c.definition.modes.includes('roaming'));
 c.destroy();assert.equal(c.play(),false);
});

test('Pomeranian manual-care actions forward through the common controller',()=>{
 const f=fixture(),c=f.api.mount('pomeranian','docked',{});
 c.beginManualCare('water');c.updateManualCare(140,150);c.cancelManualCare();
 assert.deepEqual(f.calls,[['beginManualCare','water'],['updateManualCare',140,150],['cancelManualCare']]);
 c.destroy();assert.equal(c.beginManualCare('water'),false);
});

test('roaming dog forwards movement and running including supported rest poses',async()=>{
 const f=fixture(),c=f.api.mount('pomeranian','roaming',{});
 assert.equal(c.supports('sit'),true);assert.equal(c.supports('jump'),true);
 const arrival=c.runTo(130,240,{home:true});f.arrive();assert.equal(await arrival,true);
 assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])),['walkTo',130,240,{home:true,run:true}]);c.destroy();
});

test('the puppy advertises blink while the SVG cat retains its existing animation contract',()=>{const f=fixture(),dog=f.api.mount('pomeranian','docked',{});assert.equal(dog.supports('blink'),true);dog.blink();assert.deepEqual(f.calls.at(-1),['blink']);const cat=f.api.mount('wizard-cat','docked',{});assert.equal(cat.supports('blink'),false);assert.equal(cat.blink(),false);});


test('panda has its own items and exposes docked care, rest and blink',()=>{
 const f=fixture(),panda=f.api.mount('panda','docked',{});assert.equal(panda.definition.items.food,'bamboo');assert.equal(panda.icons.toy,'leaf-svg');assert.equal(panda.supports('walkTo'),false);assert.equal(panda.supports('sleep'),true);assert.equal(panda.supports('blink'),true);assert.ok(panda.definition.modes.includes('roaming'));
 panda.giveCare('snack');panda.sleep();panda.blink();assert.deepEqual(f.calls,[['giveCare','snack'],['sleep'],['blink']]);panda.destroy();assert.equal(panda.giveCare('snack'),false);
});

test('roaming panda forwards bounded movement through the shared 3D adapter',async()=>{
 const f=fixture(),panda=f.api.mount('panda','roaming',{});assert.equal(panda.supports('giveCare'),false);assert.equal(panda.supports('isHeld'),true);const arrival=panda.runTo(240,310);f.arrive();assert.equal(await arrival,true);assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])),['walkTo',240,310,{run:true}]);panda.destroy();
});

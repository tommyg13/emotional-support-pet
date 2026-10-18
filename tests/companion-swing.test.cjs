const {test}=require('node:test');const assert=require('node:assert/strict');const Swing=require('../src/companion-swing');
test('a held swing is bounded and settles fully after release',()=>{
 const s=Swing.create();s.aim(9000);let peak=0;for(let i=0;i<60;i++)peak=Math.max(peak,Math.abs(s.step(1/60,true)));assert.ok(peak>1&&peak<=18);for(let i=0;i<240;i++)s.step(1/60,false);assert.equal(s.active(),false);assert.equal(s.step(.01,false),0);
});
test('swing remains similar across frame rates and rejects invalid impulses',()=>{
 const a=Swing.create(),b=Swing.create();a.aim(1500);b.aim(1500);let x,y;for(let i=0;i<30;i++)x=a.step(1/60,true);for(let i=0;i<60;i++)y=b.step(1/120,true);assert.ok(Math.abs(x-y)<.05);a.aim(NaN);assert.ok(Number.isFinite(a.step(.016,true)));a.reset();assert.equal(a.active(),false);
});
test('reduced motion always has zero swing',()=>{const s=Swing.create({reduced:true});s.aim(2500);assert.equal(s.step(.03,true),0);assert.equal(s.active(),false);});

const {test}=require('node:test');const assert=require('node:assert/strict');const Life=require('../src/companion-life');
test('blink closes and reopens once, then schedules a future blink without catch-up bursts',()=>{
 let time=0;const p=Life.create({now:()=>time,random:()=>0});assert.equal(p.sample({}).blink,0);time=4500;p.sample({});time+=95;assert.ok(p.sample({}).blink>.999);time+=95;assert.equal(p.sample({}).blink,0);time=50000;assert.equal(p.sample({busy:true}).blink,0);time+=100;assert.equal(p.sample({}).blink,0);
});
test('sleep holds closed eyes and waking reopens them while breathing stays bounded',()=>{
 let time=0;const p=Life.create({now:()=>time});let value;for(let i=0;i<30;i++){time+=33;value=p.sample({sleeping:true});}assert.equal(value.blink,1);for(let i=0;i<20;i++){time+=33;value=p.sample({});assert.ok(value.breath>=0&&value.breath<=1);}assert.equal(value.blink,0);
});
test('hidden and reduced-motion states suppress motion while retaining closed sleep eyes',()=>{
 let time=0;const p=Life.create({now:()=>time});p.blink();time=90;assert.ok(p.sample({}).blink>.9);assert.deepEqual(p.sample({sleeping:true,reduced:true}),{blink:1,breath:0,fast:false});time=90000;p.sample({visible:false});time++;assert.equal(p.sample({}).blink,0);p.destroy();assert.equal(p.blink(),false);assert.deepEqual(p.sample({sleeping:true}),{blink:0,breath:0,fast:false});
});
test('manual blink never queues duplicates and personality changes reschedule cleanly',()=>{let time=0;const p=Life.create({now:()=>time,random:()=>0});assert.equal(p.blink(),true);assert.equal(p.blink(),false);p.setPersonality('playful');time=3500;p.sample({});time+=85;assert.ok(p.sample({}).blink>.99);});

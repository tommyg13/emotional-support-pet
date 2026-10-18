const {test}=require('node:test');const assert=require('node:assert/strict');const {sample}=require('../src/companion-ball');
test('ball remains above the floor and inside its bounded path',()=>{
 for(let ms=0;ms<=4400;ms+=5){const p=sample(ms,4400);assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.x>=-1.12001&&p.x<=-.29999);assert.ok(p.y>=.10999&&p.y<=.15);assert.ok(p.z>=.71999&&p.z<=.92001);}
});
test('roll, contact bounce and return meet continuously before the wag finale',()=>{
 for(const boundary of [.28,.38,.6]){const a=sample((boundary-1e-8)*4400,4400),b=sample(boundary*4400,4400);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-5);}
 assert.equal(sample(0,4400).wag,false);assert.equal(sample(2700,4400).wag,true);
 assert.equal(sample(2700,4400).visible,false);assert.equal(sample(4400,4400).done,true);
 assert.equal(sample(4400,4400).visible,false);
});
test('reduced-motion ball stays stationary and does not request a wag',()=>{
 const a=sample(0,750,true),b=sample(500,750,true);assert.deepEqual(a,b);assert.equal(a.wag,false);assert.equal(a.visible,true);assert.equal(sample(750,750,true).visible,false);
});

test('invalid clocks cannot produce NaN scene positions',()=>{
 for(const [elapsed,duration] of [[NaN,4400],[0,0],[0,-1],[0,Infinity]])assert.throws(()=>sample(elapsed,duration),RangeError);
 assert.deepEqual(sample(-100,4400),sample(0,4400));
});

test('a rig-specific contact point releases the ball with the paw strike',()=>{
 const contact={x:-.275,z:.715};const at=t=>sample(t*4400,4400,false,contact);
 for(const boundary of [.28,.34,.6]){const a=at(boundary-1e-8),b=at(boundary);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-5);}
 assert.ok(Math.abs(at(.34).x-contact.x)<1e-6);assert.ok(at(.36).x<contact.x);assert.equal(at(.6).visible,false);
});

const test=require('node:test'),assert=require('node:assert/strict'),motion=require('../src/companion-interaction.js');
test('feeding cycles settle at both ends and reduced motion stays still',()=>{
 for(const kind of ['snack','water','ball']){
  for(const elapsed of [-1,0,1500,1600])assert.deepEqual(motion.sample(elapsed,1500,kind),{chew:0,lap:0,paw:0,nod:0});
  for(let t=0;t<=1500;t+=13){const m=motion.sample(t,1500,kind);assert.ok(Object.values(m).every(v=>Number.isFinite(v)&&v>=0&&v<=1));assert.deepEqual(motion.sample(t,1500,kind,true),{chew:0,lap:0,paw:0,nod:0});}
 }
 assert.ok(motion.sample(125,1500,'water').lap>0);assert.equal(motion.sample(125,1500,'snack').lap,0);
 assert.throws(()=>motion.sample(NaN,1500,'snack'),RangeError);assert.throws(()=>motion.sample(0,0,'ball'),RangeError);
});
test('paw reaches the ball before roll-away and returns after the push',()=>{
 assert.equal(motion.sample(260,1000,'ball').paw,0);assert.equal(motion.sample(340,1000,'ball').paw,1);assert.ok(motion.sample(380,1000,'ball').paw>.7);assert.equal(motion.sample(460,1000,'ball').paw,0);
});

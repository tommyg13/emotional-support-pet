const {test}=require('node:test');const assert=require('node:assert/strict');const Rest=require('../src/companion-rest');
test('idle posture progresses once from stand to sit to sleep for each personality',()=>{
 for(const [personality,sit,sleep]of [['calm',45000,120000],['playful',60000,180000],['sleepy',30000,90000]]){let clock=0;const p=Rest.create({now:()=>clock,personality});clock=sit-1;assert.equal(p.tick({}),null);clock=sit;assert.equal(p.tick({}),'sit');assert.equal(p.tick({}),null);clock=sleep;assert.equal(p.tick({}),'sleep');assert.equal(p.tick({}),null);p.activity();assert.equal(p.tick({}),null);}
});
test('busy or hidden periods postpone resting and destroyed policies cannot emit poses',()=>{
 let clock=0;const p=Rest.create({now:()=>clock});clock=50000;assert.equal(p.tick({busy:true}),null);clock=90000;assert.equal(p.tick({}),null);clock=100000;assert.equal(p.tick({visible:false}),null);clock=144999;assert.equal(p.tick({}),null);clock=145000;assert.equal(p.tick({}),'sit');p.destroy();clock=999999;assert.equal(p.tick({}),null);
});

test('a requested sleep pose is not replaced by the earlier automatic sit stage',()=>{let clock=60000;const p=Rest.create({now:()=>clock});p.setPose('sleep');clock=110000;assert.equal(p.tick({}),null);p.activity();clock+=45000;assert.equal(p.tick({}),'sit');});

test('hiding and showing an already sleeping pet never sends it backwards to sitting',()=>{let clock=0;const p=Rest.create({now:()=>clock});p.setPose('sleep');p.pause();clock=60000;assert.equal(p.tick({visible:false}),null);clock=180000;assert.equal(p.tick({}),null);});

const {test}=require('node:test');const assert=require('node:assert/strict');const {create}=require('../src/companion-idle');
function fixture(personality='calm'){let t=0;return {policy:create({now:()=>t,random:()=>.5,personality}),at:value=>{t=value;}};}
test('quiet glances start after inactivity and alternate at the chosen cadence',()=>{
 const f=fixture();f.at(29999);assert.equal(f.policy.tick(),null);f.at(30000);assert.equal(f.policy.tick(),'idle-tilt');f.at(89999);assert.equal(f.policy.tick(),null);f.at(90000);assert.equal(f.policy.tick(),'idle-look');
});
test('feeding/play, hidden windows and reduced motion postpone idle gestures',()=>{
 for(const options of [{busy:true},{visible:false},{reduced:true}]){const f=fixture();f.at(30000);assert.equal(f.policy.tick(options),null);f.at(59999);assert.equal(f.policy.tick(),null);f.at(60000);assert.equal(f.policy.tick(),'idle-tilt');}
});
test('welcome needs 90 seconds away and has a two-minute cooldown',()=>{
 const f=fixture();f.at(89999);assert.equal(f.policy.activity(),false);f.at(180000);assert.equal(f.policy.activity(),true);f.at(270001);assert.equal(f.policy.activity(),false);f.at(390002);assert.equal(f.policy.activity(),true);
});
test('idle gestures do not pretend to be human activity and busy returns do not queue greetings',()=>{
 const f=fixture();f.at(30000);f.policy.tick();f.at(90000);f.policy.tick();assert.equal(f.policy.activity(),true);
 const g=fixture();g.at(95000);assert.equal(g.policy.activity({allowWelcome:false}),false);g.at(95001);assert.equal(g.policy.activity(),false);
});
test('personalities change cadence without sharing state between companions',()=>{
 const a=fixture('playful'),b=fixture('sleepy');a.at(20000);b.at(20000);assert.equal(a.policy.tick(),'idle-look');assert.equal(b.policy.tick(),null);b.at(45000);assert.equal(b.policy.tick(),'idle-tilt');
 a.at(21000);a.policy.setPersonality('unknown');a.at(50999);assert.equal(a.policy.tick(),null);a.at(51000);assert.equal(a.policy.tick(),'idle-tilt');
});
test('pausing preserves away time and destroyed policies produce no actions',()=>{
 const f=fixture();f.at(45000);f.policy.pause();f.at(90000);assert.equal(f.policy.activity(),true);f.policy.destroy();f.at(999999);assert.equal(f.policy.activity(),false);assert.equal(f.policy.tick(),null);
});

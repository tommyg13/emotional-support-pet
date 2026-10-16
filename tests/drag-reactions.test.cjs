const {test}=require('node:test');const assert=require('node:assert/strict');const {create}=require('../src/drag-reactions');
function fixture(){let time=0;const events=[];return {events,at:t=>time=t,drag:create({now:()=>time,onReaction:x=>events.push(x)})};}
test('slow movement and a later landing have separate, spaced reactions',()=>{
 const f=fixture();f.drag.begin(0,0);for(let t=100;t<=2000;t+=100){f.at(t);f.drag.move(t/20,0);}assert.deepEqual(f.events,['pickup','slow']);f.at(3500);f.drag.end();assert.deepEqual(f.events,['pickup','slow','landing']);
});
test('sustained fast horizontal movement triggers one playful swing reaction',()=>{
 const f=fixture();f.drag.begin(0,0);f.at(1200);f.drag.move(0,0);f.at(1250);f.drag.move(100,0);f.at(1300);f.drag.move(200,0);f.at(1350);f.drag.move(300,0);assert.deepEqual(f.events,['pickup','fast']);
});
test('a single spike and stationary holding do not trigger speed reactions',()=>{
 const f=fixture();f.drag.begin(0,0);f.at(1200);f.drag.move(0,0);f.at(1250);f.drag.move(100,0);f.at(1300);f.drag.move(100,0);assert.deepEqual(f.events,['pickup']);
});
test('cancellation, rapid re-grabs, and short landings do not spam messages',()=>{
 const f=fixture();f.drag.begin(0,0);f.at(200);f.drag.end();f.at(500);f.drag.begin(0,0);f.at(2500);f.drag.end();assert.deepEqual(f.events,['pickup']);f.at(7000);f.drag.begin(0,0);f.at(8500);f.drag.end(true);assert.deepEqual(f.events,['pickup','pickup']);
});

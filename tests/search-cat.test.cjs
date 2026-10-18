const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const sourceDir = fs.existsSync(path.join(__dirname, '../src/typing-cat.js')) ? path.join(__dirname, '../src') : __dirname;
function fixture(reduced = false) {
  let now = 0, pending, random = 0;
  class Element {
    constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; this.value = ''; }
    addEventListener(n, f) { (this.listeners[n] ||= new Set()).add(f); }
    removeEventListener(n, f) { this.listeners[n]?.delete(f); }
    dispatchEvent(e) { for (const f of this.listeners[e.type] || []) f(e); }
    setAttribute(k, v) { this.attrs[k] = v; }
    getBoundingClientRect() { return {left:0, top:0, width:300, height:364}; }
  }
  const elements = {}, container = new Element(), input = new Element(), window = new Element(), document = new Element();
  input.getBoundingClientRect = () => ({left:-300, top:364, width:300, height:72});
  container.querySelector = id => elements[id] ||= new Element();
  const math = Object.create(Math); math.random = () => random;
  const context = vm.createContext({window, document, performance:{now:() => now}, Date:{now:() => now}, Math:math,
    matchMedia:() => ({matches:reduced}), CustomEvent:class {constructor(type, props) {this.type=type; Object.assign(this, props);}},
    requestAnimationFrame:f => {pending=f; return 1;}, cancelAnimationFrame:() => {pending=null;}});
  vm.runInContext(fs.readFileSync(path.join(sourceDir, 'typing-cat.js'), 'utf8') + '\nthis.cat = TypingCat;', context);
  const controller = context.cat.mount(container, input);
  return {controller, elements, input, window, container,
    setRandom(value) {random=value;},
    step(t) {now=t; const f=pending; pending=null; f?.(t);},
    change(value) {input.value=value; input.dispatchEvent({type:'input'});},
    key(key) {input.dispatchEvent({type:'keydown', key});},
    pending:() => !!pending};
}
test('typing paws continue; occasional peek points toward input and expires', () => {
  const f=fixture(); f.step(2000); f.key('a'); f.change('a'); f.step(2070);
  assert.match(f.elements['#tc-pawL'].attrs.transform, /translate\(0.00 -/);
  f.step(2500); assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(-/);
  f.step(3200); assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(0 /);
  assert.ok(f.pending());
});
test('long clear surprises, short clear does not, expression expires', () => {
  const f=fixture(); f.change('short'); f.change(''); f.step(100);
  assert.ok(!f.elements['#tc-mouth'].attrs.d.includes('a5 7'));
  f.change('a'.repeat(24)); f.change(''); f.step(200);
  assert.ok(f.elements['#tc-mouth'].attrs.d.includes('a5 7'));
  f.step(1400); assert.ok(!f.elements['#tc-mouth'].attrs.d.includes('a5 7'));
});
test('submission reset avoids surprise, celebrates briefly, drag suppresses expression', () => {
  const f=fixture(); f.change('a'.repeat(30)); f.input.value=''; f.controller.searchCompleted(); f.step(100);
  assert.equal(f.elements['#tc-mouth'].attrs.d, 'M135 163 Q150 181 165 163');
  f.change(''); f.step(200); assert.ok(!f.elements['#tc-mouth'].attrs.d.includes('a5 7'));
  f.window.dispatchEvent({type:'cat-drag', detail:true}); f.step(300);
  assert.notEqual(f.elements['#tc-mouth'].attrs.d, 'M135 163 Q150 181 165 163');
  f.window.dispatchEvent({type:'cat-drag', detail:false}); f.step(1300);
  assert.notEqual(f.elements['#tc-mouth'].attrs.d, 'M135 163 Q150 181 165 163');
});
test('reduced motion keeps expressions without celebratory head motion; destroy cleans up', () => {
  const f=fixture(true); f.controller.searchCompleted(); f.step(550);
  const expected = Math.sin(.55 * 2.1) * .6 * .3 * .5;
  assert.equal(f.elements['#tc-body'].attrs.transform, `translate(0 ${expected})`);
  assert.equal(f.elements['#tc-mouth'].attrs.d, 'M135 163 Q150 181 165 163');
  f.controller.destroy(); assert.equal(f.pending(), false);
  assert.equal(f.input.listeners.input.size, 0); assert.equal(f.input.listeners.keydown.size, 0);
});
test('dock inline script syntax is valid and completion is wired to both search paths', () => {
  const html=fs.readFileSync(path.join(sourceDir,'dock.html'),'utf8');
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]; new vm.Script(script);
  assert.equal((script.match(/catController.searchCompleted\(\)/g)||[]).length, 2);
  assert.match(script, /!e.isComposing && !e.repeat/);
});
async function dockFixture(aiEnabled=false, fail=false) {
  const elements={}; let completed=0, resets=0, submitted=[],roamCallback;
  const get=id => elements[id] ||= {value:'', dataset:{}, hidden:true, listeners:{}, classList:{toggle(){}}, insertAdjacentHTML(){}, setAttribute(){}, appendChild(){}, scrollIntoView(){}, replaceChildren(){}, focus(){}, addEventListener(n,f){this.listeners[n]=f;}};
  const settings={aiEnabled, aiProvider:'openai', aiModels:{openai:'test-model'}};
  const api={roamCommand:async command=>{submitted.push(command);return {ok:true,fast:command==='speed'};},onCatRoaming:cb=>{roamCallback=cb;return()=>{};},getSettings:async()=>settings, onCatPersonality(){}, onDevCatAction(){}, onFocusInput(){},
    releaseCat:async()=>{submitted.push('walk');return true;},returnCat:async()=>{submitted.push('home');return true;},aiPanel:async()=>{}, aiStatus:async()=>({configured:true}), searchSubmit:q=>submitted.push(q),
    aiChat:async()=>{if(fail) throw Error('offline'); return {text:'ok',model:'test-model',usage:{}};}};
  const context=vm.createContext({api, document:{getElementById:get, createElement:()=>({scrollIntoView(){}})},
    window:{addEventListener(){}}, TypingCat:{yarnIcon:'',careIcons:{water:'',snack:''},mount:()=>({cancelManualCare(){},playYarn(){submitted.push('yarn');},giveCare(kind){submitted.push(kind);},destroy(){},setPersonality(){},queryReset(){resets++;},searchCompleted(){completed++;}})}});
  vm.runInContext(fs.readFileSync(path.join(sourceDir,'cat-name.js'),'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(sourceDir,'search-character.js'),'utf8'), context);
  const html=fs.readFileSync(path.join(sourceDir,'dock.html'),'utf8');
  vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],context);
  await new Promise(resolve=>setImmediate(resolve));
  return {roaming:v=>roamCallback(v),get, context, completed:()=>completed, resets:()=>resets, submitted};
}
test('dock celebrates browser handoff and AI success, never empty input or failed AI',async()=>{
  for(const [ai,fail] of [[false,false],[true,false],[true,true]]) {
    const f=await dockFixture(ai,fail);
    await vm.runInContext('submit()',f.context); assert.equal(f.completed(),0);
    f.get('q').value='a long query with at least twenty four characters';
    await vm.runInContext('submit()',f.context);
    assert.equal(f.completed(),fail?0:1);
    if(!ai) assert.equal(f.submitted.length,1);
    if(fail) {assert.ok(f.get('q').value.length>24); assert.equal(f.resets(),2);}
    else assert.equal(f.get('q').value,'');
  }
});

// Use fixed random draws to compare personalities without flaky statistical tests.
test('personalities change peek probability and cooldown while retaining typing motion', () => {
  for (const [personality, chanceDraw, cooldown] of [['calm', 0.3, 7000], ['playful', 0.5, 4500], ['sleepy', 0.1, 12000]]) {
    const f = fixture(); f.controller.setPersonality(personality); f.setRandom(chanceDraw);
    f.step(2000); f.key('a'); f.change('a'); f.step(2500);
    assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(-/);
    f.step(2000 + cooldown - 1); f.change('ab'); f.step(2000 + cooldown - 0.5);
    assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(0 /);
    f.step(2000 + cooldown); f.key('c'); f.change('abc'); f.step(2000 + cooldown + 70);
    assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(-/);
    assert.match(f.elements['#tc-pawR'].attrs.transform, /translate\(0.00 -/);
  }
  for (const personality of ['calm', 'sleepy']) {
    const f = fixture(); f.controller.setPersonality(personality); f.setRandom(0.5);
    f.step(2000); f.change('a'); f.step(2500);
    assert.match(f.elements['#tc-eyeL'].attrs.transform, /^translate\(0 /);
  }
});
test('celebrations have distinct personality intensity and honor reduced motion', () => {
  for (const [personality, lift, smile, eye] of [['calm',5,18,.65], ['playful',8,24,.45], ['sleepy',2,10,.8]]) {
    for (const reduced of [false,true]) {
      const f = fixture(reduced); f.controller.setPersonality(personality); f.controller.searchCompleted(); f.step(550);
      const expected = (Math.sin(.55 * 2.1) * .6 - (reduced ? 0 : lift)) * (reduced ? .3 : 1) * .5;
      assert.equal(f.elements['#tc-body'].attrs.transform, `translate(0 ${expected})`);
      assert.equal(f.elements['#tc-mouth'].attrs.d, `M135 163 Q150 ${163 + smile} 165 163`);
      assert.ok(f.elements['#tc-eyeL'].attrs.transform.includes(`scale(1 ${eye.toFixed(3)})`));
      f.step(1200); assert.notEqual(f.elements['#tc-mouth'].attrs.d, `M135 163 Q150 ${163 + smile} 165 163`);
    }
  }
});

function typeContinuously(f, end = 7000) {
  for (let t = 0; t <= end; t += 500) { f.step(t); f.key('a'); }
}
test('sustained typing quiets idle gestures through pauses, then personality returns', () => {
  for (const reduced of [false, true]) {
    const f = fixture(reduced); f.controller.setPersonality('playful'); f.setRandom(.5);
    typeContinuously(f); f.step(7070);
    assert.match(f.elements['#tc-pawL'].attrs.transform, /translate\(0.00 -/);
    f.step(7500); f.step(8000);
    assert.match(f.elements['#tc-head'].attrs.transform, /rotate\(0 150 175\)/);
    f.step(9999); assert.match(f.elements['#tc-head'].attrs.transform, /rotate\(0 150 175\)/);
    f.step(10000); f.step(11200); f.step(11800);
    assert.match(f.elements['#tc-head'].attrs.transform, reduced ? /rotate\(0 150 175\)/ : /rotate\(5 150 175\)/);
  }
});
test('sparse typing does not quiet personality gestures', () => {
  const f = fixture(); f.controller.setPersonality('playful'); f.setRandom(.5);
  for (const t of [0, 2000, 4000]) { f.step(t); f.key('a'); }
  f.step(6500); f.step(7100);
  assert.match(f.elements['#tc-head'].attrs.transform, /rotate\(5 150 175\)/);
});
test('search expressions remain available during a focused typing session', () => {
  const f = fixture(); typeContinuously(f);
  f.controller.searchCompleted(); f.step(7200);
  assert.equal(f.elements['#tc-mouth'].attrs.d, 'M135 163 Q150 181 165 163');
  f.change('a'.repeat(24)); f.change(''); f.step(7300);
  assert.ok(f.elements['#tc-mouth'].attrs.d.includes('a5 7'));
  f.controller.destroy(); assert.equal(f.pending(), false);
});

const welcomeSmile = 'M138 164 Q150 175 162 164';
test('welcome follows real boredom or sleep once, with personality-specific gestures', () => {
  for (const [personality, idle] of [['calm',120000], ['playful',150000], ['sleepy',180000]]) {
    const f = fixture(); f.controller.setPersonality(personality); f.setRandom(.99);
    f.step(idle); assert.notEqual(f.container.dataset.mood, 'normal');
    f.input.dispatchEvent({type:'focus'}); f.step(idle + 700);
    assert.equal(f.elements['#tc-mouth'].attrs.d, welcomeSmile);
    if (personality === 'playful') assert.match(f.elements['#tc-head'].attrs.transform, /rotate\(6 150 175\)/);
    if (personality === 'calm') {
      const body = Number(f.elements['#tc-body'].attrs.transform.match(/translate\(0 ([^)]+)\)/)[1]);
      assert.equal(f.elements['#tc-head'].attrs.transform, `translate(0 ${body * 2 - 3}) rotate(0 150 175)`);
    }
    if (personality === 'sleepy') {
      const scale = Number(f.elements['#tc-eyeL'].attrs.transform.match(/scale\(1 ([^)]+)\)/)[1]);
      assert.ok(scale <= .1 && scale > 0);
    }
    f.input.dispatchEvent({type:'focus'}); f.step(idle + 1500);
    assert.notEqual(f.elements['#tc-mouth'].attrs.d, welcomeSmile);
    f.controller.destroy(); assert.equal(f.input.listeners.focus.size,0);
  }
});
test('normal focus does not greet; typing into an already-focused idle input does', () => {
  const f = fixture(); f.input.dispatchEvent({type:'focus'}); f.step(700);
  assert.notEqual(f.elements['#tc-mouth'].attrs.d,welcomeSmile);
  f.step(120000); f.key('a'); f.step(120070);
  assert.equal(f.elements['#tc-mouth'].attrs.d,welcomeSmile);
  assert.match(f.elements['#tc-pawL'].attrs.transform,/translate\(0.00 -/);
  f.controller.searchCompleted(); f.step(120100);
  assert.equal(f.elements['#tc-mouth'].attrs.d,'M135 163 Q150 181 165 163');
});
test('reduced motion greeting has a smile without added head motion or slow blink', () => {
  const f=fixture(true); f.controller.setPersonality('sleepy'); f.step(60000);
  f.input.dispatchEvent({type:'focus'}); f.step(60700);
  assert.equal(f.elements['#tc-mouth'].attrs.d,welcomeSmile);
  const body=Number(f.elements['#tc-body'].attrs.transform.match(/translate\(0 ([^)]+)\)/)[1]);
  assert.equal(f.elements['#tc-head'].attrs.transform,`translate(0 ${body*2}) rotate(0 150 175)`);
  assert.ok(f.elements['#tc-eyeL'].attrs.transform.includes('scale(1 1.000)'));
});

test('water and fish appear at the mouth, make the cat happy, and expire', () => {
  for (const kind of ['water', 'snack']) {
    const f=fixture(); assert.equal(f.controller.giveCare(kind),true); f.step(300);
    assert.equal(f.elements['#tc-'+kind].attrs.opacity,'1.000');
    assert.equal(f.elements['#tc-'+(kind==='water'?'snack':'water')].attrs.opacity,'0');
    assert.equal(f.elements['#tc-mouth'].attrs.d,'M133 163 Q150 186 167 163');
    f.key('a'); f.step(370); assert.match(f.elements['#tc-pawL'].attrs.transform,/translate\(0.00 -/);
    f.step(1500); assert.equal(Number(f.elements['#tc-'+kind].attrs.opacity),0);
    f.step(2300); assert.notEqual(f.elements['#tc-mouth'].attrs.d,'M133 163 Q150 186 167 163');
  }
});
test('repeated care gives a temporary belly and full signal, spam is bounded', () => {
  const f=fixture(); const events=[]; f.container.addEventListener('cat-care-full',e=>events.push(e.detail.full));
  f.controller.giveCare('water');
  for(let i=0;i<20;i++) assert.equal(f.controller.giveCare('snack'),false);
  for(const t of [400,800,1200,1600]) {f.step(t); f.controller.giveCare('snack');}
  f.step(1800); assert.deepEqual(events,[true]); assert.match(f.elements['#tc-body'].attrs.transform,/scale\(1\./);
  f.step(6200); assert.deepEqual(events,[true,false]);
  for(let t=6250;t<=8500;t+=50) f.step(t);
  assert.ok(!f.elements['#tc-body'].attrs.transform.includes('scale'));
  assert.equal(f.controller.giveCare('invalid'),false);
  f.controller.destroy(); assert.equal(f.controller.giveCare('water'),false);
});
test('care honors dragging and reduced motion; old treats do not accumulate', () => {
  const f=fixture(true); f.window.dispatchEvent({type:'cat-drag',detail:true});
  assert.equal(f.controller.giveCare('snack'),false);
  f.window.dispatchEvent({type:'cat-drag',detail:false});
  for(const t of [0,13000,26000,39000,52000]) {f.step(t); f.controller.giveCare('water');}
  f.step(52300); assert.equal(f.elements['#tc-water'].attrs.opacity,'1.000');
  assert.ok(!f.elements['#tc-body'].attrs.transform.includes('scale'));
  f.step(53500); assert.equal(Number(f.elements['#tc-water'].attrs.opacity),0);
});
test('dock command buttons control the roaming cat without submitting a search',async()=>{
 const f=await dockFixture();f.roaming(true);for(const id of ['catJump','catSpeed','catSit','chaseYarn'])await f.get(id).listeners.click();
 assert.deepEqual(f.submitted,['jump','speed','sit','yarn']);assert.equal(f.completed(),0);
});

function settleNap(f, start=300000) {
  for(let t=start;t<=start+2500;t+=50) f.step(t);
}
test('inactivity settles into a lowered nap pose with closed eyes and mouth drool',()=>{
  const f=fixture(); settleNap(f);
  assert.equal(f.container.dataset.mood,'sleepy');
  assert.ok(Number(f.elements['#tc-drool'].attrs.opacity)>.8);
  assert.ok(Number(f.elements['#tc-sleep-eyes'].attrs.opacity)>.95);
  assert.equal(f.elements['#tc-mouth'].attrs.d,'M137 164 Q150 171 163 164');
  const head=f.elements['#tc-head'].attrs.transform;
  assert.ok(Number(head.match(/rotate\(([^ ]+)/)[1])>7.5);
  assert.ok(Number(head.match(/translate\(0 ([^)]+)/)[1])>9);
  assert.equal(f.elements['#tc-pawL'].attrs.transform,'translate(0.00 0.00) rotate(0.00 100 300)');
});
test('focus, typing, care, or dragging hide sleep drool without breaking wake reactions',()=>{
  for(const action of ['focus','typing','care','drag']) {
    const f=fixture(); settleNap(f);
    if(action==='focus') f.input.dispatchEvent({type:'focus'});
    if(action==='typing') f.key('a');
    if(action==='care') f.controller.giveCare('water');
    if(action==='drag') f.window.dispatchEvent({type:'cat-drag',detail:true});
    f.step(302550); assert.equal(Number(f.elements['#tc-drool'].attrs.opacity),0);
    if(action==='focus'||action==='typing') assert.equal(f.elements['#tc-mouth'].attrs.d,welcomeSmile);
    if(action==='care') assert.equal(f.elements['#tc-mouth'].attrs.d,'M133 163 Q150 186 167 163');
    assert.ok(f.pending());
  }
});
test('reduced-motion naps keep a static head pose and drool; normal cat never drools',()=>{
  const f=fixture(true); f.step(500); assert.equal(Number(f.elements['#tc-drool'].attrs.opacity),0);
  settleNap(f); assert.ok(Number(f.elements['#tc-drool'].attrs.opacity)>.8);
  const body=Number(f.elements['#tc-body'].attrs.transform.match(/translate\(0 ([^)]+)/)[1]);
  assert.equal(f.elements['#tc-head'].attrs.transform,`translate(0 ${body*2}) rotate(0 150 175)`);
});

test('yarn rolls, head and eyes follow, smiles on approach, and ignores repeat clicks',()=>{
  const f=fixture(); assert.equal(f.controller.playYarn(),true); f.step(300);
  assert.equal(f.elements['#tc-yarn'].attrs.opacity,'1');
  const before=f.elements['#tc-yarn'].attrs.transform;
  const earlyTilt = Number(f.elements['#tc-head'].attrs.transform.match(/rotate\(([^ ]+)/)[1]);
  assert.equal(f.controller.playYarn(),false); f.step(900);
  assert.notEqual(f.elements['#tc-yarn'].attrs.transform,before);
  assert.match(f.elements['#tc-eyeL'].attrs.transform,/^translate\(-/);
  assert.ok(earlyTilt < -3);
  assert.notEqual(f.elements['#tc-mouth'].attrs.d,'M137 164 Q150 175 163 164');
  f.step(1200); assert.equal(f.elements['#tc-mouth'].attrs.d,'M137 164 Q150 175 163 164');
  f.step(1500);
  const nearTilt = Number(f.elements['#tc-head'].attrs.transform.match(/rotate\(([^ ]+)/)[1]);
  assert.ok(Math.abs(nearTilt) < Math.abs(earlyTilt));
  f.step(2400); assert.notEqual(f.elements['#tc-mouth'].attrs.d,'M137 164 Q150 175 163 164');
  f.step(3000); assert.equal(f.elements['#tc-yarn'].attrs.opacity,'0');
  assert.notEqual(f.elements['#tc-mouth'].attrs.d,'M137 164 Q150 175 163 164');
});
test('typing, care, search, drag, blur, and destroy interrupt yarn',()=>{
  for(const action of ['typing','input','care','search','drag','blur','destroy']) {
    const f=fixture(); f.controller.playYarn(); f.step(500);
    if(action==='typing') f.key('a');
    if(action==='input') f.change('paste');
    if(action==='care') f.controller.giveCare('water');
    if(action==='search') f.controller.searchCompleted();
    if(action==='drag') f.window.dispatchEvent({type:'cat-drag',detail:true});
    if(action==='blur') f.window.dispatchEvent({type:'blur'});
    if(action==='destroy') f.controller.destroy();
    f.step(570); assert.equal(f.elements['#tc-yarn'].attrs.opacity,'0');
    if(action==='typing') assert.match(f.elements['#tc-pawL'].attrs.transform,/translate\(0.00 -/);
  }
});
test('yarn respects personality and reduced motion',()=>{
  const amounts=[];
  for(const personality of ['playful','calm','sleepy']) {
    const f=fixture(); f.controller.setPersonality(personality); f.controller.playYarn(); f.step(350);
    amounts.push(Math.abs(Number(f.elements['#tc-eyeL'].attrs.transform.match(/translate\(([^ ]+)/)[1])));
  }
  assert.ok(amounts[0]>amounts[1]); assert.equal(amounts[2],0);
  const f=fixture(true); f.controller.playYarn(); f.step(300); const transform=f.elements['#tc-yarn'].attrs.transform;
  f.step(900); assert.equal(f.elements['#tc-yarn'].attrs.transform,transform);
  assert.match(f.elements['#tc-eyeL'].attrs.transform,/^translate\(0 /);
});
test('dock yarn button plays without feeding or searching',async()=>{
  const f=await dockFixture(); f.get('playYarn').listeners.click(); assert.deepEqual(f.submitted,['yarn']);
});

test('yarn crosses the face with a clearly visible left-to-right head turn and gaze',()=>{
  const f=fixture(); f.controller.playYarn(); f.step(300);
  const tilt=()=>Number(f.elements['#tc-head'].attrs.transform.match(/rotate\(([^ ]+)/)[1]);
  const eye=()=>Number(f.elements['#tc-eyeL'].attrs.transform.match(/translate\(([^ ]+)/)[1]);
  assert.ok(tilt() < -15); assert.ok(eye() < -5);
  f.step(1500); assert.ok(tilt() > 5); assert.ok(eye() > 2);
});

test('cat name appears as plain text in care bubble and falls back when cleared',async()=>{
  const f=await dockFixture();
  await vm.runInContext('updateCatName("<Mochi>")', f.context);
  assert.equal(f.get('careBubble').textContent,'<Mochi> is happy—and full! Let’s paws for a moment. ♡');
  await vm.runInContext('updateCatName(" ")', f.context);
  assert.match(f.get('careBubble').textContent,/^Your cat is happy/);
});

function showDream(f) { settleNap(f); f.step(306000); f.step(306600); }
test('dream appears only in settled sleep, fades away, and rotates icons without repeating',()=>{
  const f=fixture(); f.step(500);assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),0);
  showDream(f);assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),1);
  assert.equal(f.elements['#tc-dream-fish'].attrs.opacity,'1');
  f.step(309600);assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),0);
  f.step(323000);f.step(323600);assert.equal(f.elements['#tc-dream-yarn'].attrs.opacity,'1');
  assert.equal(f.elements['#tc-dream-fish'].attrs.opacity,'0');
});
test('waking, feeding, playing, dragging, and destroying hide dreams immediately',()=>{
  for(const action of ['focus','care','yarn','drag','destroy']) {
    const f=fixture();showDream(f);
    if(action==='focus')f.input.dispatchEvent({type:'focus'});
    if(action==='care')f.controller.giveCare('snack');
    if(action==='yarn')f.controller.playYarn();
    if(action==='drag')f.window.dispatchEvent({type:'cat-drag',detail:true});
    if(action==='destroy')f.controller.destroy();
    assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),0);
    f.step(306650);assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),0);
  }
});
test('reduced motion shows a static dream without floating or fading',()=>{
  const f=fixture(true);showDream(f);
  assert.equal(Number(f.elements['#tc-dream'].attrs.opacity),1);
  assert.equal(f.elements['#tc-dream'].attrs.transform,'translate(0 0)');
});

test('rounded forearms and wrist rotation remain valid through rapid typing, reach, and drag',()=>{
 const f=fixture();
 for(let t=0;t<1600;t+=80){f.step(t);f.key('a');f.step(t+35);}
 for(const id of ['#tc-armL','#tc-armR']) {assert.match(f.elements[id].attrs.d,/Z$/);assert.ok(!/NaN|Infinity/.test(f.elements[id].attrs.d));assert.equal(f.elements[id].attrs.fill,'url(#tc-volume)');}
 f.window.dispatchEvent({type:'pointermove',clientX:220,clientY:260});f.step(2600);f.step(3000);
 assert.ok(!/NaN|Infinity/.test(f.elements['#tc-armR'].attrs.d));
 f.window.dispatchEvent({type:'cat-drag',detail:true});f.step(3050);
 assert.equal(f.elements['#tc-pawL'].attrs.transform,'translate(0.00 0.00) rotate(0.00 100 300)');
});
test('face parallax follows gaze and stays still with reduced motion',()=>{
 for(const reduced of [false,true]) {const f=fixture(reduced);f.window.dispatchEvent({type:'pointermove',clientX:290,clientY:140});f.step(200);f.step(250);
 if(reduced)assert.match(f.elements['#tc-features'].attrs.transform,/^translate\(0 0\)/);
 else assert.ok(Number(f.elements['#tc-features'].attrs.transform.match(/translate\(([^ ]+)/)[1])>0);}
});

test('yarn wakes sleeping cat before rolling, contacts right paw, and completes once',()=>{
 const f=fixture();settleNap(f);const events=[];f.container.addEventListener('cat-yarn-complete',e=>events.push(e.detail.personality));
 assert.equal(f.controller.playYarn(),true);f.step(302700);assert.equal(f.container.dataset.mood,'normal');
 assert.equal(f.elements['#tc-yarn'].attrs.opacity,'0');
 f.step(303200);assert.equal(f.elements['#tc-yarn'].attrs.opacity,'1');
 f.step(304760);const contact=f.elements['#tc-yarn'].attrs.transform;assert.match(contact,/translate\(177 300\)/);
 assert.match(f.elements['#tc-pawR'].attrs.transform,/rotate\(-18.00/);
 f.step(305000);assert.notEqual(f.elements['#tc-yarn'].attrs.transform,contact);
 f.step(306200);assert.deepEqual(events,['calm']);f.step(306250);assert.equal(events.length,1);
});
test('interrupted yarn never emits a completion bubble event',()=>{
 for(const interrupt of ['before','after']) {
  const f=fixture();let completed=0;f.container.addEventListener('cat-yarn-complete',()=>completed++);f.controller.playYarn();
  f.step(interrupt==='before'?500:1700);f.key('a');f.step(4000);assert.equal(completed,0);
 }
});

test('completed yarn selects personality quotes without repeating and clears after display',()=>{
 for(const [personality,duration,first] of [['calm',3000,'A little play'],['playful',2400,'Your turn'],['sleepy',3600,'You work']]) {
  const f=fixture();f.controller.setPersonality(personality);const quotes=[];let cleared=0;
  f.container.addEventListener('cat-yarn-complete',e=>quotes.push(e.detail.message));f.container.addEventListener('cat-yarn-quote-clear',()=>cleared++);
  f.controller.playYarn();f.step(duration*.52);f.step(duration);assert.ok(quotes[0].startsWith(first));
  f.step(duration+4600);assert.equal(cleared,1);
  f.controller.playYarn();f.step(duration+4600+duration*.52);f.step(duration+4600+duration);assert.equal(quotes.length,2);assert.notEqual(quotes[0],quotes[1]);
 }
});
test('dock displays a completion quote safely and hides it on clear',async()=>{
 const f=await dockFixture();f.get('cat').listeners['cat-yarn-complete']({detail:{message:'You work. I’ll handle the naps.'}});
 assert.equal(f.get('yarnBubble').hidden,false);assert.match(f.get('yarnBubble').textContent,/handle the naps/);
 f.get('cat').listeners['cat-yarn-quote-clear']();assert.equal(f.get('yarnBubble').hidden,true);
});

test('manual delivery raises paws and opens mouth; eating emits a bubble only after finishing',()=>{
 for(const kind of ['water','snack']) {
  const f=fixture();let delivered=0;const messages=[];
  f.container.addEventListener('cat-manual-care-delivered',()=>delivered++);f.container.addEventListener('cat-manual-care-complete',e=>messages.push(e.detail));
  assert.equal(f.controller.beginManualCare(kind),true);
  f.controller.updateManualCare(100,220);f.step(100);
  assert.match(f.elements['#tc-mouth'].attrs.d,/Q150 188/);
  assert.match(f.elements['#tc-pawL'].attrs.transform,/translate\(0.00 -/);
  f.controller.updateManualCare(150,200);assert.equal(delivered,1);f.step(300);
  assert.equal(f.elements['#tc-'+kind].attrs.opacity,'1.000');assert.equal(messages.length,0);
  f.step(1500);assert.equal(messages.length,1);assert.equal(messages[0].kind,kind);assert.ok(messages[0].message);
  f.step(1600);assert.equal(messages.length,1);
 }
});
test('sleeping manual delivery waits for visible wake-up even with pointer tracking',()=>{
 const f=fixture();settleNap(f);f.controller.beginManualCare('water');
 f.window.dispatchEvent({type:'pointermove',clientX:150,clientY:200});
 assert.equal(f.controller.updateManualCare(150,200),false);f.step(302700);
 assert.equal(f.container.dataset.mood,'normal');assert.equal(Number(f.elements['#tc-water'].attrs.opacity),0);
 f.step(303500);f.step(303700);assert.ok(Number(f.elements['#tc-water'].attrs.opacity)>0);
});
test('ordinary clicks and cancelled carries never emit manual-feeding bubbles',()=>{
 const f=fixture();let count=0;f.container.addEventListener('cat-manual-care-complete',()=>count++);
 f.controller.giveCare('snack');f.step(1600);assert.equal(count,0);
 f.controller.beginManualCare('water');f.controller.updateManualCare(20,100);f.controller.cancelManualCare();f.step(4000);assert.equal(count,0);
 assert.equal(f.controller.updateManualCare(150,200),false);
});

test('walk and home commands stay local even with AI enabled',async()=>{
 const f=await dockFixture(true);f.get('q').value='/walk';await vm.runInContext('submit()',f.context);assert.equal(f.get('q').value,'');
 f.get('q').value='/HOME';await vm.runInContext('submit()',f.context);assert.deepEqual(f.submitted,['walk','home']);assert.equal(f.completed(),0);
});

test('walk toggle changes to home and requests the matching action',async()=>{
 const f=await dockFixture();assert.equal(f.get('walkToggle').title,'Let the cat walk');
 await f.get('walkToggle').onclick();f.roaming(true);assert.equal(f.get('walkToggle').title,'Bring the cat home');
 await f.get('walkToggle').onclick();assert.deepEqual(f.submitted,['walk','home']);f.roaming(false);assert.equal(f.get('walkToggle').title,'Let the cat walk');
});

test('care buttons and manual feeding return when docked, commands only work while roaming',async()=>{
 const f=await dockFixture();assert.equal(f.get('care').hidden,false);assert.equal(f.get('roamCommands').hidden,true);
 f.get('giveWater').listeners.click();f.get('giveSnack').listeners.click();f.get('playYarn').listeners.click();assert.deepEqual(f.submitted,['water','snack','yarn']);
 await f.get('catJump').listeners.click();assert.equal(f.submitted.length,3);
 f.roaming(true);assert.equal(f.get('care').hidden,true);assert.equal(f.get('roamCommands').hidden,false);
 await f.get('chaseYarn').listeners.click();assert.equal(f.submitted.at(-1),'yarn');
 f.roaming(false);assert.equal(f.get('care').hidden,false);assert.equal(f.get('roamCommands').hidden,true);
});

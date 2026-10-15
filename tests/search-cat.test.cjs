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
  const context = vm.createContext({window, document, performance:{now:() => now}, Date, Math:math,
    matchMedia:() => ({matches:reduced}), CustomEvent:class {constructor(type, props) {this.type=type; Object.assign(this, props);}},
    requestAnimationFrame:f => {pending=f; return 1;}, cancelAnimationFrame:() => {pending=null;}});
  vm.runInContext(fs.readFileSync(path.join(sourceDir, 'typing-cat.js'), 'utf8') + '\nthis.cat = TypingCat;', context);
  const controller = context.cat.mount(container, input);
  return {controller, elements, input, window, container,
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
  const elements={}; let completed=0, resets=0, submitted=[];
  const get=id => elements[id] ||= {value:'', dataset:{}, hidden:true, listeners:{}, setAttribute(){}, appendChild(){}, scrollIntoView(){}, replaceChildren(){}, focus(){}, addEventListener(n,f){this.listeners[n]=f;}};
  const settings={aiEnabled, aiProvider:'openai', aiModels:{openai:'test-model'}};
  const api={getSettings:async()=>settings, onCatPersonality(){}, onDevCatAction(){}, onFocusInput(){},
    aiPanel:async()=>{}, aiStatus:async()=>({configured:true}), searchSubmit:q=>submitted.push(q),
    aiChat:async()=>{if(fail) throw Error('offline'); return {text:'ok',model:'test-model',usage:{}};}};
  const context=vm.createContext({api, document:{getElementById:get, createElement:()=>({scrollIntoView(){}})},
    window:{addEventListener(){}}, TypingCat:{mount:()=>({setPersonality(){},queryReset(){resets++;},searchCompleted(){completed++;}})}});
  const html=fs.readFileSync(path.join(sourceDir,'dock.html'),'utf8');
  vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],context);
  await new Promise(resolve=>setImmediate(resolve));
  return {get, context, completed:()=>completed, resets:()=>resets, submitted};
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

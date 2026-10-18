const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const bytes=fs.readFileSync(path.join(__dirname,'../src/assets/pomeranian/pomeranian.glb'));
const jsonLength=bytes.readUInt32LE(12),asset=JSON.parse(bytes.subarray(20,20+jsonLength));
const bin=bytes.subarray(28+jsonLength);
function accessor(index){
 const a=asset.accessors[index],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
 const types={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']};const [size,method]=types[a.componentType];
 const result=Array.from({length:a.count},()=>Array(width).fill(0));
 if(a.bufferView!==undefined){const view=asset.bufferViews[a.bufferView];for(let i=0;i<a.count;i++)for(let c=0;c<width;c++)result[i][c]=bin[method]((view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||width*size)+c*size);}
 if(a.sparse){const sp=a.sparse,indices=asset.bufferViews[sp.indices.bufferView],values=asset.bufferViews[sp.values.bufferView],[isize,iread]=types[sp.indices.componentType];for(let i=0;i<sp.count;i++){const row=bin[iread]((indices.byteOffset||0)+(sp.indices.byteOffset||0)+i*isize);for(let c=0;c<width;c++)result[row][c]=bin[method]((values.byteOffset||0)+(sp.values.byteOffset||0)+(i*width+c)*size);}}
 return result;
}
test('Pomeranian GLB contains a valid seventeen-bone skin with finite normalized weights',()=>{
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(asset.skins.length,1);const skin=asset.skins[0];assert.equal(skin.joints.length,17);
 assert.deepEqual(skin.joints.map(i=>asset.nodes[i].name).sort(),['Body','Head','Hips','Root','Tail',...['FrontL','FrontR','RearL','RearR'].flatMap(n=>[n+'Upper',n+'Lower',n+'Paw'])].sort());
 const attrs=asset.meshes[0].primitives[0].attributes,weights=accessor(attrs.WEIGHTS_0),joints=accessor(attrs.JOINTS_0);
 assert.ok(weights.length>20000);assert.equal(weights.length,joints.length);
 for(let i=0;i<weights.length;i++){
  assert.ok(Math.abs(weights[i].reduce((s,v)=>s+v,0)-1)<1e-5);
  assert.ok(weights[i].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  assert.ok(joints[i].every(j=>Number.isInteger(j)&&j>=0&&j<17));
 }
});
test('head and tail clips animate their intended bones and return to rest',()=>{
 assert.deepEqual(asset.animations.map(a=>a.name).sort(),['Curious','Happy','HeadTilt','Land','Pickup','Sit','Sleep','TailWag','Trot','Walk']);
 for(const [name,bone] of [['Curious','Head'],['HeadTilt','Head'],['TailWag','Tail'],['Happy','Tail']]){
  const clip=asset.animations.find(a=>a.name===name),channel=clip.channels.find(c=>asset.nodes[c.target.node].name===bone&&c.target.path==='rotation');
  assert.ok(channel);const sampler=clip.samplers[channel.sampler],times=accessor(sampler.input).flat(),rotations=accessor(sampler.output);
  assert.ok(times.at(-1)>1&&times.at(-1)<4);assert.ok(rotations.flat().every(Number.isFinite));
  for(const q of rotations)assert.ok(Math.abs(Math.hypot(...q)-1)<1e-4);
  const first=rotations[0],last=rotations.at(-1);
  assert.ok(Math.abs(first.reduce((sum,v,i)=>sum+v*last[i],0))>.9999);
  assert.ok(rotations.some(q=>Math.abs(first.reduce((sum,v,i)=>sum+v*q[i],0))<.999));
 }
});
test('export keeps textures embedded and source rig deformation within the inspected limits',()=>{
 assert.ok(asset.images.length>=2);assert.ok(asset.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/pomeranian/rig-report.json'),'utf8'));
 assert.ok(report.max_edge_stretch.Curious<1.35);assert.ok(report.max_edge_stretch.TailWag<1.5);
});

test('walking and trotting animate all four leg chains and loop continuously',()=>{
 for(const name of ['Walk','Trot']){
  const clip=asset.animations.find(c=>c.name===name);assert.ok(clip);
  for(const leg of ['FrontL','FrontR','RearL','RearR'])for(const part of ['Upper','Lower','Paw']){
   const channel=clip.channels.find(c=>asset.nodes[c.target.node].name===leg+part&&c.target.path==='rotation');assert.ok(channel);
   const values=accessor(clip.samplers[channel.sampler].output);
   const dot=(a,b)=>Math.abs(a.reduce((s,v,i)=>s+v*b[i],0));
   assert.ok(values.flat().every(Number.isFinite));assert.ok(values.every(q=>Math.abs(Math.hypot(...q)-1)<1e-4));
   assert.ok(dot(values[0],values.at(-1))>.9999);assert.ok(values.some(q=>dot(q,values[0])<.999));
  }
 }
});
test('desktop asset stays compact and textures are capped at 1024 pixels',()=>{
 assert.ok(bytes.length<5*1024*1024);
 for(const image of asset.images){const view=asset.bufferViews[image.bufferView],png=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);assert.equal(png.toString('ascii',1,4),'PNG');assert.ok(png.readUInt32BE(16)<=1024);assert.ok(png.readUInt32BE(20)<=1024);}
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/pomeranian/gait-report.json'),'utf8'));assert.ok(report.clips.Walk.max_edge_stretch<1.8);assert.ok(report.clips.Trot.max_edge_stretch<2.2);
});

test('the refined gait compensates body weight shift while keeping planted paw controls level',()=>{
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/pomeranian/gait-report.json'),'utf8'));
 for(const name of ['Walk','Trot']){
  assert.ok(report.clips[name].max_stance_height_error<.001);assert.ok(report.clips[name].max_stance_paw_tilt<.001);
  const clip=asset.animations.find(a=>a.name===name);const channel=clip.channels.find(c=>asset.nodes[c.target.node].name==='Body'&&c.target.path==='rotation');assert.ok(channel);
  const q=accessor(clip.samplers[channel.sampler].output);assert.ok(q.some(v=>Math.abs(v.reduce((s,n,i)=>s+n*q[0][i],0))<.999999));
 }
});

test('rest clips contain hips motion and their matching fur corrective',()=>{
 for(const name of ['Sit','Sleep']){
  const clip=asset.animations.find(a=>a.name===name);assert.ok(clip.channels.some(c=>asset.nodes[c.target.node].name==='Hips'&&c.target.path==='rotation'));
  const channel=clip.channels.find(c=>c.target.path==='weights');assert.ok(channel);const values=accessor(clip.samplers[channel.sampler].output).flat();assert.ok(values.every(Number.isFinite));assert.ok(values.some(v=>v===1));
 }
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/pomeranian/rest-report.json'),'utf8'));for(const name of ['Sit','Sleep']){assert.ok(report[name].min_z>=0);assert.ok(report[name].max_edge_stretch<3.1);}
});

test('pickup relaxes each leg and landing returns every keyed transform to its start',()=>{
 const pickup=asset.animations.find(a=>a.name==='Pickup'),land=asset.animations.find(a=>a.name==='Land');assert.ok(pickup&&land);
 for(const name of ['FrontL','FrontR','RearL','RearR']){
  const ch=pickup.channels.find(c=>asset.nodes[c.target.node].name===name+'Lower'&&c.target.path==='rotation');assert.ok(ch);const q=accessor(pickup.samplers[ch.sampler].output);assert.ok(q.some(v=>Math.abs(v.reduce((s,n,i)=>s+n*q[0][i],0))<.999));
 }
 for(const ch of land.channels){const v=accessor(land.samplers[ch.sampler].output);assert.ok(v.flat().every(Number.isFinite));if(ch.target.path==='rotation')assert.ok(Math.abs(v[0].reduce((s,n,i)=>s+n*v.at(-1)[i],0))>.9999);else assert.ok(v[0].every((n,i)=>Math.abs(n-v.at(-1)[i])<1e-5));}
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/pomeranian/pickup-report.json'),'utf8'));assert.ok(report.Pickup.max_edge_stretch<1.8);assert.ok(report.Land.max_edge_stretch<1.4);assert.ok(report.Land.min_z>=-.001);
});

test('facial morphs stay localized and chest breathing leaves head and paws still',()=>{
 const mesh=asset.meshes[0],primitive=mesh.primitives[0],names=mesh.extras.targetNames;assert.ok(names.includes('Blink')&&names.includes('Breath'));
 const position=accessor(primitive.attributes.POSITION),blink=accessor(primitive.targets[names.indexOf('Blink')].POSITION),breath=accessor(primitive.targets[names.indexOf('Breath')].POSITION);
 let eyeVertices=0,chestVertices=0;for(let i=0;i<position.length;i++){const e=Math.hypot(...blink[i]),b=Math.hypot(...breath[i]);assert.ok(Number.isFinite(e+b));if(e>1e-6){eyeVertices++;assert.ok(position[i][1]>.65&&position[i][1]<.80);}if(b>1e-6){chestVertices++;assert.ok(position[i][1]>.23&&position[i][1]<.65);}assert.ok(b<.006);}
 assert.ok(eyeVertices>500&&eyeVertices<1500);assert.ok(chestVertices>1000);
});

test('chewing and lapping stay below the nose and leave the body unchanged',()=>{
 const mesh=asset.meshes[0],p=mesh.primitives[0],names=mesh.extras.targetNames,position=accessor(p.attributes.POSITION);
 for(const name of ['Chew','Lap']){
  assert.ok(names.includes(name));const deltas=accessor(p.targets[names.indexOf(name)].POSITION);let changed=0;
  for(let i=0;i<deltas.length;i++){const d=Math.hypot(...deltas[i]);assert.ok(Number.isFinite(d)&&d<.01);if(d>1e-6){changed++;assert.ok(position[i][1]>.56&&position[i][1]<.65);assert.ok(position[i][2]>.25);}}
  assert.ok(changed>100&&changed<2000);
 }
});

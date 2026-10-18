const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const bytes=fs.readFileSync(path.join(__dirname,'../src/assets/pomeranian/pomeranian.glb'));
const jsonLength=bytes.readUInt32LE(12),asset=JSON.parse(bytes.subarray(20,20+jsonLength));
const bin=bytes.subarray(28+jsonLength);
function accessor(index){
 const a=asset.accessors[index],view=asset.bufferViews[a.bufferView],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
 const types={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],5126:[4,'readFloatLE']};const [size,method]=types[a.componentType];
 return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,c)=>bin[method]((view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||width*size)+c*size)));
}
test('Pomeranian GLB contains a valid four-bone skin with finite normalized weights',()=>{
 assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(asset.skins.length,1);const skin=asset.skins[0];assert.equal(skin.joints.length,4);
 assert.deepEqual(skin.joints.map(i=>asset.nodes[i].name).sort(),['Body','Head','Root','Tail']);
 const attrs=asset.meshes[0].primitives[0].attributes,weights=accessor(attrs.WEIGHTS_0),joints=accessor(attrs.JOINTS_0);
 assert.ok(weights.length>20000);assert.equal(weights.length,joints.length);
 for(let i=0;i<weights.length;i++){
  assert.ok(Math.abs(weights[i].reduce((s,v)=>s+v,0)-1)<1e-5);
  assert.ok(weights[i].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  assert.ok(joints[i].every(j=>Number.isInteger(j)&&j>=0&&j<4));
 }
});
test('head and tail clips animate their intended bones and return to rest',()=>{
 assert.deepEqual(asset.animations.map(a=>a.name).sort(),['Curious','Happy','HeadTilt','TailWag']);
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

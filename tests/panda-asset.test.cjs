const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const bytes=fs.readFileSync(path.join(__dirname,'../src/assets/panda/panda.glb')),asset=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
test('panda is a bounded offline GLB with a thirteen-bone rig and required clips',()=>{
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);assert.ok(bytes.length<3*1024*1024);assert.ok(asset.buffers.every(b=>!b.uri));assert.ok((asset.images||[]).every(i=>!i.uri));assert.ok(asset.skins.length>0&&asset.skins.every(s=>s.joints.length===13));assert.deepEqual(asset.animations.map(a=>a.name).sort(),['Land','Nibble','Pickup','RoamSleep','Run','SeatedIdle','Sit','Sleep','Stand','Walk']);
 const triangles=asset.meshes.reduce((sum,m)=>sum+m.primitives.reduce((s,p)=>s+asset.accessors[p.indices].count/3,0),0);assert.ok(triangles<120000);
});
test('both eyes retain editable blink shapes with matching position counts',()=>{
 const blink=asset.meshes.filter(m=>m.extras?.targetNames?.includes('Blink'));assert.equal(blink.length,10);
 for(const mesh of blink)for(const p of mesh.primitives){const i=mesh.extras.targetNames.indexOf('Blink');assert.ok(p.targets[i].POSITION!==undefined);assert.equal(asset.accessors[p.targets[i].POSITION].count,asset.accessors[p.attributes.POSITION].count);}
});
test('panda packaging paths and settings retain a separate normalized name',()=>{
 const main=fs.readFileSync(path.join(__dirname,'../src/main.js'),'utf8'),preload=fs.readFileSync(path.join(__dirname,'../src/preload.js'),'utf8');assert.ok(main.includes("['wizard-cat','pomeranian','panda'].includes"));assert.ok(main.includes('settings.pandaName = CatName.normalize(settings.pandaName)'));assert.ok(main.includes('next.pandaName = CatName.normalize(next.pandaName)'));assert.ok(preload.includes("ipcRenderer.removeListener('panda-name',listener)"));
});

test('waddle loops meet at identical transforms and planted feet stay above the floor',()=>{
 const bin=bytes.subarray(28+bytes.readUInt32LE(12));
 const values=i=>{const a=asset.accessors[i],v=asset.bufferViews[a.bufferView],n={VEC3:3,VEC4:4,SCALAR:1}[a.type],offset=(v.byteOffset||0)+(a.byteOffset||0);assert.equal(a.componentType,5126);return Array.from({length:a.count},(_,r)=>Array.from({length:n},(_,c)=>bin.readFloatLE(offset+r*(v.byteStride||n*4)+c*4)));};
 for(const name of ['Walk','Run']){
  const clip=asset.animations.find(c=>c.name===name);for(const bone of ['LFoot','RFoot']){
   const ch=clip.channels.find(c=>asset.nodes[c.target.node].name===bone&&c.target.path==='translation');assert.ok(ch);const data=values(clip.samplers[ch.sampler].output);assert.ok(data.flat().every(Number.isFinite));assert.ok(data[0].every((v,i)=>Math.abs(v-data.at(-1)[i])<1e-5));assert.ok(data.some(v=>Math.hypot(...v.map((x,i)=>x-data[0][i]))>.05));
  }
 }
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/panda/motion-report.json')));for(const name of ['Walk','Run','Land'])assert.ok(report[name].minimum_foot_z>=-.001);for(const name of ['Stand','Sit','RoamSleep'])assert.ok(report[name].minimum_foot_z>=-.026);
});

// Copy the pinned runtime subset; browser modules use local relative imports.
const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..'),source=path.join(root,'node_modules/three'),target=path.join(root,'src/vendor/three');
fs.mkdirSync(target,{recursive:true});
for(const file of ['three.core.js','three.module.js'])fs.copyFileSync(path.join(source,'build',file),path.join(target,file));
fs.copyFileSync(path.join(source,'LICENSE'),path.join(target,'LICENSE'));
for(const [file,name] of [['examples/jsm/loaders/GLTFLoader.js','GLTFLoader.js'],['examples/jsm/utils/BufferGeometryUtils.js','BufferGeometryUtils.js']]){
 const text=fs.readFileSync(path.join(source,file),'utf8').replaceAll("from 'three'","from './three.module.js'").replaceAll("from '../utils/BufferGeometryUtils.js'","from './BufferGeometryUtils.js'");
 fs.writeFileSync(path.join(target,name),text);
}

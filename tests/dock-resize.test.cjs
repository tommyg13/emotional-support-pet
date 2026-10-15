const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'../src');
function fixture(){let bounds={x:100,y:200,width:560,height:270},saved;const handlers={};const sender={};const dockWin={webContents:sender,isDestroyed:()=>false,getBounds:()=>({...bounds}),setBounds:b=>{bounds=b;}};
 const source=fs.readFileSync(path.join(root,'main.js'),'utf8');const context=vm.createContext({dockWin,ipcMain:{on:(n,f)=>handlers[n]=f,handle:(n,f)=>handlers[n]=f},screen:{getDisplayMatching:()=>({workArea:{x:0,y:0,width:1440,height:900}})},loadSettings:()=>({catName:'Mochi'}),saveSettings:s=>saved=s});
 vm.runInContext(source.slice(source.indexOf('const DOCK_W ='),source.indexOf('const SEARCH_URL =')),context);
 const start=source.indexOf("ipcMain.handle('ai-panel'");vm.runInContext(source.slice(start,source.indexOf('// ---------- summon',start)),context);
 return {bounds:()=>bounds,resize:w=>handlers['dock-resize']({sender},w),end:()=>handlers['dock-resize-end']({sender}),panel:open=>handlers['ai-panel']({sender},open),saved:()=>saved,unauthorized:()=>handlers['dock-resize']({sender:{}},400)};
}
test('dock clamps width, preserves bottom edge, saves size and rejects invalid requests',()=>{
 const f=fixture();f.unauthorized();assert.equal(f.bounds().width,560);
 f.resize(200);assert.equal(f.bounds().width,400);assert.equal(f.bounds().height,193);assert.equal(f.bounds().y+f.bounds().height,470);
 f.end();assert.equal(f.saved().dockWidth,400);assert.equal(f.saved().catName,'Mochi');
 f.resize(NaN);assert.equal(f.bounds().width,400);f.resize(900);assert.equal(f.bounds().width,560);
});
test('AI panel keeps chosen width and resizing keeps chat space',()=>{
 const f=fixture();f.resize(420);f.panel(true);assert.equal(f.bounds().width,420);assert.equal(f.bounds().height,533);
 f.resize(400);assert.equal(f.bounds().height,523);f.panel(false);assert.equal(f.bounds().height,193);assert.equal(f.bounds().width,400);
});

const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
test('puppy developer actions require developer mode, settings sender, active dock and selected puppy',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/main.js'),'utf8');const handlers={},events=[];
 const sender={};const context=vm.createContext({DEV_MODE:true,settingsWin:{webContents:sender},ipcMain:{handle:(key,fn)=>handlers[key]=fn},dockWin:{isDestroyed:()=>false,webContents:{send:(...args)=>events.push(args)}},loadSettings:()=>({searchCharacter:'pomeranian'}),showBreakReminder:()=>true});
 vm.runInContext(source.slice(source.indexOf("ipcMain.handle('is-dev-mode'"),source.indexOf('// ---------- custom characters')),context);
 const invoke=(value,event={sender})=>handlers['dev-cat-action'](event,'puppy',value);
 for(const value of ['idle','welcome','water','snack','play','sit','sleep','wake']){assert.equal(invoke(value),true);assert.deepEqual(events.at(-1),['companion-dev-action',value]);}
 const count=events.length;assert.equal(invoke('unknown'),false);assert.equal(invoke('welcome',{sender:{}}),false);
 context.DEV_MODE=false;assert.equal(invoke('welcome'),false);context.DEV_MODE=true;
 context.loadSettings=()=>({searchCharacter:'wizard-cat'});assert.equal(invoke('welcome'),false);
 context.loadSettings=()=>({searchCharacter:'pomeranian'});context.dockWin=null;assert.equal(invoke('welcome'),false);
 assert.equal(events.length,count);
});

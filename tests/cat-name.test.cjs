const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.join(__dirname,'../src');const CatName=require(path.join(root,'cat-name'));
test('names handle empty values, control characters, and Unicode length',()=>{
 assert.equal(CatName.normalize(undefined),'');assert.equal(CatName.normalize('  Mochi\n cat  '),'Mochi cat');
 assert.equal(CatName.normalize('🐈'.repeat(30)),'🐈'.repeat(24));assert.equal(CatName.normalize(42),'');
});
test('settings handler persists normalized name and notifies open dock and reminder',()=>{
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
 const start=main.indexOf("ipcMain.handle('set-settings'");const end=main.indexOf("ipcMain.handle('list-custom'",start);
 let handler,saved;const events=[];const win={isDestroyed:()=>false,webContents:{send:(...args)=>events.push(args)}};
 const context=vm.createContext({CatName,ipcMain:{handle:(n,f)=>handler=f},loadSettings:()=>({catName:'',catPersonality:'calm',breakReminderEnabled:true}),saveSettings:s=>saved=s,dockWin:win,breakWin:win,closeBreakReminder(){},applySearchDock(){}});
 vm.runInContext(main.slice(start,end),context);handler({}, {catName:'  Mochi  '});
 assert.equal(saved.catName,'Mochi');assert.deepEqual(events,[['cat-name','Mochi'],['cat-name','Mochi']]);
 handler({}, {catName:''});assert.equal(saved.catName,'');
});

test('puppy name saves independently and only notifies the dock',()=>{
 const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
 const start=main.indexOf("ipcMain.handle('set-settings'");const end=main.indexOf("ipcMain.handle('list-custom'",start);
 let handler;let saved={catName:'Mochi',puppyName:'',catPersonality:'calm',breakReminderEnabled:true};const events=[];
 const context=vm.createContext({CatName,ipcMain:{handle:(n,f)=>handler=f},loadSettings:()=>saved,saveSettings:s=>saved=s,dockWin:{isDestroyed:()=>false,webContents:{send:(...args)=>events.push(args)}},closeBreakReminder(){},applySearchDock(){}});
 vm.runInContext(main.slice(start,end),context);
 handler({}, {puppyName:'  Biscuit\n pup  '});assert.equal(saved.puppyName,'Biscuit pup');assert.equal(saved.catName,'Mochi');assert.deepEqual(events,[['puppy-name','Biscuit pup']]);
 handler({}, {puppyName:''});assert.equal(saved.puppyName,'');assert.equal(saved.catName,'Mochi');
});

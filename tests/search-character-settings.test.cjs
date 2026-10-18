const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
test('saved search character is restricted to presets and changing it closes the roaming surface',()=>{
 const handlers={},events=[];let saved={},closed=0;
 const context=vm.createContext({ipcMain:{handle:(name,fn)=>handlers[name]=fn},loadSettings:()=>saved,saveSettings:next=>saved=next,CatName:{normalize:()=>''},roamingCat:{home:()=>closed++},dockWin:{isDestroyed:()=>false,webContents:{send:(...args)=>events.push(args)}},closeBreakReminder(){}});
 const source=fs.readFileSync(path.join(__dirname,'../src/main.js'),'utf8');
 vm.runInContext(source.slice(source.indexOf("ipcMain.handle('set-settings'"),source.indexOf("ipcMain.handle('list-custom'")),context);
 assert.equal(handlers['set-settings']({}, {searchCharacter:'pomeranian'}).searchCharacter,'pomeranian');
 assert.equal(closed,1);assert.deepEqual(events.at(-1),['search-character','pomeranian']);
 assert.equal(handlers['set-settings']({}, {searchCharacter:'https://example.com/model.glb'}).searchCharacter,'wizard-cat');
 assert.deepEqual(events.at(-1),['search-character','wizard-cat']);
 handlers['set-settings']({}, {catPersonality:'playful'});assert.equal(closed,2);
});
test('all edited browser inline scripts compile',()=>{
 for(const name of ['dock.html','settings.html','../previews/pomeranian-studio.html']){
  const html=fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
  for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:name});
 }
});

/* Native compact search window. Collapse is transient and never saves compact sizes. */
module.exports=function installDockStow({ipcMain,screen,getDockWindow,getExpandedHeight,isRoaming=()=>false}){
 const saved=new WeakMap(),size=72;
 function usable(){const win=getDockWindow();return win&&!win.isDestroyed()?win:null;}
 function notify(win){if(!win.webContents.isDestroyed?.())win.webContents.send('dock-stow-state',!!win.__dockStowed);}
 function restore(){
  const win=usable();if(!win||!win.__dockStowed)return false;
  const old=saved.get(win)||{width:560},b=win.getBounds(),wa=screen.getDisplayMatching(b).workArea,width=Math.min(wa.width,Math.max(400,Math.min(560,old.width))),height=Math.min(wa.height,getExpandedHeight(width));
  win.__dockStowTransition=true;
  try{win.setBounds({x:Math.max(wa.x,Math.min(b.x+b.width-width,wa.x+wa.width-width)),y:Math.max(wa.y,Math.min(b.y+b.height-height,wa.y+wa.height-height)),width,height});win.__dockStowed=false;notify(win);return true;}finally{win.__dockStowTransition=false;}
 }
 ipcMain.handle('dock-stow',(event,collapsed)=>{
  const win=usable();if(!win||event.sender!==win.webContents||typeof collapsed!=='boolean')return {ok:false};
  if(!collapsed){restore();return {ok:true,collapsed:false};}
  if(isRoaming())return {ok:false};
  if(win.__dockStowed)return {ok:true,collapsed:true};
  const b=win.getBounds(),wa=screen.getDisplayMatching(b).workArea;saved.set(win,{width:b.width});win.__dockStowed=true;win.__dockStowTransition=true;
  try{win.setBounds({x:Math.max(wa.x,Math.min(b.x+b.width-size,wa.x+wa.width-size)),y:Math.max(wa.y,Math.min(b.y+b.height-size,wa.y+wa.height-size)),width:size,height:size});notify(win);return {ok:true,collapsed:true};}
  catch(error){win.__dockStowed=false;saved.delete(win);throw error;}finally{win.__dockStowTransition=false;}
 });
 ipcMain.on('dock-stow-ready',event=>{const win=usable();if(win&&event.sender===win.webContents)notify(win);});
 return {restore};
};

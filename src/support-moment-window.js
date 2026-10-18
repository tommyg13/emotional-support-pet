/* A small, closable support scene; only the heart and settings can request it. */
module.exports=function installSupportMoment({BrowserWindow,ipcMain,screen,getButton,getSettingsWindow,getSettings,preload,page}){
 let win=null,ready=false,pending=null;
 const valid=()=>win&&!win.isDestroyed();
 function present(){if(!valid()||!ready||!pending)return;win.webContents.send('support-open',pending);pending=null;win.show();win.focus();}
 function snapshot(mode='breathe'){const s=getSettings();return {mode,searchCharacter:s.searchCharacter,catPersonality:s.catPersonality,catName:s.catName,puppyName:s.puppyName,pandaName:s.pandaName};}
 function open(mode){
  if(mode!==undefined&&!['breathe','encourage','break'].includes(mode))return false;
  if(valid()&&ready&&mode===undefined){win.show();win.focus();return true;}
  pending=snapshot(mode||'breathe');
  const button=getButton(),display=button&&!button.isDestroyed()?screen.getDisplayMatching(button.getBounds()):screen.getPrimaryDisplay(),wa=display.workArea;
  const width=Math.min(640,wa.width),height=Math.min(680,wa.height);
  const bounds={x:Math.round(wa.x+(wa.width-width)/2),y:Math.round(wa.y+(wa.height-height)/2),width,height};
  if(!valid()){
   ready=false;win=new BrowserWindow({...bounds,show:false,frame:false,transparent:true,hasShadow:false,resizable:false,skipTaskbar:true,fullscreenable:false,alwaysOnTop:true,backgroundColor:'#00000000',webPreferences:{preload,contextIsolation:true,sandbox:true}});
   const current=win;current.setAlwaysOnTop(true,'floating');
   current.on('closed',()=>{if(win===current){win=null;ready=false;pending=null;}});
   current.webContents.on('did-start-loading',()=>{if(win===current)ready=false;});
   current.loadFile(page).catch(()=>{if(win===current)close();});
  }else win.setBounds(bounds);
  present();return true;
 }
 function close(){if(valid())win.close();}
 ipcMain.on('support-open',(event,mode)=>{if([getButton(),getSettingsWindow()].some(w=>w&&!w.isDestroyed()&&event.sender===w.webContents))open(mode);});
 ipcMain.on('support-ready',event=>{if(!valid()||event.sender!==win.webContents)return;ready=true;if(!pending)pending=snapshot();present();});
 ipcMain.on('support-close',event=>{if(valid()&&event.sender===win.webContents)close();});
 return {open,close,isOpen:()=>!!valid()};
};

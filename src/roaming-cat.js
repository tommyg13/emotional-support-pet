// Own the temporary desktop surface; only its cat can intercept desktop clicks.
module.exports = function installRoamingCat({app, BrowserWindow, ipcMain, screen, getDockWindow, preload, page, getPersonality = ()=>'calm', getCharacter = ()=>'wizard-cat', startClicks = require('./desktop-clicks')}) {
  let win = null, timer = null, hit = null, held = false, ignored = true, returning = false, clickListener = null, fast = false, lastCuriousAt = -Infinity;
  function notify(value) {const dock=getDockWindow();if(dock&&!dock.isDestroyed()&&!dock.webContents.isDestroyed())dock.webContents.send('cat-roaming',value);}
  function home() {if(win&&!win.isDestroyed())win.close();}
  function requestHome() {
    const dock=getDockWindow();
    if(!win||win.isDestroyed())return;
    if(!dock||dock.isDestroyed()){home();return;}
    if(returning)return;
    returning=true;
    const b=dock.getBounds(),area=win.getBounds(),scale=b.width/560;
    win.webContents.send('cat-roam-home',{x:b.x+435*scale-area.x,y:b.y+180*scale-area.y});
  }
  function authorized(event) {return win&&!win.isDestroyed()&&event.sender===win.webContents;}
  let releaseCat;
  ipcMain.handle('cat-release',releaseCat=async event=>{
    const dock=getDockWindow();if(!dock||dock.isDestroyed()||event.sender!==dock.webContents||!['wizard-cat','pomeranian','panda'].includes(getCharacter()))return false;
    if(win&&!win.isDestroyed())return true;
    const b=dock.getBounds(), display=screen.getDisplayMatching(b), area=display.workArea;
    const scale=b.width/560;
    const created=new BrowserWindow({...area,frame:false,transparent:true,backgroundColor:'#00000000',show:false,hasShadow:false,resizable:false,movable:false,focusable:false,skipTaskbar:true,alwaysOnTop:true,fullscreenable:false,webPreferences:{preload,contextIsolation:true,sandbox:true}});
    win=created;lastCuriousAt=-Infinity;fast=false;returning=false;held=false;hit=null;ignored=true;
    created.setAlwaysOnTop(true,'floating');created.setIgnoreMouseEvents(true,{forward:true});
    if(process.platform==='darwin')created.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true,skipTransformProcessType:true});
    const dockClosed=()=>home();dock.once('closed',dockClosed);
    created.on('closed',()=>{clearInterval(timer);timer=null;clickListener?.stop();clickListener=null;returning=false;win=null;hit=null;held=false;dock.removeListener('closed',dockClosed);notify(false);});
    created.webContents.on('render-process-gone',()=>{if(!created.isDestroyed())created.close();});
    try {
      await created.loadFile(page,{query:{character:getCharacter(),x:String(b.x+435*scale-area.x),y:String(b.y+180*scale-area.y),width:String(area.width),height:String(area.height)}});
      if(created.isDestroyed()||win!==created)return false;
      created.showInactive();notify(true);
      clickListener=startClicks(point=>{
        if(!win||win.isDestroyed()||held||returning)return;
        const area=win.getBounds(),dock=getDockWindow();
        if(dock&&!dock.isDestroyed()){const b=dock.getBounds();if(point.x>=b.x&&point.x<=b.x+b.width&&point.y>=b.y&&point.y<=b.y+b.height)return;}
        const x=point.x-area.x,y=point.y-area.y;
        if(x<0||y<0||x>area.width||y>area.height)return;
        if(hit&&x>=hit.x&&x<=hit.x+hit.width&&y>=hit.y&&y<=hit.y+hit.height)return;
        win.webContents.send('cat-roam-target',{x,y});
      });
      created.webContents.send('cat-roam-clicks',clickListener.enabled);
      timer=setInterval(()=>{
        if(!win||win.isDestroyed())return;
        const cursor=screen.getCursorScreenPoint(),bounds=win.getBounds();
        const x=cursor.x-bounds.x,y=cursor.y-bounds.y;
        const intercept=held||!!(hit&&x>=hit.x&&x<=hit.x+hit.width&&y>=hit.y&&y<=hit.y+hit.height);
        if(ignored===intercept){ignored=!intercept;win.setIgnoreMouseEvents(ignored,{forward:true});}
      },25);
      return true;
    } catch {if(!created.isDestroyed())created.close();return false;}
  });
  ipcMain.on('cat-search-typing',event=>{
    const dock=getDockWindow();
    if(!dock||dock.isDestroyed()||event.sender!==dock.webContents||!win||win.isDestroyed()||returning||held||Date.now()-lastCuriousAt<20000)return;
    lastCuriousAt=Date.now();
    const b=dock.getBounds(),area=win.getBounds(),scale=b.width/560;
    const personality=getPersonality();
    win.webContents.send('cat-roam-curious',{x:b.x+435*scale-area.x,y:b.y+180*scale-area.y,lookX:b.x+220*scale-area.x,lookY:b.y+230*scale-area.y,personality:['calm','playful','sleepy'].includes(personality)?personality:'calm'});
  });
  ipcMain.handle('cat-roam-command',async(event,command)=>{
    const dock=getDockWindow();
    if(!dock||dock.isDestroyed()||event.sender!==dock.webContents||!['jump','speed','sit','yarn'].includes(command)||returning||held)return {ok:false};
    if(!win||win.isDestroyed()){if(!await releaseCat(event))return {ok:false};}
    if(command==='speed')fast=!fast;
    win.webContents.send('cat-roam-command',{command,fast});
    return {ok:true,fast};
  });
  ipcMain.handle('cat-home',event=>{const dock=getDockWindow();if(!authorized(event)&&(!dock||event.sender!==dock.webContents))return false;requestHome();return true;});
  ipcMain.on('cat-home-arrived',event=>{if(authorized(event)&&returning)home();});
  ipcMain.on('cat-home-cancelled',event=>{if(authorized(event))returning=false;});
  ipcMain.on('cat-roam-hit', (event,rect)=>{if(!authorized(event)||!rect)return;const {x,y,width,height}=rect;if([x,y,width,height].every(Number.isFinite)&&width>0&&height>0&&width<=600&&height<=600)hit={x,y,width,height};});
  ipcMain.on('cat-roam-held',(event,value)=>{if(authorized(event)){held=value===true;if(held)win.webContents.send('cat-personality',getPersonality());}});
  app.whenReady().then(()=>screen.on('display-removed',home));
  app.on('before-quit',home);
  return {home};
};

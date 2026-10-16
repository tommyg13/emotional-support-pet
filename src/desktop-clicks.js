// Listen only for mouse-down events while roaming; clicks are never consumed or stored.
module.exports = function startDesktopClicks(onClick) {
  const {systemPreferences,screen}=require('electron');
  if(process.platform==='darwin'&&!systemPreferences.isTrustedAccessibilityClient(true))return {stop(){},enabled:false};
  let hook,listener;
  try {
    hook=require('uiohook-napi').uIOhook;
    listener=e=>{if(e.button!==1)return;const p=process.platform==='win32'?screen.screenToDipPoint({x:e.x,y:e.y}):{x:e.x,y:e.y};onClick(p);};
    hook.on('mousedown',listener);hook.start();
    return {enabled:true,stop(){hook.removeListener('mousedown',listener);hook.stop();}};
  } catch {if(hook&&listener)hook.removeListener('mousedown',listener);return {enabled:false,stop(){}};}
};

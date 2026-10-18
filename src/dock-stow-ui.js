/* Push/pull staging around a real native compact window, with a permanent restore button. */
const DockStowUI=(()=>{
 const pawSVG='<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="31" rx="12" ry="10" fill="currentColor"/><ellipse cx="10" cy="20" rx="5" ry="7" transform="rotate(-25 10 20)" fill="currentColor"/><ellipse cx="20" cy="12" rx="5" ry="7" fill="currentColor"/><ellipse cx="31" cy="13" rx="5" ry="7" fill="currentColor"/><ellipse cx="39" cy="23" rx="5" ry="7" transform="rotate(25 39 23)" fill="currentColor"/></svg>';
 function mount({root,getController,isRoaming,request,subscribe,onBefore=()=>{}}){
  const paw=document.createElement('button');paw.id='stowedPaw';paw.type='button';paw.innerHTML=pawSVG;paw.title='Restore search';paw.setAttribute('aria-label','Restore search');paw.hidden=true;document.body.appendChild(paw);
  const hands=document.createElement('div');hands.id='stowPaws';hands.setAttribute('aria-hidden','true');hands.innerHTML=pawSVG+pawSVG;root.appendChild(hands);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let alive=true,compact=false,busy=false,timer=null,epoch=0;
  function emit(){window.dispatchEvent(new Event('dock-stow-changed'));}
  function finish(){clearTimeout(timer);timer=null;busy=false;document.body.classList.remove('dock-stow-busy','dock-stow-push','dock-stow-pull');emit();}
  function receive(value){if(!alive)return;const wasCompact=compact,wasBusy=busy;epoch++;clearTimeout(timer);compact=!!value;document.body.classList.toggle('dock-stowed',compact);paw.hidden=!compact;
   if(compact){finish();paw.focus();}else if(!wasCompact&&!wasBusy){finish();}else{document.body.classList.remove('dock-stow-push');document.body.classList.add('dock-stow-pull');document.body.classList.add('dock-stow-busy');busy=true;timer=setTimeout(finish,reduced?0:550);}emit();
  }
  async function restore(){if(!alive||!compact)return;const token=++epoch;paw.disabled=true;try{const result=await request(false);if(!alive)return;if(result?.ok&&compact)receive(false);}catch{if(alive)paw.title='Could not restore. Click to retry.';}finally{if(alive&&epoch>=token)paw.disabled=false;}}
  function start(){if(!alive||busy||compact||isRoaming())return false;onBefore();busy=true;document.body.classList.add('dock-stow-busy','dock-stow-push');const controller=getController();controller.react(controller.definition?.type==='svg'?'auto':'curious');const token=++epoch;
   timer=setTimeout(async()=>{timer=null;if(!alive||token!==epoch)return;try{const result=await request(true);if(!alive||token!==epoch)return;if(!result?.ok){finish();return;}if(!compact)receive(true);}catch{if(alive)finish();}},reduced?0:700);return true;
  }
  function cancelStaging(){if(!compact&&busy){epoch++;finish();}}
  function shortcut(e){if(!compact&&busy&&e.key==='Escape'){e.preventDefault();cancelStaging();return;}if(compact&&(e.key==='Escape'||e.key==='Enter'||e.key===' ')){e.preventDefault();restore();}}
  function focusRequested(){cancelStaging();if(compact)restore();}
  paw.onclick=restore;window.addEventListener('dock-focus-request',focusRequested);window.addEventListener('dock-stow-request',start);window.addEventListener('companion-character-changed',cancelStaging);window.addEventListener('companion-mode-changed',cancelStaging);document.addEventListener('keydown',shortcut,true);
  const unsubscribe=subscribe(receive);
  return {start,restore,destroy(){if(!alive)return;alive=false;epoch++;clearTimeout(timer);unsubscribe?.();window.removeEventListener('dock-focus-request',focusRequested);window.removeEventListener('dock-stow-request',start);window.removeEventListener('companion-character-changed',cancelStaging);window.removeEventListener('companion-mode-changed',cancelStaging);document.removeEventListener('keydown',shortcut,true);document.body.classList.remove('dock-stowed','dock-stow-busy','dock-stow-push','dock-stow-pull');paw.remove();hands.remove();}};
 }
 return Object.freeze({mount});
})();

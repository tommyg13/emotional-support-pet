/* Small dock activities and a shared visual presenter for docked/roaming pets. */
const CompanionActivities=(()=>{
 const core=CompanionActivitiesCore;
 const giftSVG='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="12" width="38" height="28" rx="6" fill="#edd4b0" stroke="#b58b67" stroke-width="2"/><path d="m6 15 18 13 18-13" fill="none" stroke="#b58b67" stroke-width="2"/><path d="M24 10c-10-10-14 2 0 6 14-4 10-16 0-6" fill="#d991a1"/></svg>';
 const fileSVG='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 4h19l9 9v31H11Z" fill="#f8ead5" stroke="#b99c7e" stroke-width="2"/><path d="M30 4v10h9M17 23h16m-16 7h13" fill="none" stroke="#b99c7e" stroke-width="2"/><path d="M24 36c-5-5-8 2 0 5 8-3 5-10 0-5" fill="#da94a6"/></svg>';
 function presenter({root,pet,getController,getPersonality=()=> 'calm',roaming=false}){
  const note=document.createElement('div'),prop=document.createElement('div');note.className='activity-note';note.setAttribute('role','status');note.setAttribute('aria-live','polite');prop.className='activity-prop';prop.setAttribute('aria-hidden','true');note.hidden=prop.hidden=true;root.append(note,prop);
  let timer=null,alive=true,visual=null;const history={};
  function clear(){clearTimeout(timer);timer=null;visual?.classList.remove('activity-inspect','activity-hug','activity-sniff');visual=null;note.hidden=prop.hidden=true;}
  function message(text){note.textContent=text;note.hidden=false;}
  function show(kind){
   if(!alive)return false;clear();const controller=getController();if(!controller||controller.destroyed)return false;
   const personality=getPersonality();
   if(kind==='focus-start'){if(controller.supports('sit'))controller.sit();else controller.react('normal');message('I’m here. Let’s focus on one thing.');}
   else if(kind==='focus-complete'){if(controller.supports('wake'))controller.wake();if(controller.supports('searchCompleted'))controller.searchCompleted();else controller.jump();message(core.choose('focus',personality,history.focus));history.focus=note.textContent;}
   else if(kind==='gift'||kind==='file'){
    if(roaming){controller.stop();controller.wake();controller.lookAt({x:pet.getBoundingClientRect().left,y:pet.getBoundingClientRect().top});}else{controller.wake();controller.react(controller.definition?.type==='svg'?'auto':'curious');}
    visual=roaming?(pet.querySelector('svg')||pet.firstElementChild||pet):pet;void visual.offsetWidth;visual.classList.add(personality==='playful'?'activity-hug':personality==='sleepy'?'activity-sniff':'activity-inspect');
    prop.innerHTML=kind==='gift'?giftSVG:fileSVG;const p=pet.getBoundingClientRect(),r=root.getBoundingClientRect();
    if(roaming){prop.style.position='fixed';prop.style.left=p.left+p.width*.12+'px';prop.style.top=p.top+p.height*.64+'px';note.style.position='fixed';note.style.left=Math.max(8,Math.min(innerWidth-260,p.left-200))+'px';note.style.top=Math.max(8,p.top-45)+'px';}
    else{prop.style.left=(p.left-r.left)/r.width*root.offsetWidth+pet.offsetWidth*.10+'px';prop.style.top=(p.top-r.top)/r.height*root.offsetHeight+pet.offsetHeight*.64+'px';}
    prop.hidden=false;message(core.choose(kind,personality,history[kind]));history[kind]=note.textContent;
   }else return false;
   timer=setTimeout(clear,kind==='focus-complete'?5500:4500);return true;
  }
  return {show,clear,message,destroy(){if(!alive)return;alive=false;clear();note.remove();prop.remove();}};
 }
 function attachDrop({surface,present,onBefore=()=>{},documentRoot=document}){
  let depth=0,alive=true;
  const files=e=>Array.from(e.dataTransfer?.types||[]).includes('Files');
  function enter(e){if(files(e)){e.preventDefault();depth++;surface.classList.add('activity-drop-target');}}
  function over(e){if(files(e)){e.preventDefault();e.dataTransfer.dropEffect='copy';}}
  function leave(){depth=Math.max(0,depth-1);if(!depth)surface.classList.remove('activity-drop-target');}
  function clear(){depth=0;surface.classList.remove('activity-drop-target');}
  function drop(e){e.preventDefault();e.stopPropagation();clear();if(!alive||!e.dataTransfer?.files?.length)return;onBefore();present('file',core.fileKind(e.dataTransfer.files[0]));}
  function preventNavigation(e){e.preventDefault();if(e.type==='drop')clear();}
  surface.addEventListener('dragenter',enter);surface.addEventListener('dragover',over);surface.addEventListener('dragleave',leave);surface.addEventListener('drop',drop);documentRoot.addEventListener('dragover',preventNavigation);documentRoot.addEventListener('drop',preventNavigation);window.addEventListener('blur',clear);
  return {clear,destroy(){alive=false;clear();surface.removeEventListener('dragenter',enter);surface.removeEventListener('dragover',over);surface.removeEventListener('dragleave',leave);surface.removeEventListener('drop',drop);documentRoot.removeEventListener('dragover',preventNavigation);documentRoot.removeEventListener('drop',preventNavigation);window.removeEventListener('blur',clear);}};
 }
 function mountDock({root,pet,input,getController,getPersonality,isRoaming,relay,focusPolicy}){
  const timer=focusPolicy||core.createFocus(),view=presenter({root,pet,getController,getPersonality});
  const toggle=document.createElement('button');toggle.id='activityToggle';toggle.type='button';toggle.textContent='✦';toggle.title='Companion activities';toggle.setAttribute('aria-label','Companion activities');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','activityPanel');
  const panel=document.createElement('section');panel.id='activityPanel';panel.className='activity-panel';panel.dataset.activityUi='';panel.hidden=true;panel.setAttribute('aria-label','Companion activities');
  panel.innerHTML='<h3>Focus buddy</h3><div class="activity-row activity-focus-controls"><label>Minutes <select id="focusMinutes"><option>5</option><option>15</option><option selected>25</option><option>45</option></select></label><button id="focusStart" type="button">Start</button><button id="focusPause" type="button" disabled>Pause</button><button id="focusCancel" type="button" disabled>Cancel</button></div><p id="focusStatus" role="status">A little time together. One thing at a time.</p><div class="activity-row"><button id="hideBuddy" type="button" aria-pressed="false">Hide &amp; peek</button><button id="giftBuddy" type="button">Bring a gift</button><button id="stowSearch" type="button">Pack away search</button><button id="closeActivities" type="button">Close</button></div><p>Drop a file on your buddy to react.</p>';
  const badge=document.createElement('div');badge.className='activity-badge';badge.hidden=true;root.append(toggle,panel,badge);
  const find=id=>panel.querySelector('#'+id);let presentEpoch=0,alive=true,hidden=false,peekTimer=null,hideTimer=null,pendingCompletion=false,lastState={phase:'idle',remaining:0};
  function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}
  function settleHide(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(hidden&&!pet.classList.contains('activity-peek'))pet.classList.add('activity-hidden-settled');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:680);}
  function reveal(){clearTimeout(hideTimer);pet.classList.remove('activity-hidden-settled');presentEpoch++;clearTimeout(peekTimer);peekTimer=null;hidden=false;pet.classList.remove('activity-hide','activity-peek');find('hideBuddy').setAttribute('aria-pressed','false');find('hideBuddy').textContent='Hide & peek';}
  function present(kind){if(!alive)return false;reveal();view.clear();if(isRoaming()){const controller=getController(),epoch=presentEpoch;relay(kind).then(sent=>{if(alive&&epoch===presentEpoch&&!sent&&controller===getController()){view.clear();view.message(core.choose(kind==='focus-complete'?'focus':'gift',getPersonality()));}}).catch(()=>{});return true;}return view.show(kind);}
  function renderFocus(){
   if(!alive)return;const state=timer.tick();lastState=state;if(state.completed)pendingCompletion=true;
   const active=state.phase==='running'||state.phase==='paused',seconds=Math.ceil(state.remaining/1000),time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
   const paw=document.getElementById('stowedPaw');if(paw)paw.title='Restore search'+(active?' · Focus '+time:pendingCompletion?' · Focus complete':'');
   badge.hidden=!active;badge.textContent=(state.phase==='paused'?'Paused · ':'Focus · ')+time;find('focusStatus').textContent=active?(state.phase==='paused'?'Paused · ':'Focusing together · ')+time:state.phase==='completed'?'Focus complete. Time for a small break.':'A little time together. One thing at a time.';
   find('focusPause').hidden=!active;find('focusCancel').hidden=!active;find('focusPause').disabled=!active;find('focusPause').textContent=state.phase==='paused'?'Resume':'Pause';find('focusCancel').disabled=!active;find('focusStart').textContent=active?'Restart':'Start';
   if(pendingCompletion&&!document.hidden&&!document.body.classList.contains('dock-stowed')&&!document.body.classList.contains('dock-stow-busy')){pendingCompletion=false;present('focus-complete');}
  }
  function start(minutes){if(!timer.start(minutes)){view.message('Choose a focus time from 1 to 120 minutes.');return false;}pendingCompletion=false;close();present('focus-start');renderFocus();return true;}
  function cancel(){presentEpoch++;timer.cancel();pendingCompletion=false;view.clear();if(!isRoaming()&&getController()?.definition?.type==='svg')getController().react('auto');if(isRoaming())relay('focus-cancel').catch(()=>{});renderFocus();}
  function hide(){if(isRoaming())return false;view.clear();hidden=!hidden;clearTimeout(peekTimer);clearTimeout(hideTimer);pet.classList.remove('activity-hidden-settled');pet.classList.toggle('activity-hide',hidden);pet.classList.remove('activity-peek');if(hidden)settleHide();find('hideBuddy').setAttribute('aria-pressed',String(hidden));find('hideBuddy').textContent=hidden?'Come back':'Hide & peek';close();return true;}
  function peek(e){if(e?.isComposing||!hidden||isRoaming())return;clearTimeout(hideTimer);pet.classList.remove('activity-hidden-settled');pet.classList.add('activity-peek');clearTimeout(peekTimer);peekTimer=setTimeout(()=>{pet.classList.remove('activity-peek');settleHide();peekTimer=null;},3200);}
  function open(){panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));view.clear();if(!panel.hidden)find('focusMinutes').focus();}
  function key(e){if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopImmediatePropagation();close();toggle.focus();return;}if(e.key!=='Enter'||e.isComposing||e.target!==input)return;const text=input.value.trim(),match=/^\/(focus|gift|hide|peek)(?:\s+(.*))?$/i.exec(text);if(!match)return;e.preventDefault();e.stopImmediatePropagation();input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));const cmd=match[1].toLowerCase(),arg=(match[2]||'').trim().toLowerCase();
   if(cmd==='gift'){close();present('gift');}else if(cmd==='hide')hide();else if(cmd==='peek'){if(!hidden)hide();peek();}else if(arg==='stop'||arg==='cancel')cancel();else if(arg==='pause'){timer.pause();renderFocus();}else if(arg==='resume'){timer.resume();renderFocus();}else start(arg?Number(arg):25);
  }
  function submitClick(e){key({key:'Enter',target:input,isComposing:false,preventDefault:()=>e.preventDefault(),stopImmediatePropagation:()=>e.stopImmediatePropagation()});}
  const submit=root.querySelector('#go');submit?.addEventListener('click',submitClick,true);
  function outside(e){if(!panel.contains(e.target)&&e.target!==toggle)close();}
  function otherAction(e){if(e.target.closest('#giveWater,#giveSnack,#playYarn,#walkToggle,#resizeDock')){reveal();view.clear();}}
  function resetTransient(){reveal();view.clear();drop.clear();close();find('hideBuddy').disabled=isRoaming();find('stowSearch').disabled=isRoaming();find('stowSearch').title=isRoaming()?'Bring your companion home first':'Let your companion pack away the search';renderFocus();}
  find('stowSearch').onclick=()=>{close();window.dispatchEvent(new Event('dock-stow-request'));};
  toggle.onclick=open;find('closeActivities').onclick=()=>{close();toggle.focus();};find('focusStart').onclick=()=>start(Number(find('focusMinutes').value));find('focusPause').onclick=()=>{if(lastState.phase==='paused')timer.resume();else timer.pause();renderFocus();};find('focusCancel').onclick=cancel;find('hideBuddy').onclick=hide;find('giftBuddy').onclick=()=>{close();present('gift');};
  const drop=attachDrop({surface:pet,present,onBefore:()=>{reveal();close();}});const interval=setInterval(renderFocus,1000);
  input.addEventListener('input',peek);input.addEventListener('keydown',key,true);document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',outside);root.addEventListener('pointerdown',otherAction,true);document.addEventListener('visibilitychange',renderFocus);window.addEventListener('dock-stow-changed',renderFocus);resetTransient();
  return {resetTransient,destroy(){if(!alive)return;alive=false;clearInterval(interval);clearTimeout(peekTimer);timer.cancel();drop.destroy();view.destroy();reveal();input.removeEventListener('input',peek);input.removeEventListener('keydown',key,true);document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',outside);root.removeEventListener('pointerdown',otherAction,true);document.removeEventListener('visibilitychange',renderFocus);window.removeEventListener('dock-stow-changed',renderFocus);submit?.removeEventListener('click',submitClick,true);toggle.remove();panel.remove();badge.remove();}};
 }
 return Object.freeze({mountDock,presenter,attachDrop});
})();

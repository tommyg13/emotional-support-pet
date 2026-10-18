/* Reuses the selected companion; owns only this scene's session and cleanup. */
const SupportMomentUI=(()=>{
 function mount({root,onClose,now=()=>performance.now(),mountPet=(...args)=>SearchCharacters.mount(...args)}){
  const core=SupportMomentCore,$=id=>root.querySelector('#'+id),session=core.createSession({now}),input=document.getElementById('petInput');
  let alive=true,epoch=0,controller=null,payload=null,mode='breathe',ready=false,interval=null,pausedForVisibility=false,lastMessage='',lastBreak='',currentText='',announced='';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clearIntervalTimer(){clearInterval(interval);interval=null;}
  function releasePet(){controller?.destroy();controller=null;$('pet').replaceChildren();}
  function text(instruction,message){$('instruction').textContent=instruction;const key=instruction+'|'+message;if(announced!==key){announced=key;$('message').textContent=message;}}
  function render(){
   if(!alive)return;const state=session.tick(),active=['running','paused'].includes(state.phase),complete=state.phase==='complete';
   $('start').hidden=active;$('start').disabled=!ready;$('start').textContent=complete?'Another little moment':mode==='breathe'?'Take three breaths':mode==='encourage'?'A little encouragement':'Take 20 seconds';
   $('pause').hidden=!active;$('pause').textContent=state.phase==='paused'?'Resume':'Pause';$('timing').hidden=!active&&!complete;
   $('progress').value=state.progress;$('counter').textContent=mode==='breathe'?`Breath ${state.round} of 3`:`${state.remaining} seconds`;
   root.style.setProperty('--breath',!reduced&&mode==='breathe'&&active?String(.9+state.breath*.16):'1');root.style.setProperty('--pet-breath',!reduced&&mode==='breathe'&&active?String(.98+state.breath*.035):'1');
   if(complete){text(mode==='breathe'?'A little more room to breathe':mode==='encourage'?'One small step, when you’re ready':'Welcome back',mode==='breathe'?'No need to rush back. Your companion is right here.':mode==='encourage'?currentText:'A small pause counts too. Let’s take the next thing gently.');}
   else if(state.phase==='paused')text('A little pause','Stay here as long as you like. Resume whenever you’re ready.');
   else if(state.phase==='running')text(mode==='breathe'?(state.inhaling?'Breathe in gently':'Breathe out slowly'):core.modes[mode].title,mode==='breathe'?'Follow your own comfortable pace. The circle can keep you company.':currentText);
   else text(core.modes[mode].title,core.modes[mode].intro);
   if(state.justCompleted&&controller){if(controller.supports('searchCompleted'))controller.searchCompleted();clearIntervalTimer();}
  }
  function select(value){if(!Object.hasOwn(core.modes,value))return;mode=value;session.cancel(mode);pausedForVisibility=false;clearIntervalTimer();for(const button of root.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));render();}
  function start(){if(!ready||!controller)return false;currentText=mode==='encourage'?(lastMessage=core.encouragement(payload.catPersonality,lastMessage)):mode==='break'?(lastBreak=core.breakIdea(lastBreak)):'';session.start(mode);pausedForVisibility=false;clearIntervalTimer();if(controller.supports('wake'))controller.wake();if(mode==='encourage')controller.react(controller.definition.type==='svg'?'normal':'happy');render();interval=setInterval(render,100);return true;}
  async function open(value={}){
   if(!alive)return false;const token=++epoch;payload=value;clearIntervalTimer();session.cancel();pausedForVisibility=false;releasePet();ready=false;announced='';$('loading').hidden=false;$('loading').textContent='Your companion is on the way…';$('retry').hidden=true;
   const id=SearchCharacters.predefined.some(pet=>pet.id===value.searchCharacter)?value.searchCharacter:'wizard-cat',fallback=id==='panda'?'Your panda':id==='pomeranian'?'Your puppy':'Your cat';
   const name=CatName.normalize(value[id==='panda'?'pandaName':id==='pomeranian'?'puppyName':'catName'])||fallback;
   $('companionLabel').textContent=name+' is here with you.';$('pet').setAttribute('aria-label',name);select(value.mode||'breathe');$('close').focus();
   try{
    const mounted=mountPet(id,'docked',$('pet'),{input});controller=mounted;mounted.setPersonality(['calm','playful','sleepy'].includes(value.catPersonality)?value.catPersonality:'calm');mounted.setName(name);
    const loaded=await mounted.ready;if(!alive||token!==epoch)return false;if(loaded===false)throw Error('Pet unavailable');ready=true;$('loading').hidden=true;mounted.react(mounted.definition.type==='svg'?'normal':'idle');render();return true;
   }catch{if(alive&&token===epoch){$('loading').textContent='Your companion couldn’t load. Let’s try again.';$('retry').hidden=false;ready=false;render();}return false;}
  }
  function close(){if(!alive)return;epoch++;session.cancel();clearIntervalTimer();releasePet();ready=false;pausedForVisibility=false;onClose();}
  function visibility(){if(document.hidden){if(session.tick().phase==='running'){session.pause();pausedForVisibility=true;render();}}else if(pausedForVisibility){pausedForVisibility=false;session.resume();render();}}
  function key(event){if(event.key==='Escape'){event.preventDefault();close();}}
  function retry(){open(payload||{});}
  const buttons=[...root.querySelectorAll('[data-mode]')];for(const button of buttons)button.onclick=()=>select(button.dataset.mode);
  $('start').onclick=start;$('pause').onclick=()=>{pausedForVisibility=false;if(session.tick().phase==='paused')session.resume();else session.pause();render();};$('close').onclick=close;$('retry').onclick=retry;
  root.addEventListener('character-retry',retry);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
  return {open,start,render,select,close,destroy(){if(!alive)return;alive=false;epoch++;session.cancel();clearIntervalTimer();releasePet();document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);root.removeEventListener('character-retry',retry);for(const button of buttons)button.onclick=null;for(const id of ['start','pause','close','retry'])$(id).onclick=null;}};
 }
 return Object.freeze({mount});
})();

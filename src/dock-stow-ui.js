/* Push/pull staging around a real native compact window, with a permanent restore button. */
const DockStowUI=(()=>{
 const pawSVG='<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="31" rx="12" ry="10" fill="currentColor"/><ellipse cx="10" cy="20" rx="5" ry="7" transform="rotate(-25 10 20)" fill="currentColor"/><ellipse cx="20" cy="12" rx="5" ry="7" fill="currentColor"/><ellipse cx="31" cy="13" rx="5" ry="7" fill="currentColor"/><ellipse cx="39" cy="23" rx="5" ry="7" transform="rotate(25 39 23)" fill="currentColor"/></svg>';
 function mount({root,getController,isRoaming,request,subscribe,onBefore=()=>{},getPersonality=()=> 'calm'}){
  const paw=document.createElement('button');paw.id='stowedPaw';paw.type='button';paw.innerHTML=pawSVG;paw.title='Restore search';paw.setAttribute('aria-label','Restore search');paw.hidden=true;document.body.appendChild(paw);
  const hands=document.createElement('div');hands.id='stowPaws';hands.setAttribute('aria-hidden','true');hands.innerHTML=pawSVG+pawSVG;root.appendChild(hands);
  const sack=document.createElement('div');sack.id='stowSack';sack.setAttribute('aria-hidden','true');sack.innerHTML='<svg viewBox="0 0 100 110"><path d="M29 24 23 7q27 9 54 0l-6 17 15 31q18 46-36 48Q-4 101 14 55Z" fill="#cfa57a" stroke="#886744" stroke-width="3"/><path d="M27 25q23 8 46 0M29 32q21 7 42 0" fill="none" stroke="#886744" stroke-width="4"/><path d="M35 45q-12 25-6 39m39-42q13 28 5 43" fill="none" stroke="#e8cba6" stroke-width="3"/></svg>';root.appendChild(sack);
  const note=document.createElement('div');note.id='stowNote';note.className='stow-note';note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.hidden=true;root.appendChild(note);
  let noteTimer=null,phaseTimers=[],actor=null,actorShell=null,packingController=null,lastQuote='';
  function clearNote(){clearTimeout(noteTimer);note.hidden=true;}
  function resetActor(){phaseTimers.forEach(clearTimeout);phaseTimers=[];actor?.destroy();actor=null;actorShell?.remove();actorShell=null;packingController?.renderer?.setPackingPhase?.('idle');packingController=null;document.body.classList.remove('dock-stow-walking-cat');}
  function showNote(){if(root.querySelector('.activity-note:not([hidden]),#yarnBubble:not([hidden]),#careBubble:not([hidden])'))return;const lines={calm:['All unpacked. One thing at a time. ♡','Your cozy corner is ready.','Back home. What shall we do?'],playful:['Ta-da! Missed me?','Tiny paw, surprisingly roomy!','Unpacked and ready for mischief!'],sleepy:['Five more minutes in the bag?','I brought my nap with me.','Cozy in there… cozy out here.']};const choices=(lines[getPersonality()]||lines.calm).filter(x=>x!==lastQuote);lastQuote=choices[Math.floor(Math.random()*choices.length)];note.textContent=lastQuote;note.hidden=false;noteTimer=setTimeout(clearNote,4500);}
  function walkToBag(){const controller=getController();packingController=controller;if(controller.definition?.type==='svg'&&typeof WalkingCat!=='undefined'){
    actorShell=document.createElement('div');actorShell.id='stowWalkingShell';root.appendChild(actorShell);actor=WalkingCat.mount(actorShell,{x:438,y:179,scale:.51,minDepth:1,speed:90,reducedMotion:reduced,bounds:()=>({minX:0,maxX:560,minY:0,maxY:270})});actor.element.id='stowWalkingCat';document.body.classList.add('dock-stow-walking-cat');actor.walkTo(455,227);
   }else controller.renderer?.setPackingPhase?.('walk');
   phaseTimers.push(setTimeout(()=>{actor?.stop();controller.renderer?.setPackingPhase?.('bag');},650));
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let alive=true,compact=false,busy=false,timer=null,epoch=0;
  function emit(){window.dispatchEvent(new Event('dock-stow-changed'));}
  function finish(){resetActor();clearTimeout(timer);timer=null;busy=false;document.body.classList.remove('dock-stow-busy','dock-stow-push','dock-stow-pull','dock-stow-struggle');paw.disabled=false;emit();}
  function receive(value){if(!alive)return;const wasCompact=compact,wasBusy=busy;epoch++;clearTimeout(timer);compact=!!value;document.body.classList.toggle('dock-stowed',compact);paw.hidden=!compact;
   if(compact){finish();paw.focus();}else if(!wasCompact&&!wasBusy){finish();}else{document.body.classList.remove('dock-stow-push','dock-stow-struggle');paw.disabled=false;document.body.classList.add('dock-stow-pull');document.body.classList.add('dock-stow-busy');busy=true;timer=setTimeout(()=>{finish();showNote();},reduced?0:1800);}emit();
  }
  function restore(immediate=false){
   if(!alive||!compact||busy&&!immediate)return;
   const token=++epoch;clearTimeout(timer);busy=true;paw.disabled=true;
   document.body.classList.toggle('dock-stow-struggle',!immediate&&!reduced);
   const expand=async()=>{timer=null;if(!alive||token!==epoch)return;try{const result=await request(false);if(!alive||token!==epoch)return;if(result?.ok&&compact)receive(false);else finish();}catch{if(alive&&token===epoch){finish();paw.title='Could not restore. Click to retry.';}}};
   if(immediate||reduced)expand();else timer=setTimeout(expand,850);
  }
  function start(){if(!alive||busy||compact||isRoaming())return false;clearNote();onBefore();busy=true;document.body.classList.add('dock-stow-busy','dock-stow-push');const controller=getController();controller.react(controller.definition?.type==='svg'?'auto':'curious');const token=++epoch;if(!reduced)phaseTimers.push(setTimeout(walkToBag,350));
   timer=setTimeout(async()=>{timer=null;if(!alive||token!==epoch)return;try{const result=await request(true);if(!alive||token!==epoch)return;if(!result?.ok){finish();return;}if(!compact)receive(true);}catch{if(alive)finish();}},reduced?0:3200);return true;
  }
  function cancelStaging(){clearNote();if(!compact&&busy){epoch++;finish();}}
  function shortcut(e){if(!compact&&busy&&e.key==='Escape'){e.preventDefault();cancelStaging();return;}if(compact&&(e.key==='Escape'||e.key==='Enter'||e.key===' ')){e.preventDefault();restore(true);}}
  function focusRequested(){cancelStaging();if(compact)restore(true);}
  paw.onclick=()=>restore();window.addEventListener('dock-focus-request',focusRequested);window.addEventListener('dock-stow-request',start);window.addEventListener('companion-character-changed',cancelStaging);window.addEventListener('companion-mode-changed',cancelStaging);document.addEventListener('keydown',shortcut,true);
  root.addEventListener('pointerdown',clearNote,true);root.addEventListener('input',clearNote,true);
  const unsubscribe=subscribe(receive);
  return {start,restore,destroy(){if(!alive)return;alive=false;epoch++;resetActor();clearNote();root.removeEventListener('pointerdown',clearNote,true);root.removeEventListener('input',clearNote,true);clearTimeout(timer);unsubscribe?.();window.removeEventListener('dock-focus-request',focusRequested);window.removeEventListener('dock-stow-request',start);window.removeEventListener('companion-character-changed',cancelStaging);window.removeEventListener('companion-mode-changed',cancelStaging);document.removeEventListener('keydown',shortcut,true);document.body.classList.remove('dock-stowed','dock-stow-busy','dock-stow-push','dock-stow-pull','dock-stow-struggle');paw.remove();hands.remove();sack.remove();note.remove();}};
 }
 return Object.freeze({mount});
})();

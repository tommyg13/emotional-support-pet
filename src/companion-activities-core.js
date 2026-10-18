/* Local activities: no files, storage, network, or timers. */
(function(root){
 const messages={
  calm:{gift:['A small reminder: one thing at a time.','Your next tiny challenge: relax your shoulders.','A little note: you have permission to take a breath.'],focus:['Well done. You made time for what matters.','A lovely bit of focus. Shall we stretch?','Your focus break is here. I kept you company.'],file:['Let me have a gentle look at this.','An interesting little delivery.','I’ll keep this file company for a moment.']},
  playful:{gift:['Secret mission: drink some water!','A tiny gift: one imaginary gold star!','Challenge unlocked: stretch like your companion!'],focus:['Focus quest complete! You earned a happy dance!','You did the work. I brought the celebration!','Mission accomplished! Tiny victory party!'],file:['Special delivery! I’m giving it a hug.','A file for me? Best day ever!','Important cargo! Companion inspection underway.']},
  sleepy:{gift:['A cozy note: blink slowly and rest your eyes.','Tiny challenge: take three unhurried breaths.','A little gift: a reminder to be kind to yourself.'],focus:['You focused. I supervised… mostly awake.','Time for a cozy little break.','Finished already? That deserves a sleepy cheer.'],file:['Sniff… this seems interesting.','Let me inspect this before my next nap.','A little delivery for a sleepy companion.']}
 };
 function choose(kind,personality='calm',last='',random=Math.random){const profile=messages[personality]||messages.calm,choices=(profile[kind]||profile.gift).filter(x=>x!==last);return choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))];}
 function fileKind(file){const type=typeof file?.type==='string'?file.type.toLowerCase():'';if(type.startsWith('image/'))return 'image';if(type.startsWith('audio/'))return 'audio';if(type.startsWith('video/'))return 'video';return 'file';}
 function createFocus({now=()=>Date.now()}={}){
  let phase='idle',deadline=0,remaining=0,pending=false;
  function update(){if(phase==='running'){remaining=Math.max(0,deadline-now());if(remaining===0){phase='completed';pending=true;}}}
  return {
   start(minutes=25){if(!Number.isInteger(minutes)||minutes<1||minutes>120)return false;remaining=minutes*60000;deadline=now()+remaining;phase='running';pending=false;return true;},
   pause(){update();if(phase!=='running')return false;phase='paused';return true;},
   resume(){if(phase!=='paused')return false;deadline=now()+remaining;phase='running';return true;},
   cancel(){phase='idle';remaining=0;deadline=0;pending=false;},
   tick(){update();const completed=pending;pending=false;return {phase,remaining,completed};}
  };
 }
 const api=Object.freeze({createFocus,choose,fileKind});root.CompanionActivitiesCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

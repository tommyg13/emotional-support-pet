/* Offline text and a clock-based session, shared by the scene and its checks. */
(function(root){
 const modes=Object.freeze({breathe:{duration:30000,title:'Take a breath',intro:'Three gentle breaths, at your own pace.'},encourage:{duration:6500,title:'A little courage',intro:'You don’t have to do everything at once.'},break:{duration:20000,title:'A tiny break',intro:'Twenty seconds away from the rush.'}});
 const messages={calm:['One small step is enough for now. I’m right here.','You can begin again, gently.','You’ve made it this far. Let’s take the next little step together.'],playful:['Tiny paws, big belief in you!','You handle the next little thing. I’ll handle being adorable.','Progress counts, even when it comes in tiny pawsteps.'],sleepy:['You’re allowed a slower day. We’ll get there.','Rest is part of the adventure too.','One thing at a time… with a little room to breathe.']};
 const breaks=['Let your shoulders soften. Look away from the screen for a moment.','Give your hands a little rest. Let them settle somewhere comfortable.','Look around the room. Find one small thing that makes you smile.'];
 function choose(list,previous,random=Math.random){const options=list.filter(text=>text!==previous),value=random();return options[Math.min(options.length-1,Math.max(0,Math.floor((Number.isFinite(value)?value:0)*options.length)))];}
 function encouragement(personality,previous,random){return choose(messages[personality]||messages.calm,previous,random);}
 function breakIdea(previous,random){return choose(breaks,previous,random);}
 function createSession({now=()=>performance.now()}={}){
  let phase='idle',mode='breathe',started=0,elapsed=0,reported=false;
  function age(){return elapsed+(phase==='running'?Math.max(0,now()-started):0);}
  function tick(){const value=Math.min(modes[mode].duration,age());let justCompleted=false;if(phase==='running'&&value>=modes[mode].duration){elapsed=value;phase='complete';if(!reported){reported=true;justCompleted=true;}}
   const cycle=Math.min(2,Math.floor(value/10000)),position=value%10000,inhaling=position<4000;
   const wave=inhaling?position/4000:1-(position-4000)/6000;
   return {mode,phase,elapsed:value,remaining:Math.max(0,Math.ceil((modes[mode].duration-value)/1000)),progress:value/modes[mode].duration,round:cycle+1,inhaling,breath:(1-Math.cos(Math.PI*wave))/2,justCompleted};
  }
  return {tick,start(value=mode){if(!Object.hasOwn(modes,value))return false;mode=value;phase='running';elapsed=0;started=now();reported=false;return true;},pause(){if(phase!=='running')return false;elapsed=age();phase='paused';return true;},resume(){if(phase!=='paused')return false;started=now();phase='running';return true;},cancel(value=mode){if(!Object.hasOwn(modes,value))return false;mode=value;phase='idle';elapsed=0;reported=false;return true;}};
 }
 const api=Object.freeze({modes,encouragement,breakIdea,createSession});root.SupportMomentCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

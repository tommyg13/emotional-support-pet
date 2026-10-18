/* Shared timing policy. Idle gestures never count as human activity. */
(function(root){
 const profiles=Object.freeze({calm:{first:30000,repeat:60000},playful:{first:20000,repeat:45000},sleepy:{first:45000,repeat:90000}});
 function create({now=()=>performance.now(),random=Math.random,personality='calm'}={}){
  let alive=true,current=Object.hasOwn(profiles,personality)?personality:'calm',lastActivity=now(),lastWelcome=-Infinity,nextGesture=0,turn=0;
  const delay=kind=>profiles[current][kind]*(.9+Math.max(0,Math.min(1,random()))*.2);
  const pause=()=>{if(alive)nextGesture=now()+delay('first');};pause();
  return {
   activity({allowWelcome=true}={}){
    if(!alive)return false;const t=now(),away=t-lastActivity;lastActivity=t;pause();
    if(allowWelcome&&away>=90000&&t-lastWelcome>=120000){lastWelcome=t;return true;}
    return false;
   },
   tick({busy=false,visible=true,reduced=false}={}){
    if(!alive)return null;const t=now();
    if(busy||!visible||reduced){nextGesture=Math.max(nextGesture,t+delay('first'));return null;}
    if(t<nextGesture)return null;nextGesture=t+delay('repeat');
    const look=(turn+++(current==='playful'?1:0))%2;return look?'idle-look':'idle-tilt';
   },
   pause,
   setPersonality(value){if(!alive)return;current=Object.hasOwn(profiles,value)?value:'calm';turn=0;lastActivity=now();pause();},
   destroy(){alive=false;}
  };
 }
 const api=Object.freeze({create});root.CompanionIdle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

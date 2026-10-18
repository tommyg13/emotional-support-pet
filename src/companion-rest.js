/* Quiet posture timing; injected clock keeps idle behavior testable. */
(function(root){
 const times={calm:[45000,120000],playful:[60000,180000],sleepy:[30000,90000]};
 function create({now=()=>performance.now(),personality='calm'}={}){
  let alive=true,last=now(),stage=0,current=times[personality]?personality:'calm';
  const activity=()=>{last=now();stage=0;};
  return {activity,pause:()=>{last=now();},setPose:kind=>{last=now();stage=kind==='sleep'?2:1;},setPersonality:value=>{current=times[value]?value:'calm';activity();},
   tick({busy=false,visible=true}={}){if(!alive)return null;if(!visible){last=now();return null;}if(busy){activity();return null;}const age=now()-last,next=age>=times[current][1]?2:age>=times[current][0]?1:0;if(next<=stage)return null;stage=next;return next===2?'sleep':'sit';},
   destroy(){alive=false;}};
 }
 const api=Object.freeze({create});root.CompanionRest=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

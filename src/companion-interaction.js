/* Bounded interaction envelopes shared by rendering and timing checks. */
(function(root){
 function sample(elapsed,duration,kind,reduced=false){
  if(!Number.isFinite(elapsed)||!Number.isFinite(duration)||duration<=0)throw new RangeError('Interaction timing must be finite with a positive duration');
  const u=Math.max(0,Math.min(1,elapsed/duration));
  if(reduced||u===0||u===1)return {chew:0,lap:0,paw:0,nod:0};
  if(kind==='ball'){
   const t=u<.34?(u-.26)/.08:(.46-u)/.12;
   const e=Math.max(0,Math.min(1,t));return {chew:0,lap:0,paw:e*e*(3-2*e),nod:0};
  }
  const envelope=Math.min(1,u/.12,(1-u)/.16),cycle=(1-Math.cos(u*Math.PI*(kind==='water'?12:8)))/2;
  return {chew:envelope*cycle*(kind==='snack'?.8:.25),lap:kind==='water'?envelope*cycle:0,paw:0,nod:envelope*cycle*.025};
 }
 const api=Object.freeze({sample});root.CompanionInteraction=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

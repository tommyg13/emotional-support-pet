/* A bounded, renderer-independent ball-play path. Coordinates are stage units. */
(function(root){
  function sample(elapsed,duration,reduced=false){
    if(!Number.isFinite(elapsed)||!Number.isFinite(duration)||duration<=0)throw new RangeError('Ball timing must be finite with a positive duration');
    const u=Math.max(0,Math.min(1,elapsed/duration)),radius=.11;
    if(reduced)return {x:-.4,y:radius,z:.8,visible:u<1,wag:false,done:u>=1};
    const from={x:-1.05,z:.88},near={x:-.30,z:.72},out={x:-1.12,z:.92};
    let x=near.x,y=radius,z=near.z;
    if(u<.28){const t=u/.28,e=1-Math.pow(1-t,3);x=from.x+(near.x-from.x)*e;z=from.z+(near.z-from.z)*e;y+=.055*Math.sin(Math.PI*t)*(1-t);}
    else if(u<.38){const t=(u-.28)/.1;x-=.02*Math.sin(Math.PI*t);y+=.035*Math.sin(Math.PI*t);}
    else if(u<.6){const t=(u-.38)/.22,e=t*t*(3-2*t);x=near.x+(out.x-near.x)*e;z=near.z+(out.z-near.z)*e;y+=.035*Math.abs(Math.sin(Math.PI*2*t))*(1-t);}
    else{x=out.x;z=out.z;}
    return {x,y,z,visible:u<.6,wag:u>=.6,done:u>=1};
  }
  const api=Object.freeze({sample});root.CompanionBall=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

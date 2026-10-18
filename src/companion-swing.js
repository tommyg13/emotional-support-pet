/* Small damped pickup swing, independent of event frequency and renderer timing. */
(function(root){
 function create({reduced=false}={}){
  let angle=0,velocity=0,target=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  return {
   aim(pixelsPerSecond){if(!reduced&&Number.isFinite(pixelsPerSecond))target=clamp(pixelsPerSecond*.006,-14,14);},
   step(dt,held){
    if(reduced)return 0;if(!Number.isFinite(dt)||dt<=0)return angle;
    let remaining=Math.min(dt,.05);
    while(remaining>0){const h=Math.min(remaining,1/120);remaining-=h;
     target=held?target*Math.exp(-h*5):0;
     velocity+=((target-angle)*(held?45:85)-velocity*(held?11:17))*h;
     angle=clamp(angle+velocity*h,-18,18);
    }
    if(Math.abs(angle)<.01&&Math.abs(velocity)<.02&&Math.abs(target)<.01)angle=velocity=target=0;
    return angle;
   },
   active:()=>angle!==0||velocity!==0||target!==0,
   reset(){angle=velocity=target=0;}
  };
 }
 const api=Object.freeze({create});root.CompanionSwing=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

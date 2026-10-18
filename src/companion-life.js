/* Clock-driven facial motion; it owns no timers, DOM, or renderer objects. */
(function(root){
 const profiles={calm:{min:4500,range:3500,blink:190,breath:4600},playful:{min:3500,range:3000,blink:170,breath:3800},sleepy:{min:5500,range:4000,blink:240,breath:5800}};
 function create({now=()=>performance.now(),random=Math.random,personality='calm'}={}){
  let alive=true,current=profiles[personality]?personality:'calm',last=now(),epoch=last,next=0,start=null,eye=0,chest=0;
  const profile=()=>profiles[current];
  const schedule=()=>{next=now()+profile().min+Math.max(0,Math.min(1,random()))*profile().range;};schedule();
  const toward=(a,b,step)=>a+Math.max(-step,Math.min(step,b-a));
  return {
   blink(){if(!alive||start!==null)return false;start=now();return true;},
   pause({sleeping=false}={}){last=now();start=null;eye=sleeping?1:0;chest=0;schedule();},
   setPersonality(value){current=profiles[value]?value:'calm';start=null;schedule();},
   sample({sleeping=false,busy=false,visible=true,reduced=false}={}){
    const t=now(),dt=Math.max(0,Math.min(100,t-last));last=t;
    if(!alive)return {blink:0,breath:0,fast:false};
    if(!visible){start=null;eye=sleeping?1:0;chest=0;schedule();return {blink:eye,breath:0,fast:false};}
    if(sleeping||busy||reduced){start=null;if(t>=next)schedule();}
    else if(start===null&&t>=next)start=t;
    let fast=false;
    if(sleeping){eye=reduced?1:toward(eye,1,dt/180);fast=eye<1;}
    else if(reduced){eye=0;}
    else if(start!==null){
     const phase=(t-start)/profile().blink;
     if(phase>=1){start=null;eye=0;schedule();}
     else{eye=Math.sin(Math.PI*Math.max(0,phase))**2;fast=true;}
    }else{eye=toward(eye,0,dt/160);fast=eye>0;}
    const target=busy||reduced?0:(.5-.5*Math.cos((t-epoch)/profile().breath*Math.PI*2))*(sleeping?1:.6);
    chest=reduced?0:toward(chest,target,dt/240);
    return {blink:eye,breath:chest,fast};
   },
   destroy(){alive=false;start=null;eye=chest=0;}
  };
 }
 const api=Object.freeze({create});root.CompanionLife=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

/* Offline seated panda. It owns its WebGL surface, clips, interactions and cleanup. */
const Panda=(()=>{
 const base=new URL('.',document.currentScript.src);
 const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
 const careIcons={
  water:svg('<path d="M14 27h36l-6 25H20Z" fill="#a6ddeb" stroke="#558ea0" stroke-width="3"/><ellipse cx="32" cy="27" rx="18" ry="6" fill="#def8fc" stroke="#558ea0" stroke-width="3"/>'),
  snack:svg('<path d="m23 53 14-43 12 4-14 43Z" fill="#8eb143" stroke="#5c7929" stroke-width="3"/><path d="m27 42 12 4M32 27l12 4M36 14l12 4" stroke="#d5df86" stroke-width="4"/><path d="M31 29Q7 30 14 13q16 1 17 16" fill="#5f9c42"/>')
 };
 const toyIcon=svg('<path d="M13 49Q6 10 52 11q-1 43-39 38Z" fill="#8db354" stroke="#577d39" stroke-width="3"/><path d="m12 52 29-29m-17 17-2-15m9 8 15 1" fill="none" stroke="#dce6a3" stroke-width="3"/>');
 const lines={
  calm:{snack:['A little bamboo, a little peace.','Thank you. That was a lovely break.','Bamboo shared is happiness doubled.'],water:['A gentle sip. Ready when you are.','Thank you for the water break.','Fresh water, fresh thoughts.'],play:['A little leaf, a lovely break.','Your turn to focus. I’ll keep you company.','Leaf inspected. Everything is cozy.']},
  playful:{snack:['Crunch mission complete!','Five stars for bamboo delivery!','Powered by bamboo and your excellent taste!'],water:['Hydrated for maximum panda energy!','Sip, sip—back to panda business!','Water delivery? You’re the best!'],play:['Leaf patrol complete!','I caught the fun. You catch up on work!','A tiny adventure for a tiny panda!']},
  sleepy:{snack:['One little crunch before a nap.','Bamboo tastes better when you’re cozy.','Thank you… now I’m extra comfy.'],water:['A sleepy sip. Thank you.','Hydrated. Cozy. Almost dreaming.','Just enough energy for another yawn.'],play:['That leaf was surprisingly energetic.','Playtime done. Nap thoughts loading.','You work. I’ll dream about leaves.']}
 };
 function mount(container,{input,lifePolicy,restPolicy,idlePolicy,roaming=false}={}){
  const host=document.createElement('div');host.style.cssText='position:relative;width:100%;height:100%';host.dataset.state='loading';host.setAttribute('aria-busy','true');container.appendChild(host);
  const status=document.createElement('div');status.setAttribute('role','status');status.textContent='Loading panda…';status.style.cssText='position:absolute;inset:40% 0 auto;text-align:center;font:12px system-ui;color:#705145';host.appendChild(status);
  const item=document.createElement('div');item.style.cssText='display:none;position:absolute;width:36px;height:36px;pointer-events:none;transform:translate(-50%,-20%)';host.appendChild(item);
  const ring=document.createElement('div');ring.dataset.careTarget='';ring.setAttribute('aria-hidden','true');ring.style.cssText='display:none;position:absolute;width:22px;height:22px;border:2px solid #b0c879;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none';host.appendChild(ring);
  const life=lifePolicy||CompanionLife.create(),rest=restPolicy||CompanionRest.create(),idle=idlePolicy||CompanionIdle.create();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,actions=new Map(),eyes=[],props=[];
  let alive=true,failed=false,raf=0,observer,renderer,scene,camera,model,asset,mixer,head,headBase,turn,nod,yawAxis,pitchAxis,mouthAnchor,mouthRight,projection,rightProjection,active=null;
  let asleep=false,delivery=null,carry=null,playSession=null,gesture=null,personality='calm',name='',pointer=null,searchUntil=0,quoteTimer=null,quoteEpoch=0,last=0,lastDraw=0,dirty=true,surfaceVisible=true;
  let packing=false,seated=!roaming,locomotion=null,pickedUp=false,landingUntil=0,bodyYaw=0,targetBodyYaw=0,wakeTimer=null,wakeResolve=null,waking=null,pickupEpoch=0;
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  function cancelWake(){clearTimeout(wakeTimer);wakeTimer=null;wakeResolve?.(false);wakeResolve=null;waking=null;}
  function idlePose(){activate(roaming&&!seated?'Stand':'SeatedIdle',roaming&&!seated);}
  function setHeading(dx,dy=0){if(!alive||failed||!camera||![dx,dy].every(Number.isFinite)||Math.hypot(dx,dy)<.001)return false;const azimuth=Math.atan2(camera.position.x,camera.position.z);targetBodyYaw=Math.atan2(dx*Math.cos(azimuth)+dy*Math.sin(azimuth),-dx*Math.sin(azimuth)+dy*Math.cos(azimuth));if(reduced)bodyYaw=targetBodyYaw;dirty=true;return true;}
  function setLocomotion(kind,velocity=0){
   if(!alive||failed||(!roaming&&!packing)||!model||!['idle','walk','run'].includes(kind))return false;
   if(kind==='idle'||reduced){if(locomotion){locomotion=null;if(!asleep&&!seated&&!pickedUp)idlePose();}return true;}
   if(!Number.isFinite(velocity)||velocity<=0||asleep||seated||waking||pickedUp)return false;
   rest.activity();if(locomotion!==kind){const phase=locomotion&&active?(active.time/active.getClip().duration)%1:0;locomotion=kind;activate(kind==='run'?'Run':'Walk');active.time=phase*active.getClip().duration;}
   const stride=kind==='run'?.22:.16,duration=kind==='run'?.6:.8,pixelsPerSource=host.clientHeight*(1.9/2.7)/2.6;
   active.setEffectiveTimeScale(Math.max(.15,Math.min(3.5,velocity/(2*stride/(duration*.5)*pixelsPerSource))));dirty=true;return true;
  }
  // A temporary dock presentation uses the same skeletal walk as the roaming panda.
  function setPackingPhase(phase){
   if(!alive||failed||!model)return false;
   cancelWake();cancelInteraction();asleep=false;pickedUp=false;waking=null;
   if(phase==='walk'){packing=true;seated=false;setHeading(1,0);setLocomotion('walk',65);}
   else if(phase==='bag'){locomotion=null;activate('Stand',true);targetBodyYaw=Math.atan2(camera.position.x,camera.position.z)+Math.PI;dirty=true;}
   else{packing=false;locomotion=null;seated=!roaming;bodyYaw=targetBodyYaw=0;idlePose();dirty=true;}
   return true;
  }
  function pickUp(){
   if(!alive||failed||!model||!roaming)return false;const epoch=++pickupEpoch;
   wake().then(ok=>{if(!ok||!alive||epoch!==pickupEpoch)return;cancelInteraction();locomotion=null;pickedUp=true;activate('Pickup',true);});return true;
  }
  function releasePickup(cancelled=false){
   pickupEpoch++;if(!pickedUp)return false;pickedUp=false;rest.activity();
   if(cancelled||reduced){landingUntil=0;idlePose();}else{landingUntil=performance.now()+550;activate('Land');}return true;
  }
  const lastQuotes=new Map();
  function emit(type,detail={}){if(alive)host.dispatchEvent(new CustomEvent(type,{detail,bubbles:true}));}
  function clearQuote(){quoteEpoch++;if(quoteTimer!==null){clearTimeout(quoteTimer);quoteTimer=null;emit('cat-yarn-quote-clear');}}
  function quote(kind,event='companion-bubble'){
   clearQuote();const choices=lines[personality][kind].filter(x=>x!==lastQuotes.get(kind)),message=choices[Math.floor(Math.random()*choices.length)];lastQuotes.set(kind,message);
   const epoch=quoteEpoch;emit(event,{message,personality,kind});if(alive&&epoch===quoteEpoch)quoteTimer=setTimeout(()=>{quoteTimer=null;emit('cat-yarn-quote-clear');dirty=true;},4500);
  }
  function activate(clip,hold=false,speed=1){
   const next=actions.get(clip);if(!next)return;
   if(active===next&&hold&&['Stand','Pickup'].includes(clip)){next.stopFading().setEffectiveWeight(1);next.time=next.getClip().duration;next.paused=true;dirty=true;return;}
   active?.fadeOut(reduced?0:.22);next.reset().setEffectiveWeight(1).setEffectiveTimeScale(speed).play();
   if(!reduced)next.fadeIn(.22);
   if(hold&&(reduced||['Stand','Pickup'].includes(clip))){next.time=next.getClip().duration;next.paused=true;}else if(reduced){next.time=0;next.paused=true;}
   active=next;dirty=true;
  }
  function cancelManualCare(){if(!carry)return;carry=null;ring.style.display='none';emit('cat-manual-care-cancelled');dirty=true;}
  function cancelInteraction(){
   const had=!!(delivery||playSession||gesture);delivery=null;playSession=null;gesture=null;item.style.display='none';item.removeAttribute('data-care-item');cancelManualCare();clearQuote();
   if(had&&!asleep)idlePose();dirty=true;
  }
  function wake(){
   if(!alive||failed)return Promise.resolve(false);rest.activity();if(waking)return waking;
   const needsStand=roaming&&(seated||asleep);asleep=false;pickedUp=false;landingUntil=0;
   if(needsStand){seated=false;activate('Stand',true);if(reduced)return Promise.resolve(true);
    // Play from the seated endpoint, then hold the standing endpoint.
    active.paused=false;active.time=0;dirty=true;waking=new Promise(resolve=>wakeResolve=resolve);
    wakeTimer=setTimeout(()=>{wakeTimer=null;const resolve=wakeResolve;wakeResolve=null;waking=null;if(alive&&!failed){idlePose();resolve?.(true);}else resolve?.(false);},550);return waking;
   }
   if(!locomotion&&!delivery&&!playSession)idlePose();dirty=true;return Promise.resolve(true);
  }
  function sleep(){if(!alive||failed||!model)return false;pickupEpoch++;cancelWake();cancelInteraction();locomotion=null;pickedUp=false;asleep=true;seated=true;rest.setPose('sleep');activate(roaming?'RoamSleep':'Sleep',true);return true;}
  function sit(automatic=false){if(!alive||failed||!model)return false;pickupEpoch++;cancelWake();cancelInteraction();locomotion=null;pickedUp=false;asleep=false;seated=true;if(!automatic)rest.setPose('sit');activate(roaming?'Sit':'SeatedIdle');return true;}
  function activity(){rest.activity();wake();idle.activity({allowWelcome:false});}
  function getCareTarget(){
   if(!alive||failed||!mouthAnchor||!host.clientWidth)return null;model.updateMatrixWorld(true);mouthAnchor.getWorldPosition(projection).project(camera);mouthRight.getWorldPosition(rightProjection).project(camera);
   const b=host.getBoundingClientRect();return {x:b.left+(projection.x+1)*b.width/2,y:b.top+(1-projection.y)*b.height/2,angle:Math.atan2(-(rightProjection.y-projection.y)*b.height,(rightProjection.x-projection.x)*b.width),radius:Math.max(14,Math.min(28,b.width*.14))};
  }
  function deliver(kind,manual=false){
   if(!alive||failed||!model||!Object.hasOwn(careIcons,kind)||delivery)return false;
   cancelInteraction();activity();delivery={kind,manual,start:performance.now()};activate('Nibble',false,2);
   if(kind==='water'){item.innerHTML=careIcons.water;item.dataset.careItem=kind;item.style.display='block';}return true;
  }
  function beginManualCare(kind){if(!alive||failed||!model||!Object.hasOwn(careIcons,kind)||delivery||carry)return false;cancelInteraction();activity();carry={kind,point:null};dirty=true;return true;}
  function updateManualCare(x,y){
   if(!carry||![x,y].every(Number.isFinite))return false;carry.point={x,y};const target=getCareTarget();dirty=true;
   if(target&&Math.hypot(x-target.x,y-target.y)<=target.radius){const kind=carry.kind;carry=null;ring.style.display='none';deliver(kind,true);emit('cat-manual-care-delivered',{kind});return true;}return false;
  }
  function play(){if(!alive||failed||!model||playSession)return false;cancelInteraction();activity();playSession={start:performance.now(),last:performance.now(),duration:reduced?750:personality==='playful'?2600:personality==='sleepy'?4000:3200};item.innerHTML=toyIcon;item.style.display='block';dirty=true;return true;}
  function react(kind){if(!alive||failed||!model)return false;if(kind==='play')return play();if(['water','snack'].includes(kind))return deliver(kind);if(kind==='sleep')return sleep();if(kind==='wake')return wake();if(!['idle','curious','tilt','happy','celebrate','welcome','idle-look','idle-tilt'].includes(kind))return false;cancelInteraction();activity();gesture={kind,start:performance.now(),duration:reduced?100:1200};dirty=true;if(kind==='welcome'){clearQuote();const epoch=quoteEpoch;emit('companion-bubble',{message:(name||'Your panda')+' saved you a cozy spot. ♡'});if(alive&&epoch===quoteEpoch)quoteTimer=setTimeout(()=>{quoteTimer=null;emit('cat-yarn-quote-clear');},4500);}return true;}
  function blink(){if(!alive||failed||!model||asleep||reduced||delivery||playSession||carry||gesture||pickedUp||locomotion||waking)return false;dirty=true;return life.blink();}
  function onInput(e){if(e.isComposing)return;cancelInteraction();activity();searchUntil=performance.now()+1800;}
  function onMove(e){pointer={x:e.clientX,y:e.clientY};dirty=true;}
  function onLeave(){pointer=null;cancelManualCare();dirty=true;}
  function onBlur(){pickupEpoch++;cancelInteraction();pointer=null;searchUntil=0;life.pause({sleeping:asleep});idle.pause();rest.pause();dirty=true;}
  function onVisibility(){if(document.hidden)onBlur();dirty=true;}
  input?.addEventListener('input',onInput);input?.addEventListener('focus',onInput);window.addEventListener('pointermove',onMove);document.addEventListener('pointerleave',onLeave);window.addEventListener('blur',onBlur);document.addEventListener('visibilitychange',onVisibility);
  function fail(error){if(!alive||failed)return;failed=true;cancelWake();onBlur();cancelAnimationFrame(raf);clearTimeout(slowLoad);observer?.disconnect();if(renderer)renderer.domElement.style.display='none';host.dataset.state='error';host.setAttribute('aria-busy','false');status.replaceChildren(document.createTextNode('Panda unavailable. '));const retry=document.createElement('button');retry.textContent='Retry';retry.setAttribute('aria-label','Retry loading panda');retry.onclick=()=>emit('character-retry');status.appendChild(retry);host.appendChild(status);emit('character-error',{message:String(error?.message||error)});}
  function contextLost(e){e.preventDefault();fail(new Error('Graphics context lost'));}
  function dispose(object){const textures=new Set(),materials=new Set(),geometries=new Set(),skeletons=new Set();object?.traverse(c=>{if(c.skeleton)skeletons.add(c.skeleton);if(c.geometry)geometries.add(c.geometry);for(const m of Array.isArray(c.material)?c.material:c.material?[c.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});skeletons.forEach(x=>x.dispose());textures.forEach(x=>{x.source?.data?.close?.();x.dispose();});materials.forEach(x=>x.dispose());geometries.forEach(x=>x.dispose());}
  const slowLoad=setTimeout(()=>{if(alive&&!failed&&host.dataset.state==='loading')status.textContent='Still loading panda…';},15000);
  const ready=(async()=>{try{
   const [T,{GLTFLoader}]=await Promise.all([import(new URL('vendor/three/three.module.js',base)),import(new URL('vendor/three/GLTFLoader.js',base))]);if(!alive)return false;
   scene=new T.Scene();camera=new T.PerspectiveCamera(32,1,.1,30);camera.position.set(1.0,1.25,4.4);camera.lookAt(0,.96,0);
   renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';host.prepend(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',contextLost);
   scene.add(new T.HemisphereLight(0xfff6e9,0x6b7285,2));const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(3,4,5);scene.add(key);const fill=new T.DirectionalLight(0xe4eeff,.7);fill.position.set(-3,2,1);scene.add(fill);
   const gltf=await new GLTFLoader().loadAsync(new URL('assets/panda/panda.glb',base).href);if(!alive||failed){dispose(gltf.scene);return false;}
   asset=gltf.scene;model=new T.Group();const box=new T.Box3().setFromObject(asset),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=1.9/Math.max(size.x,size.y,size.z);asset.position.set(-center.x,-box.min.y,-center.z);const normalized=new T.Group();normalized.scale.setScalar(scale);normalized.add(asset);model.add(normalized);scene.add(model);
   asset.traverse(c=>{if(c.isMesh){c.frustumCulled=false;if(c.morphTargetDictionary?.Blink!==undefined)eyes.push(c);if(c.name.startsWith('Bamboo_')||c.name.startsWith('Leaf_midrib'))props.push(c);}});
   mixer=new T.AnimationMixer(asset);for(const clip of gltf.animations){const action=mixer.clipAction(clip);action.setLoop(['SeatedIdle','Walk','Run'].includes(clip.name)?T.LoopRepeat:T.LoopOnce,['SeatedIdle','Walk','Run'].includes(clip.name)?Infinity:1);action.clampWhenFinished=true;actions.set(clip.name,action);}
   for(const required of ['SeatedIdle','Nibble','Sleep','Stand','Sit','Walk','Run','RoamSleep','Pickup','Land'])if(!actions.has(required))throw new Error('Missing panda animation: '+required);
   head=asset.getObjectByName('Head');if(!head)throw new Error('Missing panda head');scene.updateMatrixWorld(true);headBase=head.quaternion.clone();const inverse=head.getWorldQuaternion(new T.Quaternion()).invert();yawAxis=new T.Vector3(0,1,0).applyQuaternion(inverse).normalize();pitchAxis=new T.Vector3(1,0,0).applyQuaternion(inverse).normalize();turn=new T.Quaternion();nod=new T.Quaternion();
   mouthAnchor=new T.Object3D();mouthRight=new T.Object3D();mouthAnchor.position.copy(head.worldToLocal(asset.localToWorld(new T.Vector3(0,1.76,.69))));mouthRight.position.copy(head.worldToLocal(asset.localToWorld(new T.Vector3(.08,1.76,.69))));head.add(mouthAnchor,mouthRight);projection=new T.Vector3();rightProjection=new T.Vector3();idlePose();
   function resize(){if(!alive||failed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);dirty=true;}
   observer=new ResizeObserver(resize);observer.observe(host);resize();clearTimeout(slowLoad);status.remove();host.dataset.state='ready';host.setAttribute('aria-busy','false');
   let yaw=0,pitch=0,lastEye=-1;
   function frame(now){
    if(!alive||failed)return;raf=requestAnimationFrame(frame);if(now-last<1000/30)return;const dt=Math.min(.1,(now-last)/1000);last=now;
    const visible=!document.hidden&&host.checkVisibility({checkVisibilityCSS:true});if(!visible){if(surfaceVisible){surfaceVisible=false;onBlur();}life.pause({sleeping:asleep});rest.pause();idle.pause();return;}if(!surfaceVisible){surfaceVisible=true;dirty=true;}
    if(landingUntil&&now>=landingUntil){landingUntil=0;idlePose();}
    const busy=!!(packing||delivery||carry||playSession||gesture||locomotion||pickedUp||waking||landingUntil);const restKind=rest.tick({busy,visible:true});if(restKind==='sleep')sleep();else if(restKind==='sit'&&roaming)sit(true);const idleKind=idle.tick({busy:busy||asleep||(roaming&&seated)||quoteTimer!==null,visible:true,reduced});if(idleKind)react(idleKind);
    const face=life.sample({sleeping:asleep,busy,visible:true,reduced});const animate=!reduced&&(!asleep||face.fast||active?.isRunning());
    if(!dirty&&!busy&&!packing&&!animate&&Math.abs(face.blink-lastEye)<.001)return;
    if(!dirty&&!busy&&!face.fast&&now-lastDraw<100)return;const renderDt=Math.min(.15,(now-lastDraw)/1000);lastDraw=now;dirty=false;
    // Restore the pre-look orientation before the mixer; gaze never accumulates.
    const remaining=angleDelta(bodyYaw,targetBodyYaw);bodyYaw+=Math.sign(remaining)*Math.min(Math.abs(remaining)*(1-Math.exp(-renderDt*8)),renderDt*4.2);model.rotation.y=bodyYaw;
    head.quaternion.copy(headBase);mixer.update(reduced?0:renderDt);headBase.copy(head.quaternion);
    let gaze=carry?.point||pointer;if(now<searchUntil&&input){const b=input.getBoundingClientRect();gaze={x:b.left+b.width/2,y:b.top+b.height/2};}
    const bounds=host.getBoundingClientRect();let targetYaw=0,targetPitch=0;
    if(gaze&&!asleep&&!reduced&&!locomotion&&!pickedUp){targetYaw=Math.max(-.20,Math.min(.20,(gaze.x-bounds.left-bounds.width*.5)/300*.20));targetPitch=Math.max(-.08,Math.min(.12,(gaze.y-bounds.top-bounds.height*.35)/200*.12));}
    if(gesture){const u=(now-gesture.start)/gesture.duration;if(u>=1)gesture=null;else if(!reduced){targetYaw+=Math.sin(u*Math.PI*2)*.10;targetPitch-=Math.sin(u*Math.PI)*.05;}}
    if(playSession){const p=playSession;if(now-p.last>1000){cancelInteraction();}else{p.last=now;const u=Math.min(1,(now-p.start)/p.duration);if(u>=1){playSession=null;item.style.display='none';idlePose();quote('play','cat-yarn-complete');}else{const x=reduced?.25:.25+Math.sin(u*Math.PI*3)*.16,y=reduced?.55:.55+Math.sin(u*Math.PI*2)*.11;item.style.left=x*host.clientWidth+'px';item.style.top=y*host.clientHeight+'px';item.style.transform=reduced?'translate(-50%,-50%)':`translate(-50%,-50%) rotate(${Math.sin(u*Math.PI*4)*25}deg)`;targetYaw=reduced?0:Math.sin(u*Math.PI*3)*.16;}}}
    const blend=1-Math.exp(-renderDt*9);yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;if(!asleep&&!reduced&&!locomotion&&!pickedUp)head.quaternion.multiply(turn.setFromAxisAngle(yawAxis,yaw)).multiply(nod.setFromAxisAngle(pitchAxis,pitch));
    for(const mesh of eyes)mesh.morphTargetInfluences[mesh.morphTargetDictionary.Blink]=face.blink;lastEye=face.blink;
    for(const prop of props)prop.visible=!asleep&&!pickedUp&&delivery?.kind!=='water';
    if(carry||delivery){const target=getCareTarget();if(target){const b=host.getBoundingClientRect(),x=(target.x-b.left)/b.width*host.clientWidth,y=(target.y-b.top)/b.height*host.clientHeight;if(carry){ring.style.display='block';ring.style.left=x+'px';ring.style.top=y+'px';}if(delivery?.kind==='water'){item.style.left=x+'px';item.style.top=y+'px';item.style.transform='translate(-50%,-20%)';}}}
    if(delivery&&now-delivery.start>=1500){const done=delivery;delivery=null;item.style.display='none';item.removeAttribute('data-care-item');idlePose();if(done.manual)quote(done.kind,'cat-manual-care-complete');}
    renderer.render(scene,camera);
   }
   raf=requestAnimationFrame(frame);return true;
  }catch(error){fail(error);return false;}})();
  return {element:host,ready,setPackingPhase,getPose:()=>failed?'error':!model?'loading':pickedUp?'held':landingUntil?'landing':waking?'waking':asleep?'sleeping':locomotion==='run'?'running':locomotion?'walking':delivery?'eating':playSession?'playing':seated?'sitting':'standing',setHeading,setLocomotion,pickUp,releasePickup,isResting:()=>asleep||seated||!!waking,getTurnRemaining:()=>Math.abs(angleDelta(bodyYaw,targetBodyYaw)),getCareTarget,beginManualCare,updateManualCare,cancelManualCare,giveCare:kind=>deliver(kind),play,react,blink,sit,sleep,wake,
   searchCompleted:()=>react('celebrate'),queryReset:()=>react('curious'),setName:value=>{name=typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim()).slice(0,24).join(''):'';},
   setPersonality:value=>{personality=Object.hasOwn(lines,value)?value:'calm';life.setPersonality(personality);rest.setPersonality(personality);idle.setPersonality(personality);if(asleep)rest.setPose('sleep');else if(roaming&&seated)rest.setPose('sit');},
   destroy(){if(!alive)return;pickupEpoch++;cancelWake();cancelInteraction();alive=false;clearTimeout(slowLoad);cancelAnimationFrame(raf);observer?.disconnect();life.destroy();rest.destroy();idle.destroy();input?.removeEventListener('input',onInput);input?.removeEventListener('focus',onInput);window.removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);window.removeEventListener('blur',onBlur);document.removeEventListener('visibilitychange',onVisibility);renderer?.domElement.removeEventListener('webglcontextlost',contextLost);mixer?.stopAllAction();if(asset)mixer?.uncacheRoot(asset);actions.clear();eyes.length=0;props.length=0;dispose(model);renderer?.dispose();renderer?.forceContextLoss();host.remove();}
  };
 }
 return Object.freeze({mount,careIcons,toyIcon});
})();

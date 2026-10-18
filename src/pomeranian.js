/* Offline Pomeranian renderer with separate reaction and leg-gait mixers. */
const Pomeranian = (() => {
  const base = new URL('.', document.currentScript.src);
  const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
  const careIcons = {
    water: svg('<path d="M16 29h32l-5 24H21Z" fill="#9DD9EB" stroke="#528EAA" stroke-width="3"/><ellipse cx="32" cy="29" rx="16" ry="5" fill="#DFF8FC" stroke="#528EAA" stroke-width="3"/>'),
    snack: svg('<path d="M18 23c-12-12-20 8-9 12-5 12 12 18 16 7l15-15c11 4 17-13 5-16-4-11-23-3-12 9Z" fill="#EACDA1" stroke="#B58D62" stroke-width="3"/>')
  };
  const toyIcon = svg('<circle cx="32" cy="32" r="23" fill="#F3978F" stroke="#BD6563" stroke-width="3"/><path d="M12 20q25 1 35 30M21 11q0 25 30 34" fill="none" stroke="#FFF0DC" stroke-width="4"/>');
  function mount(container, {input,idlePolicy,restPolicy,lifePolicy} = {}) {
    const host = document.createElement('div');
    host.style.cssText = 'position:relative;width:100%;height:100%;';
    const status = document.createElement('div');
    status.textContent = 'Loading puppy…';status.setAttribute('role','status');
    status.style.cssText='position:absolute;inset:40% 4px auto;text-align:center;font:12px system-ui;color:#705145';
    host.dataset.state='loading';host.setAttribute('aria-busy','true');
    host.appendChild(status);container.appendChild(host);
    const item = document.createElement('div');
    item.style.cssText='position:absolute;left:8%;bottom:12%;width:30px;height:30px;pointer-events:none;display:none;';host.appendChild(item);
    const targetRing=document.createElement('div');
    targetRing.setAttribute('aria-hidden','true');targetRing.dataset.careTarget='';
    targetRing.style.cssText='display:none;position:absolute;width:24px;height:24px;border:2px solid #dc9eaf;border-radius:50%;box-shadow:0 0 0 4px #fff6;transform:translate(-50%,-50%);pointer-events:none;';host.appendChild(targetRing);
    let quoteKind=null,quoteEpoch=0;
    const idle=idlePolicy||CompanionIdle.create();
    const restPolicyState=restPolicy||CompanionRest.create();
    const life=lifePolicy||CompanionLife.create();
    const faceMeshes=[];let faceApplied={blink:0,breath:0},lastFaceDraw=0;
    let posture=null,wakeTimer=null,wakeResolve=null,wakeActionId=0;
    const postureActions=new Map();
    let manualCare=null,delivery=null,quoteTimer=null,mouthAnchor,mouthRight,projected,projectedRight;
    const lastQuotes=new Map();
    const slowLoadTimer=setTimeout(()=>{if(alive&&!failed&&host.dataset.state==='loading')status.textContent='Still loading puppy…';},15000);
    function fail(error) {
      if(!alive||failed)return;
      failed=true;clearTimeout(slowLoadTimer);cancelAnimationFrame(raf);observer?.disconnect();onBlur();idle.destroy();
      host.dataset.state='error';host.setAttribute('aria-busy','false');
      if(view)view.domElement.style.display='none';
      status.replaceChildren();status.appendChild(document.createTextNode('Puppy unavailable. '));
      const retry=document.createElement('button');retry.type='button';retry.textContent='Retry';retry.setAttribute('aria-label','Retry loading puppy');
      retry.style.cssText='font:inherit;color:inherit;background:#f4e5da;border:0;border-radius:8px;padding:3px 7px;cursor:pointer;';
      retry.addEventListener('click',()=>{if(alive)emit('character-retry',{});});status.appendChild(retry);host.appendChild(status);
      emit('character-error',{message:String(error?.message||error)});
    }
    const onContextLost=event=>{event.preventDefault();fail(new Error('Graphics context lost'));};

    const battingBones=[];let pawApplied=false;
    let ballSession=null,ball,ballShadow,ballProjection,ballPoint=null;
    let dirty=true;
    let failed=false;
    let alive=true,raf=0,view,scene,model,camera,observer,visible=!document.hidden,surfaceVisible=true;
    let companionName='';
    let effect=null,last=0,yaw=0,pitch=0,personality='calm',mixer,assetRoot,activeAction;
    let pointer=null,searchLookUntil=0,nextSearchLook=0,head,headRest,headBase,yawAxis,pitchAxis,turn,nod;
    const actions=new Map(),gaitActions=new Map();
    let gaitMixer,gait=null,gaitStopAt=0,bodyYaw=0,targetBodyYaw=0;
    const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
    function setHeading(dx,dy=0){
      if(!alive||failed||!camera||!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.001)return false;
      const azimuth=Math.atan2(camera.position.x,camera.position.z);
      targetBodyYaw=Math.atan2(dx*Math.cos(azimuth)+dy*Math.sin(azimuth),-dx*Math.sin(azimuth)+dy*Math.cos(azimuth));
      if(reduced)bodyYaw=targetBodyYaw;dirty=true;return true;
    }
    function setLocomotion(kind,pixelsPerSecond=0){
      if(!alive||failed||!gaitMixer||!['idle','walk','run'].includes(kind))return false;
      if(kind!=='idle'&&(!Number.isFinite(pixelsPerSecond)||pixelsPerSecond<=0))return false;
      if(reduced&&kind!=='idle'&&posture)wake();
      if(kind==='idle'||reduced){wakeActionId++;if(gait){gait.action.fadeOut(.18);gait=null;gaitStopAt=performance.now()+200;dirty=true;}return true;}
      if(posture)return deferWake(()=>setLocomotion(kind,pixelsPerSecond));
      const clip=kind==='run'?'Trot':kind==='walk'?'Walk':null,action=gaitActions.get(clip);
      if(!action||!Number.isFinite(pixelsPerSecond)||pixelsPerSecond<=0)return false;
      const pixelsPerMeter=host.clientHeight*(1.9/.9035289)/2.5;
      const restSpeed=(clip==='Walk'?.10/(.8*.64):.13/((16/30)*.54))*pixelsPerMeter;
      const rate=Math.max(.02,Math.min(4,pixelsPerSecond/restSpeed));
      if(gait?.action!==action){const phase=gait?(gait.action.time/gait.action.getClip().duration)%1:0;gait?.action.fadeOut(.15);action.reset().setEffectiveWeight(1).fadeIn(.15).play();action.time=phase*action.getClip().duration;gait={kind,action};}
      action.setEffectiveTimeScale(rate);gaitStopAt=0;dirty=true;return true;
    }
    function wake(){
      if(!alive||failed)return Promise.resolve(false);
      restPolicyState.activity();
      if(!posture)return Promise.resolve(true);
      if(posture.kind==='waking')return posture.promise;
      const action=posture.action;clearTimeout(wakeTimer);wakeTimer=null;
      if(reduced){action.stop();posture=null;dirty=true;return Promise.resolve(true);}
      action.fadeOut(.45);dirty=true;
      const promise=new Promise(resolve=>wakeResolve=resolve);posture={kind:'waking',action,promise};
      wakeTimer=setTimeout(()=>{wakeTimer=null;action.stop();posture=null;dirty=true;const resolve=wakeResolve;wakeResolve=null;resolve?.(alive&&!failed);},480);
      return promise;
    }
    function deferWake(callback){
      if(!posture)return false;
      const id=++wakeActionId;wake().then(ok=>{if(ok&&alive&&id===wakeActionId)callback();});return true;
    }
    function pickUp(){
      if(!alive||failed||!model)return false;
      if(posture&&['sit','sleep','waking'].includes(posture.kind))return deferWake(pickUp);
      cancelPlay();cancelManualCare();cancelDelivery();setLocomotion('idle');
      return restPose('pickup');
    }
    function releasePickup(cancelled=false){
      wakeActionId++;
      if(!posture||posture.kind!=='pickup')return false;
      restPolicyState.activity();
      if(cancelled||reduced){wake();return true;}
      const action=postureActions.get('Land');if(!action){wake();return false;}
      const previous=posture.action;action.reset().play().setEffectiveWeight(1);action.crossFadeFrom(previous,.12,false);
      const duration=action.getClip().duration;
      posture={kind:'landing',action,until:performance.now()+(duration+.08)*1000};dirty=true;
      clearTimeout(wakeTimer);wakeTimer=setTimeout(()=>{wakeTimer=null;if(posture?.action===action){action.stop();posture=null;dirty=true;}},(duration+.08)*1000);
      return true;
    }
    function restPose(kind,automatic=false){
      const action=postureActions.get({sit:'Sit',sleep:'Sleep',pickup:'Pickup'}[kind]);
      if(!alive||failed||!action||gait||manualCare||delivery||ballSession)return false;
      if(posture?.kind===kind)return true;
      if(!automatic){if(kind==='pickup')restPolicyState.activity();else restPolicyState.setPose(kind);}
      wakeActionId++;clearTimeout(wakeTimer);wakeTimer=null;wakeResolve?.(false);wakeResolve=null;
      mixer.stopAllAction();activeAction=null;effect=null;clearQuote();resetItem();item.style.display='none';
      const previous=posture?.action;action.reset().play();action.time=action.getClip().duration;action.paused=true;
      const blend=kind==='pickup'?.16:.7;
      if(reduced){previous?.stop();action.setEffectiveWeight(1);}else{action.fadeIn(blend);if(previous&&previous!==action)previous.fadeOut(blend);}
      posture={kind,action,until:performance.now()+(reduced?34:(blend+.1)*1000)};dirty=true;return true;
    }
    function lifeBusy(){return !!(gait||manualCare||delivery||ballSession||(effect&&!passiveEffect())||(posture&&['pickup','landing','waking'].includes(posture.kind)));}
    function blink(){
      if(!alive||failed||!model||reduced||posture?.kind==='sleep'||lifeBusy())return false;
      const ok=life.blink();if(ok)dirty=true;return ok;
    }
    const clipNames={curious:'Curious',tilt:'HeadTilt',wag:'TailWag','idle-look':'Curious','idle-tilt':'HeadTilt',welcome:'Happy',water:'Happy',snack:'Happy',celebrate:'Happy',happy:'Happy'};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const disposeModel = object => {
      const textures=new Set(),materials=new Set(),geometries=new Set(),skeletons=new Set();
      object?.traverse(child=>{if(child.skeleton)skeletons.add(child.skeleton);if(child.geometry)geometries.add(child.geometry);for(const m of Array.isArray(child.material)?child.material:child.material?[child.material]:[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
      skeletons.forEach(s=>s.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose();});materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    };
    function emit(name,detail){if(alive)host.dispatchEvent(new CustomEvent(name,{bubbles:true,detail}));}
    function clearQuote(){
      quoteEpoch++;const hadQuote=quoteTimer!==null||quoteKind!==null;
      if(quoteTimer!==null)clearTimeout(quoteTimer);quoteTimer=null;quoteKind=null;
      if(hadQuote)emit('cat-yarn-quote-clear');
    }
    function showQuote(eventName,detail,kind){
      clearQuote();quoteKind=kind;const epoch=quoteEpoch;
      emit(eventName,detail);
      if(alive&&epoch===quoteEpoch)quoteTimer=setTimeout(()=>{quoteTimer=null;quoteKind=null;emit('cat-yarn-quote-clear');},4500);
    }
    function passiveEffect(){return effect?.kind.startsWith('idle-');}
    function passiveBusy(){return !!(gait||manualCare||delivery||ballSession||(effect&&!passiveEffect())||quoteTimer!==null);}
    function stopIdleGesture(){
      if(passiveEffect()){mixer.stopAllAction();effect=null;activeAction=null;dirty=true;}
    }
    function noteActivity(allowWelcome=true){
      restPolicyState.activity();if(posture?.kind==='pickup')return;if(posture)wake();
      const welcome=idle.activity({allowWelcome:allowWelcome&&visible&&!passiveBusy()});
      stopIdleGesture();if(welcome){if(posture)deferWake(()=>react('welcome',false,true));else react('welcome',false,true);}
    }
    const welcomeLines={
      calm:['Welcome back. I saved your spot.','There you are. Ready when you are.','Good to see you. Let’s take it one thing at a time.'],
      playful:['You’re back! Shall we do something brilliant?','My favorite human has returned!','Reporting for companion duty!'],
      sleepy:['Oh, hello again… I was just resting my eyes.','Welcome back. I kept things cozy.','You’re here. My day just got softer.']
    };
    function resetItem(){
      item.removeAttribute('data-care-item');item.style.left='8%';item.style.top='auto';item.style.bottom='12%';
      item.style.width='30px';item.style.height='30px';item.style.transformOrigin='50% 50%';item.style.transform='none';
    }
    function cancelDelivery(){if(delivery){delivery=null;item.style.display='none';resetItem();dirty=true;}}
    function cancelManualCare(){
      wakeActionId++;
      if(!manualCare)return;
      manualCare=null;targetRing.style.display='none';dirty=true;
      if(effect?.kind==='wag'){mixer.stopAllAction();effect=null;activeAction=null;}
      emit('cat-manual-care-cancelled');
    }
    function getCareTarget(){
      if(!alive||failed||!mouthAnchor||!camera)return null;
      scene.updateMatrixWorld(true);
      mouthAnchor.getWorldPosition(projected).project(camera);mouthRight.getWorldPosition(projectedRight).project(camera);
      if(projected.z<-1||projected.z>1)return null;
      const b=host.getBoundingClientRect();
      return {x:b.left+(projected.x+1)*b.width/2,y:b.top+(1-projected.y)*b.height/2,
        radius:Math.max(14,Math.min(30,b.width*.14)),
        angle:Math.atan2(-(projectedRight.y-projected.y)*b.height,(projectedRight.x-projected.x)*b.width)*180/Math.PI};
    }
    function startDelivery(kind,manual=false){
      if(posture&&deferWake(()=>startDelivery(kind,manual)))return true;
      if(!alive||failed||!model||!Object.hasOwn(careIcons,kind)||delivery)return false;
      if(!react(kind))return false;
      delivery={kind,manual,start:performance.now(),personality};
      item.setAttribute('data-care-item',kind);return true;
    }
    function beginManualCare(kind){
      if(posture&&deferWake(()=>beginManualCare(kind)))return true;
      if(!alive||failed||!model||!Object.hasOwn(careIcons,kind)||manualCare||delivery)return false;
      react('wag');manualCare={kind,point:null};clearQuote();dirty=true;return true;
    }
    function updateManualCare(x,y){
      if(!manualCare||![x,y].every(Number.isFinite))return false;
      manualCare.point={x,y};dirty=true;
      const target=getCareTarget();
      if(!target||Math.hypot(x-target.x,y-target.y)>target.radius)return false;
      const kind=manualCare.kind;manualCare=null;targetRing.style.display='none';
      if(!startDelivery(kind,true))return false;
      emit('cat-manual-care-delivered',{kind});return true;
    }
    const feedingLines={
      calm:{water:['A little sip, a happy pup.','Thank you. That hit the spot.','You take such good care of me.'],snack:['A treat from you? My favorite.','That was lovely. Thank you.','One happy pup, reporting for duty.']},
      playful:{water:['Hydrated and highly adorable!','Sip, sip—ready for mischief!','Water break? Best idea ever!'],snack:['Bone appétit!','Best delivery service ever!','Fueled for maximum tail wagging!']},
      sleepy:{water:['A sleepy sip. Back to cozy.','Thank you… even naps need water.','Refreshed. Still very sleepy.'],snack:['A snack and then a snooze.','You brought room service? Lovely.','Full tummy. Cozy thoughts.']}
    };
    function finishDelivery(){
      const done=delivery;delivery=null;item.style.display='none';resetItem();
      if(!done?.manual)return;
      const key=done.personality+done.kind,lines=feedingLines[done.personality][done.kind].filter(line=>line!==lastQuotes.get(key));
      const message=lines[Math.floor(Math.random()*lines.length)];lastQuotes.set(key,message);
      showQuote('cat-manual-care-complete',{kind:done.kind,personality:done.personality,message},'care');
    }
    function setBat(amount){
      for(const entry of battingBones)entry.bone.quaternion.copy(entry.rest).multiply(entry.rotation.setFromAxisAngle(entry.axis,entry.angle*amount));
      pawApplied=amount>0;
    }
    function cancelPlay(){
      if(!ballSession)return;
      if(pawApplied)setBat(0);
      const wasWagging=ballSession.wagging;ballSession=null;ballPoint=null;
      if(ball)ball.visible=false;if(ballShadow)ballShadow.visible=false;
      if(wasWagging&&effect?.kind==='wag'){mixer.stopAllAction();effect=null;activeAction=null;}
      dirty=true;
    }
    const playLines={
      calm:['A little play makes a lovely break.','Your turn to focus. I’ll keep watch.','That was fun. Back to our cozy routine.'],
      playful:['Ball duty complete! Your turn to be productive!','One more? Okay, okay—go do your thing!','I brought the happy. You bring the focus!'],
      sleepy:['A tiny adventure. Now a tiny rest.','You work. I’ll dream about that ball.','Playtime complete. Nap thoughts loading.']
    };
    function playBall(){
      if(posture&&deferWake(playBall))return true;
      if(!alive||failed||!model||!ball||ballSession)return false;
      noteActivity(false);cancelManualCare();cancelDelivery();clearQuote();resetItem();item.style.display='none';
      mixer.stopAllAction();activeAction=null;effect=null;
      const now=performance.now();
      ballSession={start:now,lastFrame:now,duration:reduced?750:personality==='playful'?3700:personality==='sleepy'?5400:4400,personality,wagging:false};
      if(!reduced&&battingBones.length===3){
        setBat(1);model.updateMatrixWorld(true);
        const contact=battingBones[2].bone.getWorldPosition(battingBones[2].bone.position.clone());
        contact.add(contact.clone().set(0,0,.14).applyAxisAngle(contact.clone().set(0,1,0),bodyYaw));
        ballSession.contact={x:contact.x,z:contact.z};setBat(0);model.updateMatrixWorld(true);
      }
      dirty=true;return true;
    }
    function updateBall(now){
      if(!ballSession)return;
      const session=ballSession;
      if(now-session.lastFrame>1000){cancelPlay();return;}
      session.lastFrame=now;
      const state=CompanionBall.sample(now-session.start,session.duration,reduced,session.contact);
      const oldX=ball.position.x,oldZ=ball.position.z;
      ball.position.set(state.x,state.y,state.z);ball.visible=state.visible;
      if(!reduced){ball.rotation.z-=(state.x-oldX)/.11;ball.rotation.x+=(state.z-oldZ)/.11;}
      ballShadow.position.set(state.x,.006,state.z);ballShadow.visible=state.visible;
      ballShadow.scale.setScalar(1+(state.y-.11)*2);ballShadow.material.opacity=.15-(state.y-.11);
      ballPoint=null;
      if(state.visible){
        ball.getWorldPosition(ballProjection).project(camera);const b=host.getBoundingClientRect();
        ballPoint={x:b.left+(ballProjection.x+1)*b.width/2,y:b.top+(1-ballProjection.y)*b.height/2};
      }
      if(state.wag&&!session.wagging){session.wagging=true;react('wag',true);}
      if(state.done){
        ballSession=null;ballPoint=null;ball.visible=false;ballShadow.visible=false;dirty=true;
        const key='play:'+session.personality,choices=playLines[session.personality].filter(line=>line!==lastQuotes.get(key));
        const message=choices[Math.floor(Math.random()*choices.length)];lastQuotes.set(key,message);
        showQuote('cat-yarn-complete',{personality:session.personality,message},'play');
      }
    }
    function react(kind,preservePlay=false,automatic=false) {
      if(typeof kind!=='string')return false;
      if(kind==='play')return playBall();
      if(kind==='idle')kind=personality==='playful'?'idle-look':'idle-tilt';
      if((kind.startsWith('idle-')||kind==='welcome')&&(manualCare||delivery||ballSession||(effect&&!passiveEffect())))return false;
      if(kind.startsWith('idle-')&&reduced)return false;
      if(!alive||failed||!model||!Object.hasOwn(clipNames,kind))return false;
      if(posture){if(automatic||kind.startsWith('idle-'))return false;return deferWake(()=>react(kind,preservePlay,automatic));}
      const now=performance.now();
      if(!automatic&&!preservePlay&&!kind.startsWith('idle-'))noteActivity(false);
      if(!preservePlay)cancelPlay();
      if(effect?.kind===kind)return false;
      cancelManualCare();cancelDelivery();clearQuote();resetItem();
      const action=actions.get(clipNames[kind]),previous=activeAction;
      if(previous===action||reduced)mixer.stopAllAction();
      activeAction=null;
      const rate=personality==='playful'?1.15:personality==='sleepy' ? 0.8 : 1;
      let duration=.45;
      if(!reduced&&action){
        action.reset().setEffectiveTimeScale(rate).setEffectiveWeight(1).play();
        if(previous&&previous!==action)action.crossFadeFrom(previous,.16,false);
        activeAction=action;duration=action.getClip().duration/rate;
      }
      effect={kind,start:now,duration};
      item.innerHTML=careIcons[kind]||svg('<path d="M32 52 10 30C-2 14 20 2 32 18 44 2 66 14 54 30Z" fill="#E99DA9"/>');
      item.style.display=['curious','tilt','wag'].includes(kind)||kind.startsWith('idle-')?'none':'block';
      if(kind==='welcome'){
        const key='welcome:'+personality,choices=welcomeLines[personality].filter(line=>line!==lastQuotes.get(key));
        const message=choices[Math.floor(Math.random()*choices.length)];lastQuotes.set(key,message);
        showQuote('companion-bubble',{kind:'welcome',personality,message:companionName ? `${companionName} says: ${message}` : message},'welcome');
      }
      dirty=true;return true;
    }
    function peekAtSearch(){
      if(!alive||!input)return;
      const now=performance.now();
      if(now<searchLookUntil){searchLookUntil=Math.min(nextSearchLook-2500,now+1800);return;}
      if(now<nextSearchLook||effect)return;
      searchLookUntil=now+2200;nextSearchLook=now+7000;dirty=true;
    }
    const onInput=()=>{
      wakeActionId++;
      cancelPlay();cancelManualCare();cancelDelivery();if(quoteKind!=='welcome')clearQuote();
      noteActivity();
      if(effect?.kind==='welcome'){mixer.stopAllAction();effect=null;activeAction=null;dirty=true;}
      if(input.value.trim())peekAtSearch();
    };
    const onFocus=()=>{noteActivity();peekAtSearch();};
    const onMove=e=>{pointer={x:e.clientX,y:e.clientY};if(!posture)noteActivity();};
    const onLeave=()=>{pointer=null;cancelManualCare();};
    const onBlur=()=>{life.pause({sleeping:posture?.kind==='sleep'});dirty=true;wakeActionId++;restPolicyState.pause();pointer=null;searchLookUntil=0;idle.pause();stopIdleGesture();cancelPlay();cancelManualCare();cancelDelivery();clearQuote();if(effect){mixer.stopAllAction();effect=null;activeAction=null;dirty=true;}};
    const onVisibility=()=>{visible=!document.hidden;life.pause({sleeping:posture?.kind==='sleep'});idle.pause();if(!visible)onBlur();dirty=true;};
    const onReturn=()=>{if(visible)noteActivity();};
    input?.addEventListener('input',onInput);input?.addEventListener('focus',onFocus);
    window.addEventListener('pointermove',onMove);document.addEventListener('pointerleave',onLeave);window.addEventListener('blur',onBlur);window.addEventListener('focus',onReturn);
    document.addEventListener('visibilitychange',onVisibility);
    const ready=(async()=>{
      try{
        const [T,{GLTFLoader}]=await Promise.all([import(new URL('vendor/three/three.module.js',base)),import(new URL('vendor/three/GLTFLoader.js',base))]);
        if(!alive)return false;
        view=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
        view.setPixelRatio(Math.min(devicePixelRatio||1,2));view.setClearColor(0,0);
        view.outputColorSpace=T.SRGBColorSpace;view.toneMapping=T.ACESFilmicToneMapping;view.toneMappingExposure=1.25;
        view.domElement.style.cssText='display:block;width:100%;height:100%;';
        view.domElement.setAttribute('role','img');view.domElement.setAttribute('aria-label','3D Pomeranian puppy');host.appendChild(view.domElement);view.domElement.addEventListener('webglcontextlost',onContextLost);
        scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x9d7860,2.7));
        const key=new T.DirectionalLight(0xfff2df,3);key.position.set(3,5,4);scene.add(key);
        const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-3,2,-2);scene.add(fill);
        camera=new T.OrthographicCamera(-1,1,1.2,-1.2,.01,100);
        camera.position.set(3,1.8,5);camera.lookAt(0,1,0);
        const gltf=await new GLTFLoader().loadAsync(new URL('assets/pomeranian/pomeranian.glb',base).href);
        if(!alive||failed){disposeModel(gltf.scene);return false;}
        model=new T.Group();const asset=gltf.scene;assetRoot=asset;
        mixer=new T.AnimationMixer(asset);
        gaitMixer=new T.AnimationMixer(asset);
        for(const clip of gltf.animations){
          const isGait=clip.name==='Walk'||clip.name==='Trot',isPosture=['Sit','Sleep','Pickup','Land'].includes(clip.name);
          const tracks=clip.tracks.filter(track=>{const node=T.PropertyBinding.parseTrackName(track.name).nodeName;return isPosture?true:isGait?(node==='Body'||/^(Front|Rear)[LR](Upper|Lower|Paw)$/.test(node)):node==='Head'||node==='Tail';});
          if(!tracks.length)continue;
          const filtered=new T.AnimationClip(clip.name,clip.duration,tracks),action=(isGait||isPosture?gaitMixer:mixer).clipAction(filtered);
          action.setLoop(isGait?T.LoopRepeat:T.LoopOnce,isGait?Infinity:1);action.clampWhenFinished=!isGait;(isPosture?postureActions:isGait?gaitActions:actions).set(clip.name,action);
        }
        const box=new T.Box3().setFromObject(asset),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
        const scale=1.9/Math.max(size.x,size.y,size.z);
        asset.position.set(-center.x,-box.min.y,-center.z);const normalized=new T.Group();normalized.add(asset);normalized.scale.setScalar(scale);model.add(normalized);scene.add(model);
        asset.traverse(child=>{if(child.isMesh){if(child.morphTargetDictionary?.Blink!==undefined&&child.morphTargetDictionary?.Breath!==undefined)faceMeshes.push(child);child.frustumCulled=false;for(const m of Array.isArray(child.material)?child.material:[child.material]){m.roughness=.85;m.metalness=0;}}});
        scene.updateMatrixWorld(true);head=asset.getObjectByName('Head');
        for(const [name,angle] of [['FrontLUpper',-.45],['FrontLLower',.25],['FrontLPaw',.20]]){
          const bone=asset.getObjectByName(name);if(bone)battingBones.push({bone,angle,rest:bone.quaternion.clone(),axis:new T.Vector3(1,0,0).applyQuaternion(bone.getWorldQuaternion(new T.Quaternion()).invert()).normalize(),rotation:new T.Quaternion()});
        }
        if(head){
          headRest=head.quaternion.clone();headBase=headRest.clone();const inverse=head.getWorldQuaternion(new T.Quaternion()).invert();
          yawAxis=new T.Vector3(0,1,0).applyQuaternion(inverse).normalize();
          pitchAxis=new T.Vector3(1,0,0).applyQuaternion(inverse).normalize();
          turn=new T.Quaternion();nod=new T.Quaternion();
          mouthAnchor=new T.Object3D();mouthRight=new T.Object3D();
          const mouthWorld=asset.localToWorld(new T.Vector3(0,.625,.39));
          const rightWorld=asset.localToWorld(new T.Vector3(.04,.625,.39));
          mouthAnchor.position.copy(head.worldToLocal(mouthWorld));mouthRight.position.copy(head.worldToLocal(rightWorld));
          head.add(mouthAnchor,mouthRight);projected=new T.Vector3();projectedRight=new T.Vector3();
        }
        ball=new T.Group();ball.visible=false;ball.position.set(-1.05,.11,.88);
        const rubber=new T.MeshStandardMaterial({color:0xf3978f,roughness:.85});
        ball.add(new T.Mesh(new T.SphereGeometry(.11,24,16),rubber));
        const stripe=new T.TorusGeometry(.1105,.006,6,36),cream=new T.MeshStandardMaterial({color:0xfff0dc,roughness:.85});
        const band1=new T.Mesh(stripe,cream),band2=new T.Mesh(stripe,cream);band2.rotation.x=Math.PI/2;ball.add(band1,band2);scene.add(ball);
        ballShadow=new T.Mesh(new T.CircleGeometry(.13,24),new T.MeshBasicMaterial({color:0x5b4037,transparent:true,opacity:.15,depthWrite:false}));
        ballShadow.rotation.x=-Math.PI/2;ballShadow.visible=false;scene.add(ballShadow);ballProjection=new T.Vector3();
        const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;view.setSize(w,h,false);const a=w/h;camera.left=-1.25*a;camera.right=1.25*a;camera.top=1.25;camera.bottom=-1.25;camera.updateProjectionMatrix();dirty=true;};
        observer=new ResizeObserver(resize);observer.observe(host);resize();clearTimeout(slowLoadTimer);status.remove();host.dataset.state='ready';host.setAttribute('aria-busy','false');
        function frame(now){
          if(!alive||failed)return;raf=requestAnimationFrame(frame);
          if(!visible||now-last<1000/30)return;
          const cssVisible=host.checkVisibility({checkVisibilityCSS:true});
          if(!cssVisible){if(surfaceVisible){surfaceVisible=false;onBlur();}life.pause({sleeping:posture?.kind==='sleep'});restPolicyState.pause();idle.pause();last=now;return;}
          if(!surfaceVisible){surfaceVisible=true;dirty=true;wake();}
          const dt=Math.min(.1,(now-last)/1000);last=now;
          const restKind=restPolicyState.tick({busy:!!(posture&&['pickup','landing','waking'].includes(posture.kind)||gait||manualCare||delivery||ballSession||effect||quoteTimer!==null),visible});
          if(restKind)restPose(restKind,true);
          const idleKind=idle.tick({busy:!!(posture||gait||manualCare||delivery||ballSession||effect||quoteTimer!==null||now<searchLookUntil),visible,reduced});
          if(idleKind)react(idleKind,false,true);
          updateBall(now);if(!alive)return;
          let gaze=ballSession?ballPoint:manualCare?.point||pointer;
          if(!ballSession&&!manualCare&&input&&now<searchLookUntil){const r=input.getBoundingClientRect();gaze={x:r.left+r.width/2,y:r.top+r.height/2};}
          const face=life.sample({sleeping:posture?.kind==='sleep',busy:lifeBusy(),visible,reduced});
          const faceNeedsDraw=Math.abs(face.blink-faceApplied.blink)>1e-4||(Math.abs(face.breath-faceApplied.breath)>1e-4&&now-lastFaceDraw>=100);
          const b=host.getBoundingClientRect(),canLook=!reduced&&!posture&&!gait&&(!effect||effect.kind==='wag');
          const targetYaw=canLook&&gaze?Math.max(-.23,Math.min(.23,(gaze.x-b.left-b.width*.5)/240*.23)):0;
          const targetPitch=canLook&&gaze?Math.max(-.09,Math.min(.12,(gaze.y-b.top-b.height*.3)/180*.12)):0;
          if(!dirty&&!faceNeedsDraw&&!(posture&&(posture.kind==='waking'||now<posture.until))&&!gait&&!gaitStopAt&&Math.abs(angleDelta(bodyYaw,targetBodyYaw))<.0001&&!effect&&!manualCare&&!delivery&&!ballSession&&Math.abs(targetYaw-yaw)<.0001&&Math.abs(targetPitch-pitch)<.0001)return;
          renderFrame(now,dt,targetYaw,targetPitch,face);
        }
        function renderFrame(now,dt,targetYaw,targetPitch,face){
          dirty=false;
          const blend=1-Math.exp(-dt*9);yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;const remaining=angleDelta(bodyYaw,targetBodyYaw);bodyYaw+=Math.sign(remaining)*Math.min(Math.abs(remaining)*(1-Math.exp(-dt*8)),dt*4.2);model.rotation.y=bodyYaw;model.rotation.z=0;model.position.y=0;
          if(pawApplied)setBat(0);
          if(head&&!posture)head.quaternion.copy(headBase);
          const age=effect?(now-effect.start)/1000:10;
          if(effect&&age<effect.duration){
            mixer.update(dt);
            const u=age/effect.duration,amount=Math.sin(u*Math.PI);
            item.style.opacity=reduced?'1':String(amount);
            item.style.transform='none';
          }else {
            if(activeAction){mixer.stopAllAction();activeAction=null;}
            effect=null;item.style.display='none';
          }
          if(gait||gaitStopAt||posture){gaitMixer.update(dt);if(!gait&&!posture&&now>=gaitStopAt){gaitMixer.stopAllAction();gaitStopAt=0;}}
          if(head&&!posture){
            if(!effect)head.quaternion.copy(headRest);
            headBase.copy(head.quaternion);
            head.quaternion.multiply(turn.setFromAxisAngle(yawAxis,yaw)).multiply(nod.setFromAxisAngle(pitchAxis,pitch));
          }
          const careMotion=delivery?CompanionInteraction.sample(now-delivery.start,1500,delivery.kind,reduced):{chew:0,lap:0,nod:0};
          if(head&&!posture&&careMotion.nod)head.quaternion.multiply(nod.setFromAxisAngle(pitchAxis,careMotion.nod));
          if(ballSession&&!gait&&!posture)setBat(CompanionInteraction.sample(now-ballSession.start,ballSession.duration,'ball',reduced).paw);
          for(const mesh of faceMeshes){
            for(const [name,value] of [['Chew',careMotion.chew],['Lap',careMotion.lap]]){const index=mesh.morphTargetDictionary[name];if(index!==undefined)mesh.morphTargetInfluences[index]=value;}
            mesh.morphTargetInfluences[mesh.morphTargetDictionary.Blink]=face.blink;mesh.morphTargetInfluences[mesh.morphTargetDictionary.Breath]=face.breath;}
          faceApplied={blink:face.blink,breath:face.breath};lastFaceDraw=now;
          const target=(manualCare||delivery)?getCareTarget():null;
          const b=host.getBoundingClientRect();
          if(target&&b.width&&b.height){
            const x=(target.x-b.left)/b.width*host.clientWidth,y=(target.y-b.top)/b.height*host.clientHeight;
            if(manualCare){targetRing.style.display='block';targetRing.style.left=x+'px';targetRing.style.top=y+'px';}
            if(delivery){
              const size=Math.min(48,host.clientWidth*.2),water=delivery.kind==='water',ox=water ? .5 : .72,oy=water ? .2 : .3;
              item.style.display='block';item.style.opacity='1';item.style.bottom='auto';
              item.style.width=size+'px';item.style.height=size+'px';item.style.left=(x-size*ox)+'px';item.style.top=(y-size*oy)+'px';
              item.style.transformOrigin=(ox*100)+'% '+(oy*100)+'%';item.style.transform=`rotate(${target.angle}deg)`;
            }
          }
          if(manualCare?.point)updateManualCare(manualCare.point.x,manualCare.point.y);
          if(delivery&&now-delivery.start>=1500)finishDelivery();
          if(alive)view.render(scene,camera);
        }
        raf=requestAnimationFrame(frame);return true;
      }catch(error){
        fail(error);
        return false;
      }
    })();
    return {element:host,ready,react,blink,pickUp,releasePickup,sit:()=>restPose('sit'),sleep:()=>restPose('sleep'),wake,isResting:()=>!!posture,setHeading,setLocomotion,getTurnRemaining:()=>Math.abs(angleDelta(bodyYaw,targetBodyYaw)),beginManualCare,updateManualCare,cancelManualCare,getCareTarget,
      get animationNames(){return Object.freeze([...actions.keys(),...gaitActions.keys(),...postureActions.keys()]);},
      getPose:()=>posture?posture.kind==='sleep'?'sleeping':posture.kind==='sit'?'sitting':posture.kind==='pickup'?'held':posture.kind==='landing'?'landing':'waking':ballSession?'playing':gait?(gait.kind==='run'?'running':'walking'):effect?.kind||'idle',
      setView:name=>{
        if(!camera)return false;
        const views={front:[0,1.8,5],side:[5,1.8,0],left:[5,1.8,0],right:[-5,1.8,0],rear:[-2,1.8,-5],angle:[3,1.8,5]};
        if(!views[name])return false;camera.position.set(...views[name]);camera.lookAt(0,1,0);dirty=true;return true;
      },searchCompleted:()=>react('celebrate'),queryReset:()=>{},
      setName:value=>{companionName=typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim()).slice(0,24).join(''):'';},
      setPersonality:value=>{personality=['calm','playful','sleepy'].includes(value)?value:'calm';idle.setPersonality(personality);restPolicyState.setPersonality(personality);life.setPersonality(personality);if(posture&&['sit','sleep'].includes(posture.kind))restPolicyState.setPose(posture.kind);},
      giveCare:kind=>startDelivery(kind),play:playBall,
      destroy(){if(!alive)return;life.destroy();clearTimeout(wakeTimer);wakeResolve?.(false);wakeResolve=null;restPolicyState.destroy();clearTimeout(slowLoadTimer);view?.domElement.removeEventListener('webglcontextlost',onContextLost);idle.destroy();cancelPlay();cancelManualCare();cancelDelivery();clearQuote();alive=false;cancelAnimationFrame(raf);observer?.disconnect();
        input?.removeEventListener('input',onInput);input?.removeEventListener('focus',onFocus);
        window.removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);window.removeEventListener('blur',onBlur);window.removeEventListener('focus',onReturn);document.removeEventListener('visibilitychange',onVisibility);
        mixer?.stopAllAction();gaitMixer?.stopAllAction();if(assetRoot){mixer?.uncacheRoot(assetRoot);gaitMixer?.uncacheRoot(assetRoot);}actions.clear();gaitActions.clear();postureActions.clear();faceMeshes.length=0;battingBones.length=0;
        disposeModel(model);disposeModel(ball);disposeModel(ballShadow);view?.dispose();view?.forceContextLoss();host.remove();}
    };
  }
  return {mount,careIcons,toyIcon};
})();

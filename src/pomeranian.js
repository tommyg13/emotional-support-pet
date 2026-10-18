/* Offline Pomeranian renderer with conservative head/tail animation clips. */
const Pomeranian = (() => {
  const base = new URL('.', document.currentScript.src);
  const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
  const careIcons = {
    water: svg('<path d="M16 29h32l-5 24H21Z" fill="#9DD9EB" stroke="#528EAA" stroke-width="3"/><ellipse cx="32" cy="29" rx="16" ry="5" fill="#DFF8FC" stroke="#528EAA" stroke-width="3"/>'),
    snack: svg('<path d="M18 23c-12-12-20 8-9 12-5 12 12 18 16 7l15-15c11 4 17-13 5-16-4-11-23-3-12 9Z" fill="#EACDA1" stroke="#B58D62" stroke-width="3"/>')
  };
  const toyIcon = svg('<circle cx="32" cy="32" r="23" fill="#F3978F" stroke="#BD6563" stroke-width="3"/><path d="M12 20q25 1 35 30M21 11q0 25 30 34" fill="none" stroke="#FFF0DC" stroke-width="4"/>');
  function mount(container, {input} = {}) {
    const host = document.createElement('div');
    host.style.cssText = 'position:relative;width:100%;height:100%;';
    const status = document.createElement('span');
    status.textContent = 'Loading puppy…';status.setAttribute('role','status');
    status.style.cssText='position:absolute;inset:40% 4px auto;text-align:center;font:12px system-ui;color:#705145';
    host.appendChild(status);container.appendChild(host);
    const item = document.createElement('div');
    item.style.cssText='position:absolute;left:8%;bottom:12%;width:30px;height:30px;pointer-events:none;display:none;';host.appendChild(item);
    let dirty=true;
    let alive=true,raf=0,view,scene,model,camera,observer,visible=!document.hidden;
    let effect=null,last=0,yaw=0,pitch=0,personality='calm',mixer,assetRoot,activeAction;
    let pointer=null,searchLookUntil=0,nextSearchLook=0,head,headRest,headBase,yawAxis,pitchAxis,turn,nod;
    const actions=new Map();
    const clipNames={curious:'Curious',tilt:'HeadTilt',wag:'TailWag',water:'Happy',snack:'Happy',play:'Happy',celebrate:'Happy',happy:'Happy'};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const disposeModel = object => {
      const textures=new Set(),materials=new Set(),geometries=new Set(),skeletons=new Set();
      object?.traverse(child=>{if(child.skeleton)skeletons.add(child.skeleton);if(child.geometry)geometries.add(child.geometry);for(const m of Array.isArray(child.material)?child.material:child.material?[child.material]:[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
      skeletons.forEach(s=>s.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose();});materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    };
    function react(kind) {
      if(!alive||!model||!clipNames[kind])return false;
      const now=performance.now();
      if(effect?.kind===kind)return false;
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
      item.innerHTML=kind==='play'?toyIcon:careIcons[kind]||svg('<path d="M32 52 10 30C-2 14 20 2 32 18 44 2 66 14 54 30Z" fill="#E99DA9"/>');
      item.style.display=['curious','tilt','wag'].includes(kind)?'none':'block';
      dirty=true;return true;
    }
    function peekAtSearch(){
      if(!alive||!input)return;
      const now=performance.now();
      if(now<searchLookUntil){searchLookUntil=Math.min(nextSearchLook-2500,now+1800);return;}
      if(now<nextSearchLook||effect)return;
      searchLookUntil=now+2200;nextSearchLook=now+7000;dirty=true;
    }
    const onInput=()=>{if(input.value.trim())peekAtSearch();};
    const onFocus=peekAtSearch;
    const onMove=e=>{pointer={x:e.clientX,y:e.clientY};};
    const onLeave=()=>{pointer=null;};
    const onBlur=()=>{pointer=null;searchLookUntil=0;};
    const onVisibility=()=>{visible=!document.hidden;dirty=true;};
    input?.addEventListener('input',onInput);input?.addEventListener('focus',onFocus);
    window.addEventListener('pointermove',onMove);document.addEventListener('pointerleave',onLeave);window.addEventListener('blur',onBlur);
    document.addEventListener('visibilitychange',onVisibility);
    const ready=(async()=>{
      try{
        const [T,{GLTFLoader}]=await Promise.all([import(new URL('vendor/three/three.module.js',base)),import(new URL('vendor/three/GLTFLoader.js',base))]);
        if(!alive)return false;
        view=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
        view.setPixelRatio(Math.min(devicePixelRatio||1,2));view.setClearColor(0,0);
        view.outputColorSpace=T.SRGBColorSpace;view.toneMapping=T.ACESFilmicToneMapping;view.toneMappingExposure=1.25;
        view.domElement.style.cssText='display:block;width:100%;height:100%;';
        view.domElement.setAttribute('role','img');view.domElement.setAttribute('aria-label','3D Pomeranian puppy');host.appendChild(view.domElement);
        scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x9d7860,2.7));
        const key=new T.DirectionalLight(0xfff2df,3);key.position.set(3,5,4);scene.add(key);
        const fill=new T.DirectionalLight(0xffffff,1.5);fill.position.set(-3,2,-2);scene.add(fill);
        camera=new T.OrthographicCamera(-1,1,1.2,-1.2,.01,100);
        camera.position.set(3,1.8,5);camera.lookAt(0,1,0);
        const gltf=await new GLTFLoader().loadAsync(new URL('assets/pomeranian/pomeranian.glb',base).href);
        if(!alive){disposeModel(gltf.scene);return false;}
        model=new T.Group();const asset=gltf.scene;assetRoot=asset;
        mixer=new T.AnimationMixer(asset);
        for(const clip of gltf.animations){const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;actions.set(clip.name,action);}
        const box=new T.Box3().setFromObject(asset),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
        const scale=1.9/Math.max(size.x,size.y,size.z);
        asset.position.set(-center.x,-box.min.y,-center.z);const normalized=new T.Group();normalized.add(asset);normalized.scale.setScalar(scale);model.add(normalized);scene.add(model);
        asset.traverse(child=>{if(child.isMesh){child.frustumCulled=false;for(const m of Array.isArray(child.material)?child.material:[child.material]){m.roughness=.85;m.metalness=0;}}});
        scene.updateMatrixWorld(true);head=asset.getObjectByName('Head');
        if(head){
          headRest=head.quaternion.clone();headBase=headRest.clone();const inverse=head.getWorldQuaternion(new T.Quaternion()).invert();
          yawAxis=new T.Vector3(0,1,0).applyQuaternion(inverse).normalize();
          pitchAxis=new T.Vector3(1,0,0).applyQuaternion(inverse).normalize();
          turn=new T.Quaternion();nod=new T.Quaternion();
        }
        const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;view.setSize(w,h,false);const a=w/h;camera.left=-1.25*a;camera.right=1.25*a;camera.top=1.25;camera.bottom=-1.25;camera.updateProjectionMatrix();dirty=true;};
        observer=new ResizeObserver(resize);observer.observe(host);resize();status.remove();host.dataset.state='ready';
        function frame(now){
          if(!alive)return;raf=requestAnimationFrame(frame);
          if(!visible||now-last<1000/30)return;const dt=Math.min(.1,(now-last)/1000);last=now;
          let gaze=pointer;
          if(input&&now<searchLookUntil){const r=input.getBoundingClientRect();gaze={x:r.left+r.width/2,y:r.top+r.height/2};}
          const b=host.getBoundingClientRect(),canLook=!reduced&&(!effect||effect.kind==='wag');
          const targetYaw=canLook&&gaze?Math.max(-.23,Math.min(.23,(gaze.x-b.left-b.width*.5)/240*.23)):0;
          const targetPitch=canLook&&gaze?Math.max(-.09,Math.min(.12,(gaze.y-b.top-b.height*.3)/180*.12)):0;
          if(!dirty&&!effect&&Math.abs(targetYaw-yaw)<.0001&&Math.abs(targetPitch-pitch)<.0001)return;
          renderFrame(now,dt,targetYaw,targetPitch);
        }
        function renderFrame(now,dt,targetYaw,targetPitch){
          dirty=false;
          const blend=1-Math.exp(-dt*9);yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;model.rotation.y=0;model.rotation.z=0;model.position.y=0;
          if(head)head.quaternion.copy(headBase);
          const age=effect?(now-effect.start)/1000:10;
          if(effect&&age<effect.duration){
            mixer.update(dt);
            const u=age/effect.duration,amount=Math.sin(u*Math.PI);
            item.style.opacity=reduced?'1':String(amount);
            item.style.transform=!reduced&&effect.kind==='play'?`translateX(${Math.sin(u*Math.PI)*85}px) rotate(${u*360}deg)`:'none';
          }else {
            if(activeAction){mixer.stopAllAction();activeAction=null;}
            effect=null;item.style.display='none';
          }
          if(head){
            if(!effect)head.quaternion.copy(headRest);
            headBase.copy(head.quaternion);
            head.quaternion.multiply(turn.setFromAxisAngle(yawAxis,yaw)).multiply(nod.setFromAxisAngle(pitchAxis,pitch));
          }
          view.render(scene,camera);
        }
        raf=requestAnimationFrame(frame);return true;
      }catch(error){
        if(alive){status.textContent='Puppy could not load. Try the cat or reopen the app.';host.dataset.state='error';host.dispatchEvent(new CustomEvent('character-error',{bubbles:true,detail:{message:String(error.message)}}));}
        return false;
      }
    })();
    return {element:host,ready,react,
      get animationNames(){return Object.freeze([...actions.keys()]);},
      getPose:()=>effect?.kind||'idle',
      setView:name=>{
        if(!camera)return false;
        const views={front:[0,1.8,5],side:[5,1.8,0],rear:[-2,1.8,-5],angle:[3,1.8,5]};
        if(!views[name])return false;camera.position.set(...views[name]);camera.lookAt(0,1,0);dirty=true;return true;
      },searchCompleted:()=>react('celebrate'),queryReset:()=>{},
      setPersonality:value=>{personality=['calm','playful','sleepy'].includes(value)?value:'calm';},
      giveCare:kind=>['water','snack'].includes(kind)&&react(kind),play:()=>react('play'),
      destroy(){if(!alive)return;alive=false;cancelAnimationFrame(raf);observer?.disconnect();
        input?.removeEventListener('input',onInput);input?.removeEventListener('focus',onFocus);
        window.removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',onLeave);window.removeEventListener('blur',onBlur);document.removeEventListener('visibilitychange',onVisibility);
        mixer?.stopAllAction();if(assetRoot)mixer?.uncacheRoot(assetRoot);actions.clear();
        disposeModel(model);view?.dispose();view?.forceContextLoss();host.remove();}
    };
  }
  return {mount,careIcons,toyIcon};
})();

/* Bounded desktop movement with articulated four-leg gait and smooth 3D heading. */
const RoamingDog = (() => {
  function mount(container, options={}) {
    const reduced=options.reducedMotion??matchMedia('(prefers-reduced-motion: reduce)').matches;
    const swing=CompanionSwing.create({reduced});
    const size=180,host=document.createElement('div'),body=document.createElement('div');
    host.style.cssText=`position:fixed;left:0;top:0;width:${size}px;height:${size}px;touch-action:none;cursor:grab;transform-origin:50% 22%;`;
    host.setAttribute('aria-label','Roaming Pomeranian. Click to return home, or drag to move.');
    body.style.cssText='width:100%;height:100%;';host.appendChild(body);container.appendChild(host);
    let renderer=Pomeranian.mount(body),alive=true,loaded=false,moving=null,held=null,speed=1,heading={x:1,y:0},angle=0,jumpStart=null,raf=0,last=performance.now();
    let actionEpoch=0;
    let x=Number.isFinite(options.x)?options.x:innerWidth/2,y=Number.isFinite(options.y)?options.y:innerHeight*.7;
    const drag=typeof DragReactions==='undefined'?null:DragReactions.create({now:()=>performance.now(),onReaction:phase=>options.onDragReaction?.(phase)});
    const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
    function bounds(px,py){return {x:clamp(px,size/2,innerWidth-size/2),y:clamp(py,size*.9,innerHeight-8)};}
    function position(px,py){const p=bounds(px,py);x=p.x;y=p.y;}
    function paint(now){
      const jump=!reduced&&jumpStart!==null?Math.sin(Math.min(1,(now-jumpStart)/650)*Math.PI)*42:0;
      if(jumpStart!==null&&now-jumpStart>=650)jumpStart=null;
      host.style.transform=`translate(${x-size/2}px,${y-size*.9-jump}px) rotate(${angle}deg)`;
    }
    function stop(){actionEpoch++;if(moving){const finish=moving.resolve;moving=null;renderer.setLocomotion('idle');finish(false);paint(performance.now());}return true;}
    function face(dx,dy){heading={x:dx,y:dy};renderer.setHeading(dx,dy);}
    function walkTo(px,py,{run=false}={}){
      if(!alive||!loaded||held||!Number.isFinite(px)||!Number.isFinite(py))return Promise.resolve(false);
      stop();const target=bounds(px,py);face(target.x-x,target.y-y);
      if(reduced||Math.hypot(target.x-x,target.y-y)<2){renderer.wake();position(target.x,target.y);paint(performance.now());return Promise.resolve(true);}
      return new Promise(resolve=>{moving={...target,run,resolve,velocity:0,waiting:renderer.isResting()};const session=moving;renderer.wake().then(ok=>{if(moving===session){if(!ok)stop();else session.waiting=false;}});});
    }
    function drop(cancelled=false){
      if(!held)return false;const state=held;held=null;
      if(host.hasPointerCapture(state.id))host.releasePointerCapture(state.id);
      renderer.releasePickup(cancelled||!state.moved);
      if(cancelled||reduced){swing.reset();angle=0;}host.style.cursor='grab';options.onHeld?.(false);drag?.end(cancelled);paint(performance.now());return true;
    }
    function down(event){
      if(event.button!==0||event.target.closest('button')||!alive||!loaded)return;
      event.preventDefault();stop();renderer.wake();jumpStart=null;
      held={id:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX:x-event.clientX,offsetY:y-event.clientY,moved:false,lastX:event.clientX,lastTime:performance.now()};
      host.setPointerCapture(event.pointerId);host.style.cursor='grabbing';options.onHeld?.(true);drag?.begin(event.clientX,event.clientY);
    }
    function move(event){
      if(!held||held.id!==event.pointerId)return;
      const now=performance.now(),dt=Math.max(1,now-held.lastTime);
      if(!held.moved&&Math.hypot(event.clientX-held.startX,event.clientY-held.startY)>5){
        held.moved=true;const length=Math.hypot(heading.x,heading.y)||1;host.style.transformOrigin=`${50+12*heading.x/length}% 30%`;renderer.pickUp();
      }
      if(held.moved)swing.aim((event.clientX-held.lastX)/dt*1000);
      held.lastX=event.clientX;held.lastTime=now;
      position(event.clientX+held.offsetX,event.clientY+held.offsetY);drag?.move(event.clientX,event.clientY);paint(now);
    }
    function up(event){if(!held||event.pointerId!==held.id)return;const clicked=!held.moved;drop();if(clicked)options.onClick?.();}
    function cancel(event){actionEpoch++;if(held&&(!event.pointerId||event.pointerId===held.id))drop(true);}
    function resize(){position(x,y);if(moving)Object.assign(moving,bounds(moving.x,moving.y));paint(performance.now());}
    host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',cancel);host.addEventListener('lostpointercapture',cancel);
    window.addEventListener('blur',cancel);window.addEventListener('resize',resize);
    let personality='calm',name='';
    async function load(){const current=renderer;const ok=await current.ready;if(!alive||current!==renderer)return false;loaded=ok;if(ok){renderer.setHeading(heading.x,heading.y);renderer.setPersonality(personality);renderer.setName(name);}return ok;}
    let ready=load();
    function retry(event){event.stopPropagation();if(!alive)return;stop();drop(true);loaded=false;renderer.destroy();renderer=Pomeranian.mount(body);ready=load();}
    host.addEventListener('character-retry',retry);
    function frame(now){
      if(!alive)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
      if(document.hidden){stop();drop(true);return;}
      if(renderer.element.dataset.state==='error'){loaded=false;stop();drop(true);}
      const wasMoving=!!moving;
      if(moving&&!moving.waiting){
        const dx=moving.x-x,dy=moving.y-y,d=Math.hypot(dx,dy),acceleration=300;
        const turnFactor=Math.max(0,Math.cos(renderer.getTurnRemaining()))**2;
        const desired=Math.min((moving.run?108:48)*speed*turnFactor,Math.sqrt(2*acceleration*d));
        moving.velocity+=Math.max(-acceleration*dt,Math.min(acceleration*dt,desired-moving.velocity));
        const velocity=turnFactor<.08?0:Math.max(1,moving.velocity),step=velocity*dt;
        renderer.setLocomotion(velocity>0?(moving.run?'run':'walk'):'walk',velocity||14);
        if(d<=step){x=moving.x;y=moving.y;const finish=moving.resolve;moving=null;renderer.setLocomotion('idle');finish(true);}
        else{x+=dx/d*step;y+=dy/d*step;}
      }
      const wasSwinging=swing.active();angle=swing.step(dt,!!held);
      if(wasMoving||wasSwinging||jumpStart!==null)paint(now);
    }
    position(x,y);paint(last);raf=requestAnimationFrame(frame);
    return {
      element:host,get ready(){return ready;},walkTo,stop,drop,
      getPosition:()=>({x,y}),setPosition:(px,py)=>{if(!Number.isFinite(px)||!Number.isFinite(py))return false;stop();position(px,py);paint(performance.now());return true;},
      getBounds:()=>host.getBoundingClientRect(),isHeld:()=>!!held,
      getPose:()=>renderer.element.dataset.state==='error'?'error':held?'held':moving?(moving.waiting?'waking':moving.run?'running':'walking'):jumpStart!==null?'jumping':renderer.getPose(),
      setSpeed:value=>{if(!Number.isFinite(value)||value<=0)return false;speed=clamp(value,.5,2.5);return true;},
      sit:()=>{stop();return renderer.sit();},sleep:()=>{stop();return renderer.sleep();},wake:()=>renderer.wake(),
      jump:()=>{if(!alive||!loaded||held)return false;const epoch=++actionEpoch;renderer.wake().then(ok=>{if(ok&&alive&&!held&&epoch===actionEpoch){if(!reduced)jumpStart=performance.now();renderer.react('wag');}});return true;},
      watchAt:point=>{if(point)renderer.react('curious');return true;},
      setPersonality:value=>{personality=value;renderer.setPersonality(value);},setName:value=>{name=value;renderer.setName(value);},
      destroy(){if(!alive)return;stop();drop(true);alive=false;cancelAnimationFrame(raf);host.removeEventListener('character-retry',retry);window.removeEventListener('blur',cancel);window.removeEventListener('resize',resize);renderer.destroy();host.remove();}
    };
  }
  return {mount};
})();

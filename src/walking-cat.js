/* walking-cat.js — the orange wizard cat, now in 2.5D: walks, turns, runs, sits, sleeps.
   Usage:  const cat = WalkingCat.mount(document.body, {x: 300, y: 500});
           await cat.walkTo(800, 400);   // resolves true on arrival, false if interrupted
   Other:  cat.sit() cat.jump() cat.stop() cat.setPosition(x,y) cat.getPosition() cat.destroy()
   The cat shrinks as it walks "up" the screen, which gives the depth. Facing is mirrored
   with an animated turn. No dependencies. */
const WalkingCat = (() => {
  const GY = 223, FX = 140, FY = 242;            // ground line, foot anchor (svg coords)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
  const legArt = (id, far) => `<g id="wc-${id}"><path d="M-10 0C-12 20-10 38-9 50Q1 62 12 50C11 38 12 20 10 0Z" fill="${far ? '#CF7D37' : 'url(#wc-fur)'}" stroke="#C97A2E" stroke-opacity=".3" stroke-width="1.3"/><ellipse cx="1" cy="51" rx="12" ry="7.5" fill="${far ? '#E3A25E' : 'url(#wc-paw)'}"/></g>`;

  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 320 260" width="320" height="260" style="overflow:visible;display:block">
<defs>
 <linearGradient id="wc-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6B56B"/><stop offset="1" stop-color="#DE8A3E"/></linearGradient>
 <linearGradient id="wc-paw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9CE97"/><stop offset="1" stop-color="#F2A85C"/></linearGradient>
 <radialGradient id="wc-vol" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#FFD6A2"/><stop offset=".5" stop-color="#F3AA5C"/><stop offset="1" stop-color="#C36B30"/></radialGradient>
 <radialGradient id="wc-face" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#FBD9A8"/><stop offset=".7" stop-color="#F6B56B"/><stop offset="1" stop-color="#EE9E50"/></radialGradient>
 <linearGradient id="wc-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34497D"/><stop offset="1" stop-color="#1B2748"/></linearGradient>
</defs>
<g id="wc-flip">
 <ellipse id="wc-shadow" cx="140" cy="${GY + 1}" rx="82" ry="9" fill="#513B44" opacity=".22"/>
 <g id="wc-pose"><g id="wc-upper">
  <g id="wc-tail"><path d="M0 0Q-40-4-48-42Q-52-68-34-80" fill="none" stroke="#EE9E50" stroke-width="17" stroke-linecap="round"/><circle cx="-34" cy="-80" r="8.5" fill="#FDE7C9"/></g>
  ${legArt('bf', 1)}${legArt('ff', 1)}
  <g id="wc-body">
   <ellipse cx="135" cy="150" rx="90" ry="53" fill="url(#wc-vol)"/>
   <ellipse cx="86" cy="158" rx="42" ry="42" fill="#F3AA5C" opacity=".55"/>
   <ellipse cx="190" cy="166" rx="30" ry="32" fill="#FDE7C9" opacity=".7"/>
   <ellipse cx="140" cy="192" rx="72" ry="13" fill="#FDE7C9" opacity=".45"/>
  </g>
  ${legArt('bn', 0)}${legArt('fn', 0)}
  <g id="wc-head"><g transform="translate(150 132)"><g id="wc-headart" transform="translate(-150 -132)">
   <path d="M72 108L84 36L132 80Z" fill="#F0A255"/><path d="M228 108L216 36L168 80Z" fill="#F0A255"/>
   <path d="M86 92L91 58L116 80Z" fill="#EBA0A0" opacity=".8"/><path d="M214 92L209 58L184 80Z" fill="#EBA0A0" opacity=".8"/>
   <ellipse cx="150" cy="132" rx="92" ry="72" fill="url(#wc-face)"/>
   <g transform="translate(16 0)">
    <ellipse cx="150" cy="160" rx="42" ry="28" fill="#FDEBD2" opacity=".85"/>
    <g id="wc-eyes"><ellipse cx="122" cy="128" rx="9" ry="12" fill="#1B1522"/><ellipse cx="125" cy="123" rx="3.2" ry="4" fill="#fff" opacity=".9"/>
     <ellipse cx="190" cy="128" rx="10.5" ry="12.5" fill="#1B1522"/><ellipse cx="193" cy="123" rx="3.8" ry="4.2" fill="#fff" opacity=".9"/></g>
    <path d="M142 147Q150 143 158 147Q156 156 150 158Q144 156 142 147Z" fill="#E98F8C"/>
    <path d="M150 158v5M150 163q-7 7-15 2M150 163q7 7 15 2" fill="none" stroke="#B8665E" stroke-width="1.8" stroke-linecap="round"/>
    <g id="wc-blush" fill="#E98F8C" opacity="0"><ellipse cx="108" cy="153" rx="12" ry="6.5"/><ellipse cx="204" cy="153" rx="13" ry="7"/></g>
    <g stroke="#FFF6EA" stroke-opacity=".9" stroke-width="1.4" stroke-linecap="round" fill="none"><path d="M188 160Q220 150 250 152M188 166Q220 168 246 178M186 172Q210 184 230 202M112 162Q92 156 76 158M112 168Q92 172 80 180"/></g>
   </g>
   <g transform="translate(10 -26) rotate(-3 150 94)">
    <path d="M62 92C86 66 105 29 135 8C153-5 181 0 201 19Q211 30 207 42Q190 26 174 31C185 52 211 77 238 92Z" fill="url(#wc-hat)"/>
    <path d="M92 70C108 44 128 28 146 20" fill="none" stroke="#4A63A0" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
    <path d="M78 78Q151 94 222 79L238 92Q150 116 62 92Z" fill="#7561A8"/>
    <path d="M142 90l9-7 10 7-3 12h-13Z" fill="#EBC878" stroke="#AA7839" stroke-width="2"/>
    <path d="M119 38a10 10 0 1 0 13 12a12 12 0 0 1-13-12" fill="#F6DB96"/>
   </g>
  </g></g></g>
 </g></g>
</g></svg>`;

  function mount(container, opts = {}) {
    const o = Object.assign({ x: 300, y: 500, speed: 150, scale: 1, minDepth: 0.55, margin: 24 }, opts);
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:0;top:0;width:320px;height:260px;transform-origin:${FX}px ${FY}px;pointer-events:none;will-change:transform;user-select:none`;
    host.innerHTML = SVG; container.appendChild(host);
    const svg = host.firstElementChild; svg.style.pointerEvents = 'auto'; svg.style.cursor = 'pointer';
    const $ = (id) => host.querySelector('#wc-' + id);
    const E = Object.fromEntries(['flip','shadow','pose','upper','tail','bf','ff','bn','fn','body','head','headart','eyes','blush'].map(k => [k, $(k)]));

    const S = { x: o.x, y: o.y, f: 1, dir: 1, phase: 0, walk: 0, run: 0, sit: 0, sleep: 0, idle: 0,
                jump: -1, t: 0, blinkAt: 2, blinkT: -1, ex: 0, ey: 0, target: null, resolve: null };
    let pointer = null, raf = 0, last = performance.now();

    const bounds = () => o.desktop ? {minY:Math.min(160,innerHeight*.4),maxY:innerHeight-16,minX:100,maxX:Math.max(100,innerWidth-100)} : ({ minY: innerHeight * 0.28, maxY: innerHeight - o.margin, minX: o.margin, maxX: innerWidth - o.margin });
    const depth = (y) => { const b = bounds(); return o.scale * lerp(o.minDepth, 1, (y - b.minY) / (b.maxY - b.minY)); };
    const finish = (ok) => { const r = S.resolve; S.resolve = null; S.target = null; if (r) r(ok); };

    function walkTo(x, y, mode = {}) {
      finish(false); const b = mode.home ? {minX:20,maxX:innerWidth-20,minY:80,maxY:innerHeight-12} : bounds(); S.idle = 0;
      S.target = { x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY), run:mode.run===true };
      return new Promise(r => { S.resolve = r; });
    }
    const stop = () => finish(false);
    const sit = () => { finish(false); S.idle = 7; };
    const jump = () => { if (S.jump < 0) S.jump = 0; S.idle = 0; };
    const setPosition = (x, y) => { finish(false); const b=bounds();S.x=clamp(x,b.minX,b.maxX);S.y=clamp(y,b.minY,b.maxY); };
    let grab=null,held=false,angle=0,angularVelocity=0,lastDragX=0,landing=-1,hang=0;
    function release(e,cancelled=false) {
      if(!grab||e&&e.pointerId!==grab.id)return;
      const wasHeld=held,id=grab.id;grab=null;held=false;o.onHeld?.(false);
      if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);
      if(wasHeld){const b=bounds();S.x=clamp(S.x,b.minX,b.maxX);S.y=clamp(S.y,b.minY,b.maxY);landing=0;S.idle=0;}
      else if(!cancelled){if(o.onClick)o.onClick();else{jump();host.dispatchEvent(new CustomEvent('cat-click',{bubbles:true}));}}
    }
    svg.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.stopPropagation();e.preventDefault();finish(false);
      grab={id:e.pointerId,x:e.clientX,y:e.clientY};lastDragX=e.clientX;
      svg.setPointerCapture(e.pointerId);o.onHeld?.(true);
    });
    const dragMove=e=>{
      if(!grab||grab.id!==e.pointerId)return;
      if(!held&&Math.hypot(e.clientX-grab.x,e.clientY-grab.y)>6){held=true;S.f=S.dir;S.jump=-1;S.idle=0;S.sit=0;S.sleep=0;}
      if(!held)return;
      const sc=depth(S.y);angularVelocity+=clamp((e.clientX-lastDragX)*1.4,-120,120);lastDragX=e.clientX;
      S.x=e.clientX-(210-FX)*S.f*sc;S.y=e.clientY-(130-FY)*sc;
    };
    addEventListener('pointermove',dragMove);
    svg.addEventListener('pointerup',e=>release(e));
    svg.addEventListener('pointercancel',e=>release(e,true));
    svg.addEventListener('lostpointercapture',e=>release(e,true));
    const blur=()=>release(null,true);addEventListener('blur',blur);
    const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY }; };
    addEventListener('pointermove', onMove);

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt;
      const s = depth(S.y); let moving = false, sp = 0;

      if (S.target && !grab && S.jump < 0) {
        S.idle = 0;
        const dx = S.target.x - S.x, dy = S.target.y - S.y, d = Math.hypot(dx, dy);
        if (d < 4) finish(true);
        else {
          if (Math.abs(dx) > 8) S.dir = Math.sign(dx);
          const wantRun = S.target.run || d > 450;
          S.run = lerp(S.run, wantRun ? 1 : 0, dt * 4);
          sp = o.speed * (1 + 0.9 * S.run) * s;
          if (S.sit < 0.15 && Math.abs(S.f - S.dir) < 0.5) {
            const step = Math.min(d, sp * dt); S.x += dx / d * step; S.y += dy / d * step; moving = true;
          }
        }
      } else if (!grab && S.jump < 0) { S.idle += dt; S.run = lerp(S.run, 0, dt * 4); }

      S.f += clamp(S.dir - S.f, -dt * 7, dt * 7);
      S.walk = lerp(S.walk, moving ? 1 : 0, dt * 8);
      if (moving) S.phase += dt * (sp / s) / 21;
      S.sit = lerp(S.sit, S.idle > 6 && !S.target && !held ? 1 : 0, dt * 3);
      S.sleep = lerp(S.sleep, S.idle > 15 && !held ? 1 : 0, dt * 1.5);

      let jy = 0, tuck = 0, glow = 0;
      if (S.jump >= 0) { S.jump += dt / 0.65; const u = S.jump; tuck = Math.sin(Math.PI * clamp(u, 0, 1)); jy = -tuck * 60; glow = tuck; if (u >= 1) S.jump = -1; }

      // legs: diagonal gait, bigger swing when running, tucked when jumping, folded when sitting
      const w = S.walk, p = S.phase, swing = 30 * (1 + 0.45 * S.run) * w, sit = S.sit, sc = sit * 20;
      const bob = -Math.abs(Math.sin(p)) * 3 * w + Math.sin(S.t * 2) * 1.2 * (1 - w) - sit * 3;
      const legT = (el, px, ph, back) => {
        const q = Math.sin(p + ph), lift = -Math.max(0, Math.cos(p + ph)) * 7 * w;
        let a = held ? (back ? 7 : -6) : q * swing + (back ? -50 * sit + 25 * tuck : sc - 28 * tuck);
        el.setAttribute('transform', `translate(${px} ${164 + bob + lift}) rotate(${a}) scale(1 ${back ? 1 - 0.25 * sit : 1})`);
      };
      legT(E.bf, 78, 0, 1); legT(E.ff, 178, Math.PI, 0); legT(E.bn, 98, Math.PI, 1); legT(E.fn, 198, 0, 0);
      E.body.setAttribute('transform', `translate(0 ${bob})`);
      E.tail.setAttribute('transform', `translate(54 ${140 + bob}) rotate(${Math.sin(S.t * 2.2) * 9 + w * (Math.sin(p * 0.5) * 8 - 12) - sit * 14 + tuck * 20})`);
      E.upper.setAttribute('transform', `rotate(${-sit * 20} 200 ${GY})`);

      // head: bobs with the stride, looks toward the pointer, naps when idle for long
      const hx = S.x + S.dir * 90 * s, hy = S.y - 125 * s;
      const tx = pointer ? clamp((pointer.x - hx) * S.dir / 260, -1, 1) * 5 : 0, ty = pointer ? clamp((pointer.y - hy) / 260, -1, 1) * 4 : 0;
      S.ex = lerp(S.ex, moving ? 3 : tx, dt * 8); S.ey = lerp(S.ey, moving ? 0 : ty, dt * 8);
      if (S.blinkT < 0 && S.t > S.blinkAt) S.blinkT = 0;
      let bl = 1; if (S.blinkT >= 0) { S.blinkT += dt / 0.15; bl = 1 - Math.sin(Math.PI * Math.min(1, S.blinkT)); if (S.blinkT >= 1) { S.blinkT = -1; S.blinkAt = S.t + 2 + Math.random() * 3; } }
      const eyeS = Math.max(0.08, bl * (1 - S.sleep));
      E.eyes.setAttribute('transform', `translate(${S.ex} ${S.ey + 128 * (1 - eyeS)}) scale(1 ${eyeS})`);
      E.blush.setAttribute('opacity', Math.max(glow, S.sleep * 0.6));
      const hr = Math.sin(p + 1) * 2.5 * w + S.sleep * 10 - sit * 4 + tuck * -6;
      E.head.setAttribute('transform', `translate(232 ${102 + bob * 1.4 + S.sleep * 6}) rotate(${hr}) scale(.62) translate(-150 -132)`);

      angularVelocity += (-angle*18-angularVelocity*5)*dt;angle+=angularVelocity*dt;angle=clamp(angle,-24,24);
      if(landing>=0){landing+=dt;if(landing>.5)landing=-1;}
      const settle=landing>=0&&!o.reducedMotion?Math.sin(landing/.5*Math.PI)*4:0;
      hang=lerp(hang,held?1:0,dt*10);
      const sway=-60*hang+(o.reducedMotion?0:angle);
      E.pose.setAttribute('transform', `rotate(${sway} 210 110) translate(0 ${jy+settle}) translate(140 ${GY}) scale(${1 + 0.06 * tuck} ${1 - 0.04 * tuck}) translate(-140 ${-GY})`);
      E.shadow.setAttribute('transform', `translate(140 ${GY}) scale(${1 - 0.3 * tuck} 1) translate(-140 ${-GY})`);
      E.shadow.setAttribute('opacity', held ? 0 : 0.22 - 0.1 * tuck);
      E.flip.setAttribute('transform', `translate(${FX} 0) scale(${S.f} 1) translate(${-FX} 0)`);
      host.style.transform = `translate(${S.x - FX}px,${S.y - FY}px) scale(${s})`;
      host.style.zIndex = Math.round(S.y);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return { walkTo, stop, sit, jump, setSpeed:multiplier=>{o.speed=150*clamp(multiplier,.5,2.5);}, setPosition, isHeld:()=>!!grab, drop:()=>release(null,true), getPose:()=>held?'held':S.sleep>.5?'sleeping':S.sit>.5?'sitting':S.target?'walking':'idle', getPosition: () => ({ x: S.x, y: S.y }), element: host,
             destroy() { grab=null;held=false;o.onHeld?.(false);cancelAnimationFrame(raf);removeEventListener('pointermove',dragMove);removeEventListener('blur',blur); removeEventListener('pointermove', onMove); finish(false); host.remove(); } };
  }
  return { mount };
})();

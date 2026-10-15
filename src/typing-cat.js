/* typing-cat.js — orange wizard cat that types when you type.
   Usage: TypingCat.mount(containerEl, inputEl)  (no dependencies, transparent background) */
const TypingCat = (() => {
  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -34 300 364" width="100%" height="100%">
<defs>
  <linearGradient id="tc-fur" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F6B56B"/><stop offset=".55" stop-color="#EE9E50"/><stop offset="1" stop-color="#DE8A3E"/>
  </linearGradient>
  <radialGradient id="tc-face" cx=".5" cy=".55" r=".6">
    <stop offset="0" stop-color="#FBD9A8"/><stop offset=".7" stop-color="#F6B56B"/><stop offset="1" stop-color="#EE9E50"/>
  </radialGradient>
  <linearGradient id="tc-paw" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F2A85C"/><stop offset="1" stop-color="#F9CE97"/>
  </linearGradient>
  <linearGradient id="tc-hat" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#34497D"/><stop offset="1" stop-color="#1B2748"/>
  </linearGradient>
  <linearGradient id="tc-brim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2B3C69"/><stop offset="1" stop-color="#141C36"/>
  </linearGradient>
  <radialGradient id="tc-chest" cx=".5" cy=".4" r=".6">
    <stop offset="0" stop-color="#FDE7C9"/><stop offset="1" stop-color="#FDE7C9" stop-opacity="0"/>
  </radialGradient>
</defs>

<g id="tc-root">
  <!-- body -->
  <g id="tc-body">
    <path d="M34 330 C22 255 52 192 108 176 L192 176 C248 192 278 255 266 330 Z" fill="url(#tc-fur)"/>
    <ellipse cx="150" cy="226" rx="52" ry="48" fill="url(#tc-chest)"/>
    <g fill="none" stroke="#D27A2E" stroke-opacity=".45" stroke-width="3" stroke-linecap="round">
      <path d="M58 250 q10 6 14 18"/><path d="M52 282 q10 4 14 14"/>
      <path d="M242 250 q-10 6 -14 18"/><path d="M248 282 q-10 4 -14 14"/>
    </g>
  </g>

  <!-- head -->
  <g id="tc-head">
    <ellipse cx="150" cy="132" rx="92" ry="72" fill="url(#tc-face)"/>
    <ellipse cx="150" cy="160" rx="42" ry="28" fill="#FDEBD2" opacity=".85"/>
    <ellipse cx="102" cy="158" rx="22" ry="16" fill="#FDEBD2" opacity=".55"/>
    <ellipse cx="198" cy="158" rx="22" ry="16" fill="#FDEBD2" opacity=".55"/>
    <!-- eyes -->
    <g id="tc-eyeL"><ellipse cx="116" cy="128" rx="10" ry="12" fill="#1B1522"/><ellipse cx="119" cy="123" rx="3.6" ry="4" fill="#fff" opacity=".9"/><ellipse cx="113" cy="133" rx="1.6" ry="1.8" fill="#fff" opacity=".5"/></g>
    <g id="tc-eyeR"><ellipse cx="184" cy="128" rx="10" ry="12" fill="#1B1522"/><ellipse cx="187" cy="123" rx="3.6" ry="4" fill="#fff" opacity=".9"/><ellipse cx="181" cy="133" rx="1.6" ry="1.8" fill="#fff" opacity=".5"/></g>
    <g id="tc-sleep-eyes" opacity="0" fill="none" stroke="#75462E" stroke-width="4" stroke-linecap="round"><path d="M103 128 Q116 137 129 128"/><path d="M171 128 Q184 137 197 128"/></g>
    <!-- nose + mouth -->
    <path d="M142 147 Q150 143 158 147 Q156 156 150 158 Q144 156 142 147Z" fill="#E98F8C"/>
    <path id="tc-mouth" d="M150 158 v5 M150 163 q-7 7 -15 2 M150 163 q7 7 15 2" fill="none" stroke="#B8665E" stroke-width="1.8" stroke-linecap="round"/>
    <g id="tc-tongue" opacity="0">
      <path d="M143 166 Q150 163 157 166 L157 175 C157 185 143 185 143 175Z" fill="#ED8799" stroke="#C96C7F" stroke-width="1.2"/>
      <path d="M150 169 v7" fill="none" stroke="#C96C7F" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <g id="tc-blush" fill="#E98F8C" opacity="0">
      <ellipse cx="106" cy="153" rx="13" ry="7"/>
      <ellipse cx="194" cy="153" rx="13" ry="7"/>
    </g>
    <!-- whiskers -->
    <g stroke="#FFF6EA" stroke-opacity=".9" stroke-width="1.4" stroke-linecap="round" fill="none">
      <path d="M112 160 Q80 150 52 152"/><path d="M112 166 Q80 168 56 178"/><path d="M114 172 Q90 184 70 202"/>
      <path d="M188 160 Q220 150 248 152"/><path d="M188 166 Q220 168 244 178"/><path d="M186 172 Q210 184 230 202"/>
    </g>

  <!-- hat: attached to the head so both share one pivot -->
  <g id="tc-hat"><g transform="translate(0 -26) rotate(-3 150 94)">
    <path d="M62 92 C86 66 105 29 135 8 C153 -5 181 0 201 19 Q211 30 207 42 Q190 26 174 31 C185 52 211 77 238 92 Z" fill="url(#tc-hat)"/>
    <path d="M92 70 C108 44 128 28 146 20" fill="none" stroke="#4A63A0" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
    <path d="M78 78 Q151 94 222 79 L238 92 Q150 116 62 92Z" fill="#7561A8"/>
    <path d="M142 90 l9 -7 10 7 -3 12 -13 0Z" fill="#EBC878" stroke="#AA7839" stroke-width="2"/>
    <path d="M119 38 a10 10 0 1 0 13 12 a12 12 0 0 1 -13 -12" fill="#F6DB96"/>
    <g fill="#D6E4FF" opacity=".8">
      <circle cx="130" cy="44" r="1.8"/><circle cx="108" cy="66" r="1.4"/><circle cx="160" cy="30" r="1.6"/>
      <circle cx="176" cy="62" r="1.5"/><circle cx="150" cy="70" r="1.2"/><circle cx="204" cy="82" r="1.4"/><circle cx="84" cy="84" r="1.2"/>
    </g>
    <ellipse cx="150" cy="94" rx="132" ry="30" fill="url(#tc-brim)" transform="rotate(-4 150 94)"/>
    <path d="M22 98 Q150 140 280 94" fill="none" stroke="#3A507F" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" transform="rotate(-4 150 94)"/>
  </g></g>
  </g>

  <g id="tc-pet-hearts" opacity="0" fill="#E98F9C" stroke="#C96C84" stroke-width="1.2">
    <path d="M80 112 C70 98 54 112 80 133 C106 112 90 98 80 112Z"/>
    <path d="M224 97 C215 85 201 98 224 118 C247 98 233 85 224 97Z"/>
    <path d="M244 147 C237 138 226 149 244 165 C262 149 251 138 244 147Z"/>
  </g>
  <g id="tc-zzz" opacity="0" fill="#8774BD" font-family="system-ui,sans-serif" font-weight="bold"><text x="230" y="55" font-size="21">Z</text><text x="251" y="31" font-size="16">z</text><text x="267" y="12" font-size="12">z</text></g>
  <!-- Flexible forelegs stay attached while the rounded paws reach. -->
  <path id="tc-armL" d="M80 247 Q72 279 78 302 Q100 318 122 302 Q126 276 120 247" fill="url(#tc-fur)" stroke="#C97A2E" stroke-opacity=".3" stroke-width="1.5"/>
  <g id="tc-pawL">
    <path d="M72 303 C68 286 76 278 85 282 Q93 272 101 280 Q112 274 119 284 C132 282 134 301 126 314 Q100 333 75 316Z" fill="url(#tc-paw)" stroke="#C97A2E" stroke-opacity=".4" stroke-width="1.5"/>
    <g fill="none" stroke="#C97A2E" stroke-opacity=".45" stroke-width="1.7" stroke-linecap="round"><path d="M85 284 q-3 7 -1 12"/><path d="M101 281 v13"/><path d="M118 286 q3 5 1 10"/></g>
    <g id="tc-padsL" opacity="0" fill="#DB9290">
      <ellipse cx="100" cy="307" rx="12" ry="9"/>
      <ellipse cx="83" cy="297" rx="5" ry="6" transform="rotate(-20 83 297)"/>
      <ellipse cx="100" cy="290" rx="5" ry="6"/>
      <ellipse cx="117" cy="297" rx="5" ry="6" transform="rotate(20 117 297)"/>
    </g>
  </g>
  <path id="tc-armR" d="M180 247 Q172 279 178 302 Q200 318 222 302 Q226 276 220 247" fill="url(#tc-fur)" stroke="#C97A2E" stroke-opacity=".3" stroke-width="1.5"/>
  <g id="tc-pawR">
    <path d="M172 303 C168 286 176 278 185 282 Q193 272 201 280 Q212 274 219 284 C232 282 234 301 226 314 Q200 333 175 316Z" fill="url(#tc-paw)" stroke="#C97A2E" stroke-opacity=".4" stroke-width="1.5"/>
    <g fill="none" stroke="#C97A2E" stroke-opacity=".45" stroke-width="1.7" stroke-linecap="round"><path d="M185 284 q-3 7 -1 12"/><path d="M201 281 v13"/><path d="M218 286 q3 5 1 10"/></g>
    <g id="tc-padsR" opacity="0" fill="#DB9290">
      <ellipse cx="200" cy="307" rx="12" ry="9"/>
      <ellipse cx="183" cy="297" rx="5" ry="6" transform="rotate(-20 183 297)"/>
      <ellipse cx="200" cy="290" rx="5" ry="6"/>
      <ellipse cx="217" cy="297" rx="5" ry="6" transform="rotate(20 217 297)"/>
    </g>
  </g>

</g>
</svg>`;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (u) => 1 - (1 - u) * (1 - u);

  function mount(container, input) {
    container.innerHTML = SVG;
    const $ = (id) => container.querySelector("#" + id);
    const el = {
      body: $("tc-body"),
      head: $("tc-head"),
      armL: $("tc-armL"), armR: $("tc-armR"),
      padsL: $("tc-padsL"), padsR: $("tc-padsR"),
      tongue: $("tc-tongue"),
      mouth: $("tc-mouth"), blush: $("tc-blush"), hearts: $("tc-pet-hearts"),
      eyeL: $("tc-eyeL"),
      eyeR: $("tc-eyeR"), sleepEyes: $("tc-sleep-eyes"), zzz: $("tc-zzz"),
      pawL: $("tc-pawL"),
      pawR: $("tc-pawR"),
    };
    let mood = 'normal', lastAttention = Date.now(), wakeUntil = 0;
    let personality = 'calm';
    const profiles = {
      calm: { boredMs: 120000, sleepMs: 300000, idleMin: 11000, idleMax: 23000, waveChance: 0.16, motion: 0.65 },
      playful: { boredMs: 150000, sleepMs: 420000, idleMin: 6500, idleMax: 14000, waveChance: 0.45, motion: 1 },
      sleepy: { boredMs: 60000, sleepMs: 180000, idleMin: 15000, idleMax: 30000, waveChance: 0.08, motion: 0.4 },
    };
    function profile() { return profiles[personality]; }
    function setPersonality(value) {
      if (!Object.hasOwn(profiles, value)) return;
      personality = value;
      nextIdleAt = performance.now() + profile().idleMin;
    }
    let forcedMood = null, eyeOpen = 1, sleepBlend = 0, boredomBlend = 0;
    let wakeStart = -1e9, yawnStart = -1e9, pawWaveStart = -1e9;
    const moodEvents = new Set();
    function setMood(next, forced = false) {
      if (forced) forcedMood = next === 'auto' ? null : next;
      const target = forcedMood || next;
      if (target === mood) return;
      const previous = mood;
      mood = target;
      if (previous === 'sleepy' && mood !== 'sleepy') wakeStart = performance.now();
      if (mood === 'sleepy') yawnStart = performance.now();
      container.dispatchEvent(new CustomEvent('cat-mood-change', { detail: { mood } }));
    }
    function devMood(next) { lastAttention = Date.now(); setMood(next, true); }
    function wave() { const now = performance.now(); if (react("wave", now, 1100)) pawWaveStart = now; }

    // Personality changes mood thresholds, but never affects the break reminder timer.
    function attention() { lastAttention = Date.now(); forcedMood = null; setMood('normal'); }
    container.addEventListener('pointerdown', attention);
    input.addEventListener('focus', attention);
    // Search expressions share the existing frame loop; never alter paw state.
    const LONG_QUERY_LENGTH = 24, PEEK_COOLDOWN_MS = 7000;
    let previousQuery = input.value || '', nextPeekAt = performance.now() + 1800;
    let searchReaction = null, searchReactionStart = -1e9;
    function startSearchReaction(name) {
      attention();
      searchReaction = name;
      searchReactionStart = performance.now();
    }
    function queryChanged(event) {
      attention();
      const query = input.value, now = performance.now();
      if (!event.isComposing && previousQuery.trim().length >= LONG_QUERY_LENGTH && !query.trim()) {
        startSearchReaction('surprise');
      } else if (query.length > previousQuery.length && query.trim() && now >= nextPeekAt) {
        nextPeekAt = now + PEEK_COOLDOWN_MS;
        if (Math.random() < 0.35 && (!searchReaction || now - searchReactionStart > 1100)) startSearchReaction('peek');
      }
      previousQuery = query;
    }
    // Programmatic clears after submission must not count as user clearing a query.
    function queryReset() { previousQuery = input.value || ''; }
    function searchCompleted() { queryReset(); startSearchReaction('celebrate'); }
    input.addEventListener('input', queryChanged);
    let wasOverCat = false, teaseAt = -1e9, lastTease = -1e9;
    // A deliberate, sustained hover earns a playful paw reach.
    const HOVER_DWELL_MS = 2000, HOVER_REACH_COOLDOWN_MS = 14000;
    let hoverStartedAt = -1, hoverReachAt = -1e9, lastHoverReachAt = -1e9;
    let hoverReachSide = 1;
    let pettingUntil = -1e9, pettingStarted = -1e9, lastPetting = -1e9;
    let petStrokes = [], lastStrokeX = null, lastStrokeDirection = 0;
    const PET_WINDOW_MS = 1700, PET_COOLDOWN_MS = 5000;
    function resetPetStroke() { petStrokes = []; lastStrokeX = null; lastStrokeDirection = 0; }
    let smile = 0, dragging = false, pointer = null, lookX = 0, lookY = 0, reach = 0, alive = true, frameId;
    let nextIdleAt = performance.now() + 12000, idleGestureStart = -1e9, idleGesture = 'none';
    // One coordinator owns transient reactions; higher-priority interactions interrupt lower ones.
    const reactionPriority = { idle: 0, tease: 1, wave: 2, reach: 3, delight: 4, petting: 5, typing: 6 };
    let reaction = 'idle', reactionUntil = 0, lastDelight = -1e9;
    function activeReaction(now) {
      if (now >= reactionUntil) reaction = 'idle';
      return reaction;
    }
    function react(name, now, duration) {
      const current = activeReaction(now);
      if (reactionPriority[name] < reactionPriority[current]) return false;
      reaction = name;
      reactionUntil = now + duration;
      return true;
    }
    function onPointer(e) {
      pointer = { x: e.clientX, y: e.clientY };
      if (typeof e.dragging === "boolean") dragging = e.dragging;
      // Wake when the pointer enters the cat illustration, not just when typing.
      // Use the same SVG hit area as the existing hover/tease animation.
      const bounds = container.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const px = (pointer.x - bounds.left) / bounds.width * 300;
      const py = (pointer.y - bounds.top) / bounds.height * 364 - 34;
      const hoveringCat = px >= 28 && px <= 272 && py >= -20 && py <= 330;
      if (hoveringCat && !wasHoveringForWake && !dragging) attention();
      wasHoveringForWake = hoveringCat;
      // Detect deliberate back-and-forth strokes across the face, not ordinary hovering.
      const onHead = px >= 78 && px <= 222 && py >= 100 && py <= 188;
      if (!onHead || dragging) { resetPetStroke(); }
      else if (lastStrokeX !== null && Math.abs(px - lastStrokeX) >= 9) {
        const direction = Math.sign(px - lastStrokeX);
        if (lastStrokeDirection && direction !== lastStrokeDirection) {
          const now = performance.now();
          petStrokes.push(now);
          petStrokes = petStrokes.filter(t => now - t <= PET_WINDOW_MS);
          if (petStrokes.length >= 3 && now - lastPetting >= PET_COOLDOWN_MS && !reduce) {
            react("petting", now, 1800);
            pettingStarted = now;
            pettingUntil = now + 1800;
            lastPetting = now;
            hoverStartedAt = -1;
            hoverReachAt = -1e9;
            resetPetStroke();
            attention();
            container.dispatchEvent(new CustomEvent('cat-petted'));
          }
        }
        lastStrokeDirection = direction;
        lastStrokeX = px;
      } else if (lastStrokeX === null) lastStrokeX = px;
    }
    let wasHoveringForWake = false;
    function onDrag(e) { dragging = e.detail; if (dragging) reach = 0; }
    window.addEventListener("cat-drag", onDrag);
    function clearPointer() { pointer = null; wasHoveringForWake = false; resetPetStroke(); }
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("blur", clearPointer);
    document.addEventListener("pointerleave", clearPointer);
    const stopCursor = window.api?.onDockCursor?.(onPointer);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paws = [
      { el: el.pawL, t0: -1e9, dur: 150, lift: 0 },
      { el: el.pawR, t0: -1e9, dur: 150, lift: 0 },
    ];
    const keys = []; // recent keystroke timestamps
    let next = 0,
      count = 0; // which paw hits next
    let bob = 0,
      sway = 0,
      swayDir = 1,
      speed = 0,
      lastKey = -1e9;
    let blinkAt = performance.now() + 2500,
      blinkT0 = -1e9;

    function hit(i, now, dur, lift) {
      const p = paws[i];
      p.t0 = now;
      p.dur = dur;
      p.lift = lift;
    }

    function onKey(e) {
      if (
        e.isComposing ||
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock" ||
        e.key === "Tab" ||
        e.key.startsWith("Arrow")
      )
        return;
      attention();
      const now = performance.now();
      react("typing", now, 450);
      keys.push(now);
      while (keys.length && now - keys[0] > 1000) keys.shift();
      speed = clamp((keys.length - 1) / 8, 0, 1); // 0 = slow, 1 = ~9+ keys/sec
      const dur = 170 - 90 * speed; // faster typing = snappier taps
      const lift = 15 - 5 * speed; // ...and shorter lift
      count++;
      if (e.key === "Enter" || (speed > 0.7 && count % 3 === 0)) {
        // both paws: enter / frantic typing
        hit(0, now, dur, lift);
        hit(1, now + 25, dur, lift);
      } else {
        hit(next, now, dur, lift);
        next ^= 1;
      }
      bob = Math.min(1.6, bob + 0.5 + speed * 0.5);
      swayDir = -swayDir;
      sway = Math.min(1.4, sway + 0.4 + speed * 0.5);
      lastKey = now;
    }
    input.addEventListener("keydown", onKey);

    function pawOffset(p, now) {
      const u = (now - p.t0) / p.dur;
      if (u < 0 || u > 1) return 0;
      const up = 0.38; // quick lift, then a fast slam down
      return (
        -p.lift * (u < up ? ease(u / up) : Math.pow(1 - (u - up) / (1 - up), 2))
      );
    }

    let prev = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (now - lastKey > 500) speed = Math.max(0, speed - dt * 1.5); // settle back to idle
      bob *= Math.pow(0.002, dt);
      sway *= Math.pow(0.01, dt);

      if (!alive) return;
      const idle = Date.now() - lastAttention;
      setMood(idle >= profile().sleepMs ? 'sleepy' : idle >= profile().boredMs ? 'bored' : 'normal');
      // Lightweight autonomous gestures. Never preempt typing, petting, or reaching.
      if (now >= nextIdleAt) {
        const cfg = profile();
        nextIdleAt = now + cfg.idleMin + Math.random() * (cfg.idleMax - cfg.idleMin);
        if (!reduce && !dragging && !pointer && mood === 'normal' && activeReaction(now) === 'idle') {
          idleGesture = ['ear', 'tilt', 'glance'][Math.floor(Math.random() * 3)];
          idleGestureStart = now;
          if (Math.random() < cfg.waveChance) wave();
        }
      }
      const idleAge = now - idleGestureStart;
      const idleAmount = !reduce && !pointer && mood === 'normal' && activeReaction(now) === 'idle' && idleAge >= 0 && idleAge < 1200
        ? Math.sin(Math.PI * idleAge / 1200) * profile().motion : 0;
      const searchAge = now - searchReactionStart;
      if (searchAge >= 1100) searchReaction = null;
      const searchVisible = !dragging && mood === 'normal';
      const surprised = searchVisible && searchReaction === 'surprise';
      const celebrating = searchVisible && searchReaction === 'celebrate';
      const peek = searchVisible && searchReaction === 'peek' && !reduce
        ? Math.sin(Math.PI * clamp(searchAge / 1100, 0, 1)) : 0;
      const celebrationLift = celebrating && !reduce
        ? Math.pow(Math.sin(Math.PI * clamp(searchAge / 1100, 0, 1)), 2) * 5 : 0;
      const currentReaction = activeReaction(now);
      const petting = currentReaction === "petting" && now < pettingUntil;
      const sleepy = mood === 'sleepy', bored = mood === 'bored';
      const blend = Math.min(1, dt * (reduce ? 20 : 3.8));
      sleepBlend += ((sleepy ? 1 : 0) - sleepBlend) * blend;
      boredomBlend += ((bored ? 1 : 0) - boredomBlend) * blend;
      const wakeAge = now - wakeStart, yawnAge = now - yawnStart;
      const waking = wakeAge >= 0 && wakeAge < 950 && !reduce;
      const yawning = yawnAge >= 0 && yawnAge < 1100 && !reduce;
      el.sleepEyes.setAttribute('opacity', Math.max(sleepBlend, petting ? 0.95 : 0).toFixed(3));
      // Rare delight after a successful pet, never while typing or during reduced motion.
      if (!reduce && !petting && pettingStarted > 0 && now - pettingUntil > 0 &&
          now - pettingUntil < 120 && now - lastDelight > 60000 && Math.random() < 0.2 &&
          react('delight', now, 900)) lastDelight = now;
      const delighted = activeReaction(now) === 'delight';
      const petProgress = clamp((now - pettingStarted) / 1800, 0, 1);
      const heartFade = petting ? Math.min(1, petProgress * 5, (1 - petProgress) * 4) : 0;
      el.hearts.setAttribute('opacity', (reduce ? 0 : heartFade * 0.9).toFixed(3));
      el.hearts.setAttribute('transform', `translate(0 ${petting ? -15 * petProgress : 0})`);
      el.zzz.setAttribute('opacity', (sleepBlend * (yawning ? 0 : 0.85)).toFixed(3));
      el.zzz.setAttribute('transform', `translate(0 ${sleepy && !reduce ? -5 * Math.sin(now / 850) : 0})`);
      container.dataset.mood = mood;
      const bounds = container.getBoundingClientRect();
      const px = pointer ? (pointer.x - bounds.left) / bounds.width * 300 : 150;
      const py = pointer ? (pointer.y - bounds.top) / bounds.height * 364 - 34 : 132;
      const follow = 1 - Math.exp(-dt * 9);
      lookX += (clamp((px - 150) / 180, -1, 1) - lookX) * follow;
      lookY += (clamp((py - 132) / 160, -1, 1) - lookY) * follow;
      const near = pointer && Math.hypot(px - 150, py - 190) < 235;
      const overCat = pointer && px >= 28 && px <= 272 && py >= -20 && py <= 330;
      if (overCat && !wasOverCat && !dragging && now - lastTease > 1800 && reactionPriority[currentReaction] <= 1) {
        react("tease", now, 1000);
        teaseAt = now;
        lastTease = now;
        if (now - pawWaveStart > 20000 && Math.random() < 0.28) wave();
      }
      if (overCat && !wasOverCat && !dragging) hoverStartedAt = now;
      if (!overCat || dragging || sleepy || bored || petting || now - lastKey < 700) hoverStartedAt = -1;
      if (hoverStartedAt >= 0 && now - hoverStartedAt >= HOVER_DWELL_MS &&
          now - lastHoverReachAt >= HOVER_REACH_COOLDOWN_MS && !reduce && react("reach", now, 1300)) {
        hoverReachAt = now;
        lastHoverReachAt = now;
        hoverReachSide = px < 150 ? 0 : 1;
        hoverStartedAt = -1; // One reward per entry, not a repeating loop.
      }
      wasOverCat = !!overCat;
      if (dragging || !overCat) teaseAt = -1e9;
      const teaseAge = now - teaseAt;
      const tongueOut = activeReaction(now) !== "tease" || teaseAge < 0 || teaseAge > 1000 ? 0 :
        Math.min(1, teaseAge / 160, (1000 - teaseAge) / 220);
      el.tongue.setAttribute("opacity", tongueOut.toFixed(3));
      el.tongue.setAttribute("transform", `translate(0 ${166 * (1 - tongueOut)}) scale(1 ${Math.max(0.001, tongueOut)})`);
      smile += ((overCat ? 1 : 0) - smile) * follow;
      const mouthWidth = 15 + smile * 5;
      el.mouth.setAttribute("d", `M150 158 v5 M150 163 q${-7-smile*2} ${7+smile*5} ${-mouthWidth} ${2-smile*4} M150 163 q${7+smile*2} ${7+smile*5} ${mouthWidth} ${2-smile*4}`);
      el.blush.setAttribute("opacity", Math.max(smile * 0.28, petting ? 0.65 : delighted ? 0.55 : 0).toFixed(3));
      if (delighted) el.mouth.setAttribute("d", "M132 163 Q150 185 168 163");
      if (celebrating) el.mouth.setAttribute('d', 'M135 163 Q150 181 165 163');
      if (surprised) el.mouth.setAttribute('d', 'M145 165 a5 7 0 1 0 10 0 a5 7 0 1 0 -10 0');
      if (petting) el.mouth.setAttribute("d", "M135 165 Q150 181 165 165");
      if (yawning && !petting) {
        const open = Math.sin(Math.PI * yawnAge / 1100);
        el.mouth.setAttribute('d', `M142 167 Q150 ${167 + 20 * open} 158 167 Q150 ${164 - 5 * open} 142 167Z`);
      }
      const hunting = !petting && !sleepy && !bored && !dragging && near && now - lastKey > 700 && !reduce && reactionPriority[activeReaction(now)] <= 1;
      reach += ((hunting ? 1 : 0) - reach) * follow;
      if (dragging) reach = 0;
      const inputBounds = peek ? input.getBoundingClientRect() : null;
      const peekX = inputBounds ? clamp(((inputBounds.left + inputBounds.width / 2 - bounds.left) / bounds.width * 300 - 150) / 180, -1, 1) : 0;
      const gazeX = lookX * (1 - peek) + peekX * peek;
      const gazeY = lookY * (1 - peek) + peek;
      const hx = gazeX * (sleepy ? 0 : bored ? 2 : reduce ? 2 : 9) + (idleGesture === 'glance' ? idleAmount * 4 : 0), hy = gazeY * (sleepy ? 0 : reduce ? 2 : 7);
      const t = now / 1000,
        k = reduce ? 0.3 : 1;
      const breathe = Math.sin(t * (sleepy ? 1.5 : 2.1)) * (sleepy ? 0.9 : 0.6);
      const by = (breathe - celebrationLift - bob * (2.2 + speed * 2.5) + (waking ? -5 * Math.sin(Math.PI * wakeAge / 950) : 0)) * k;
      el.body.setAttribute("transform", `translate(0 ${by * 0.5})`);
      el.head.setAttribute("transform", `translate(${hx} ${by + hy}) rotate(${gazeX * 3 * k + (sleepy ? 3 * sleepBlend : 0) + (waking ? 5 * Math.sin(Math.PI * wakeAge / 950) : 0) + (idleGesture === 'tilt' ? idleAmount * 5 : idleGesture === 'ear' ? idleAmount * -2 : 0)} 150 175)`);


      for (const [i, p] of paws.entries()) {
        const active = (px < 150 ? 0 : 1) === i;
        const catchAmount = active ? reach * (0.92 + 0.08 * Math.sin(t * 4)) : 0;
        const hoverReachAgeForX = now - hoverReachAt;
        const hoverReachX = i === hoverReachSide && overCat && !dragging &&
          hoverReachAgeForX >= 0 && hoverReachAgeForX < 1300 && activeReaction(now) === "reach" && !reduce
          ? Math.sin(Math.PI * hoverReachAgeForX / 1300) : 0;
        const dx = clamp(px - (i ? 200 : 100), -32, 32) * catchAmount +
          clamp(px - (i ? 200 : 100), -24, 24) * hoverReachX * 0.5;
        const waveAge = now - pawWaveStart; const waveLift = i === 1 && waveAge >= 0 && waveAge < 1100 && activeReaction(now) === "wave" && !reduce ? -23 * Math.sin(Math.PI * waveAge / 1100) : 0;
        const hoverReachAge = now - hoverReachAt;
        const hoverReachStrength = i === hoverReachSide && overCat && !dragging &&
          hoverReachAge >= 0 && hoverReachAge < 1300 && activeReaction(now) === "reach" && !reduce
          ? Math.sin(Math.PI * hoverReachAge / 1300) : 0;
        const dy = dragging ? 0 : pawOffset(p, now) * k +
          clamp(py - 310, -55, 0) * catchAmount + waveLift - 30 * hoverReachStrength;
        const x = i ? 200 : 100;
        const rot = clamp(dx * 0.18, -10, 10);
        const endX = x + dx, endY = 300 + dy;
        const arm = i ? el.armR : el.armL;
        // A constant-width, rounded foreleg avoids folded or pointed arm silhouettes.
        arm.setAttribute("d", `M${x} 250 Q${x + dx * 0.2} ${275 + dy * 0.25} ${endX} ${endY}`);
        arm.setAttribute("fill", "none");
        arm.setAttribute("stroke", "url(#tc-fur)");
        arm.setAttribute("stroke-width", "39");
        arm.setAttribute("stroke-opacity", "1");
        arm.setAttribute("stroke-linecap", "round");
        (i ? el.padsR : el.padsL).setAttribute("opacity", clamp((-dy - 18) / 70, 0, 0.48).toFixed(2));
        p.el.setAttribute(
          "transform",
          `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${x} 300)`,
        );
      }

      // blink (a bit faster while typing)
      if (now > blinkAt) {
        blinkT0 = now;
        blinkAt = now + 2000 + Math.random() * 3500 - speed * 1000;
      }
      const bu = (now - blinkT0) / 140;
      const sy = bu >= 0 && bu <= 1 ? 1 - 0.9 * Math.sin(bu * Math.PI) : 1;
      const eye = `translate(${gazeX * 3} ${128 + gazeY * 2}) scale(1 ${(Math.max(0.02, (1 - sleepBlend) * (1 - boredomBlend * 0.55) * (petting ? 0.03 : surprised ? 1.3 : celebrating ? 0.65 : 1) * (surprised ? 1 : sy))).toFixed(3)}) translate(0 -128)`;
      el.eyeL.setAttribute("transform", eye);
      el.eyeR.setAttribute("transform", eye);

      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    const onDevMood = (e) => devMood(e.detail);
    const onDevWave = () => wave();
    window.addEventListener('cat-dev-mood', onDevMood);
    window.addEventListener('cat-dev-wave', onDevWave);
    return {
      setMood: devMood, setPersonality, wave, searchCompleted, queryReset,
      destroy() {
        alive = false;
        cancelAnimationFrame(frameId);
        window.removeEventListener("cat-drag", onDrag);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("blur", clearPointer);
        document.removeEventListener("pointerleave", clearPointer);
        stopCursor?.();
        window.removeEventListener('cat-dev-mood', onDevMood);
        window.removeEventListener('cat-dev-wave', onDevWave);
        input.removeEventListener("keydown", onKey);
        input.removeEventListener("focus", attention);
        input.removeEventListener("input", queryChanged);
        container.removeEventListener("pointerdown", attention);
      },
    };
  }
  return { mount };
})();

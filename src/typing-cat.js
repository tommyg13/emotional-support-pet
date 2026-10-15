/* typing-cat.js — orange wizard cat that types when you type.
   Usage: TypingCat.mount(containerEl, inputEl)  (no dependencies, transparent background) */
const TypingCat = (() => {
  // Shared vector artwork for the dock controls and the mouth-held items.
  const yarnArt = `<circle cx="32" cy="32" r="23" fill="#C6A0D8" stroke="#886399" stroke-width="2.5"/><g fill="none" stroke="#F1DFF5" stroke-width="2.5" stroke-linecap="round"><path d="M15 17q18 3 33 25M10 27q17 1 30 25M24 10q18 8 29 23M17 49q5-21 28-35M27 54q4-20 27-30"/></g><path d="M13 47Q1 51 6 58q5 4 11-1" fill="none" stroke="#886399" stroke-width="2.5" stroke-linecap="round"/>`;
  const yarnIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${yarnArt}</svg>`;
  const careIcons = {
    water: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M25 13h14v9l6 7v25q0 5-5 5H24q-5 0-5-5V29l6-7Z" fill="#DDF5FA" stroke="#528EAA" stroke-width="2.5"/><path d="M20 36q12 5 24 0v17q0 5-5 5H25q-5 0-5-5Z" fill="#80CEE6"/><rect x="24" y="6" width="16" height="9" rx="3" fill="#7396C7" stroke="#496E9F" stroke-width="2"/><path d="M25 28v17" stroke="white" stroke-width="3" stroke-linecap="round"/><path d="M32 39q-10 11 0 12q10-1 0-12" fill="#EFFBFF"/></svg>`,
    snack: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M16 32 5 21v22Z" fill="#D78B49" stroke="#A96634" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 32Q37 7 59 32Q37 57 15 32Z" fill="#F5BE70" stroke="#A96634" stroke-width="2.5"/><path d="m32 18 6-6 7 9M32 46l6 6 7-9" fill="#E7A355" stroke="#A96634" stroke-width="2" stroke-linejoin="round"/><path d="M35 22q-8 10 0 20" fill="none" stroke="#D18B47" stroke-width="2"/><circle cx="47" cy="28" r="2.5" fill="#513A36"/><path d="M25 29v6m-5-3h10" stroke="#FFF0CC" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
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
  <linearGradient id="tc-hat-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#34497D"/><stop offset="1" stop-color="#1B2748"/>
  </linearGradient>
  <linearGradient id="tc-brim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2B3C69"/><stop offset="1" stop-color="#141C36"/>
  </linearGradient>
  <radialGradient id="tc-chest" cx=".5" cy=".4" r=".6">
    <stop offset="0" stop-color="#FDE7C9"/><stop offset="1" stop-color="#FDE7C9" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="tc-volume" cx=".32" cy=".3" r=".8"><stop offset="0" stop-color="#FFD6A2"/><stop offset=".5" stop-color="#F3AA5C"/><stop offset="1" stop-color="#C36B30"/></radialGradient>
  <radialGradient id="tc-round-paw" cx=".36" cy=".28" r=".8"><stop offset="0" stop-color="#FFE0AD"/><stop offset=".45" stop-color="#F3B166"/><stop offset="1" stop-color="#CC7437"/></radialGradient>
</defs>

<g id="tc-root">
  <!-- body -->
  <g id="tc-body">
    <path d="M34 330 C22 255 52 192 108 176 L192 176 C248 192 278 255 266 330 Z" fill="url(#tc-volume)"/>
    <ellipse cx="150" cy="226" rx="52" ry="48" fill="url(#tc-chest)"/>
    <g fill="none" stroke="#D27A2E" stroke-opacity=".45" stroke-width="3" stroke-linecap="round">
      <path d="M58 250 q10 6 14 18"/>
      <path d="M242 250 q-10 6 -14 18"/>
    </g>
    <ellipse cx="150" cy="196" rx="64" ry="13" fill="#875026" opacity=".14"/>
  </g>

  <!-- head -->
  <g id="tc-head">
    <ellipse cx="150" cy="132" rx="92" ry="72" fill="url(#tc-face)"/>
    <ellipse cx="150" cy="160" rx="42" ry="28" fill="#FDEBD2" opacity=".85"/>
    <ellipse cx="102" cy="158" rx="22" ry="16" fill="#FDEBD2" opacity=".55"/>
    <ellipse cx="198" cy="158" rx="22" ry="16" fill="#FDEBD2" opacity=".55"/>
    <g id="tc-features">
    <!-- eyes -->
    <g id="tc-eyeL"><ellipse cx="116" cy="128" rx="10" ry="12" fill="#1B1522"/><ellipse cx="119" cy="123" rx="3.6" ry="4" fill="#fff" opacity=".9"/><ellipse cx="113" cy="133" rx="1.6" ry="1.8" fill="#fff" opacity=".5"/></g>
    <g id="tc-eyeR"><ellipse cx="184" cy="128" rx="10" ry="12" fill="#1B1522"/><ellipse cx="187" cy="123" rx="3.6" ry="4" fill="#fff" opacity=".9"/><ellipse cx="181" cy="133" rx="1.6" ry="1.8" fill="#fff" opacity=".5"/></g>
    <g id="tc-sleep-eyes" opacity="0" fill="none" stroke="#75462E" stroke-width="4" stroke-linecap="round"><path d="M103 128 Q116 137 129 128"/><path d="M171 128 Q184 137 197 128"/></g>
    <!-- nose + mouth -->
    <path d="M142 147 Q150 143 158 147 Q156 156 150 158 Q144 156 142 147Z" fill="#E98F8C"/>
    <path id="tc-mouth" d="M150 158 v5 M150 163 q-7 7 -15 2 M150 163 q7 7 15 2" fill="none" stroke="#B8665E" stroke-width="1.8" stroke-linecap="round"/>
    <g id="tc-drool" opacity="0" pointer-events="none">
      <path d="M163 165 Q166 168 165 175 L166 181 Q170 187 165 190 Q159 191 160 185 L161 175 Q160 169 163 165Z" fill="#BCE8F2" stroke="#83BED1" stroke-width="1" fill-opacity=".85"/>
      <path d="M163 179v6" stroke="#F4FDFF" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <g id="tc-tongue" opacity="0">
      <path d="M143 166 Q150 163 157 166 L157 175 C157 185 143 185 143 175Z" fill="#ED8799" stroke="#C96C7F" stroke-width="1.2"/>
      <path d="M150 169 v7" fill="none" stroke="#C96C7F" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <g id="tc-blush" fill="#E98F8C" opacity="0">
      <ellipse cx="106" cy="153" rx="13" ry="7"/>
      <ellipse cx="194" cy="153" rx="13" ry="7"/>
    </g>
    <!-- Items live inside the head group, so they follow the mouth exactly. -->
    <g id="tc-water" opacity="0" pointer-events="none"><g transform="rotate(-48 150 164)"><svg x="118" y="154" width="64" height="64">${careIcons.water}</svg></g></g>
    <g id="tc-snack" opacity="0" pointer-events="none"><g transform="rotate(-35 150 164)"><svg x="100" y="137" width="54" height="54">${careIcons.snack}</svg></g></g>
    <!-- whiskers -->
    <g stroke="#FFF6EA" stroke-opacity=".9" stroke-width="1.4" stroke-linecap="round" fill="none">
      <path d="M112 160 Q80 150 52 152"/><path d="M112 166 Q80 168 56 178"/><path d="M114 172 Q90 184 70 202"/>
      <path d="M188 160 Q220 150 248 152"/><path d="M188 166 Q220 168 244 178"/><path d="M186 172 Q210 184 230 202"/>
    </g>

    </g>
  <!-- hat: attached to the head so both share one pivot -->
  <g id="tc-hat"><g transform="translate(0 -26) rotate(-3 150 94)">
    <path d="M62 92 C86 66 105 29 135 8 C153 -5 181 0 201 19 Q211 30 207 42 Q190 26 174 31 C185 52 211 77 238 92 Z" fill="url(#tc-hat-fill)"/>
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
  <g id="tc-dream" opacity="0" pointer-events="none" aria-hidden="true">
    <g fill="#FFF5ED" stroke="#DABFD9" stroke-width="2">
      <ellipse cx="-60" cy="48" rx="62" ry="43"/>
      <circle cx="12" cy="88" r="8"/><circle cx="33" cy="105" r="4"/>
    </g>
    <g id="tc-dream-fish" opacity="0" transform="translate(-90 18)">
      <path d="M17 31 3 19v24Z" fill="#DB9A58" stroke="#AC7544" stroke-width="2"/>
      <path d="M15 31Q38 7 59 31Q38 55 15 31Z" fill="#F5BE70" stroke="#AC7544" stroke-width="2"/>
      <circle cx="47" cy="27" r="2.5" fill="#513A36"/>
      <path d="M34 22q-7 9 0 18" fill="none" stroke="#DB9A58" stroke-width="2"/>
    </g>
    <g id="tc-dream-yarn" opacity="0" transform="translate(-84 24) scale(.75)">${yarnArt}</g>
    <path id="tc-dream-heart" opacity="0" d="M-60 34 C-88 8 -106 50 -60 71 C-14 50 -32 8 -60 34Z" fill="#EDA9BB" stroke="#CA849C" stroke-width="2"/>
  </g>
  <!-- Flexible forelegs stay attached while the rounded paws reach. -->
  <path id="tc-armL" d="M80 247 Q72 279 78 302 Q100 318 122 302 Q126 276 120 247" fill="url(#tc-fur)" stroke="#C97A2E" stroke-opacity=".3" stroke-width="1.5"/>
  <g id="tc-pawL">
    <path d="M73 302 C71 289 79 279 88 281 Q96 274 104 281 Q115 277 120 285 C129 288 130 302 123 310 Q100 326 77 310Z" fill="url(#tc-round-paw)" stroke="#B9743D" stroke-opacity=".22" stroke-width="1.3"/>
    <path d="M86 285q-3 5-2 11 M101 282v12 M115 287q3 4 2 9" fill="none" stroke="#BB7B47" stroke-width="1.5" stroke-linecap="round" opacity=".65"/>
    <g id="tc-padsL" fill="#D38E95" opacity="0"><ellipse cx="100" cy="304" rx="10" ry="7"/><ellipse cx="87" cy="294" rx="4" ry="5"/><ellipse cx="100" cy="289" rx="4" ry="5"/><ellipse cx="113" cy="294" rx="4" ry="5"/></g>
  </g>
  <path id="tc-armR" d="M180 247 Q172 279 178 302 Q200 318 222 302 Q226 276 220 247" fill="url(#tc-fur)" stroke="#C97A2E" stroke-opacity=".3" stroke-width="1.5"/>
  <g id="tc-pawR">
    <path d="M173 302 C171 289 179 279 188 281 Q196 274 204 281 Q215 277 220 285 C229 288 230 302 223 310 Q200 326 177 310Z" fill="url(#tc-round-paw)" stroke="#B9743D" stroke-opacity=".22" stroke-width="1.3"/>
    <path d="M186 285q-3 5-2 11 M201 282v12 M215 287q3 4 2 9" fill="none" stroke="#BB7B47" stroke-width="1.5" stroke-linecap="round" opacity=".65"/>
    <g id="tc-padsR" fill="#D38E95" opacity="0"><ellipse cx="200" cy="304" rx="10" ry="7"/><ellipse cx="187" cy="294" rx="4" ry="5"/><ellipse cx="200" cy="289" rx="4" ry="5"/><ellipse cx="213" cy="294" rx="4" ry="5"/></g>
  </g>

  <g id="tc-yarn" opacity="0" pointer-events="none">${yarnArt}</g>
</g>
</svg>`;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (u) => 1 - (1 - u) * (1 - u);

  function mount(container, input) {
    container.innerHTML = SVG;
    const $ = (id) => container.querySelector("#" + id);
    const el = {
      dream: $("tc-dream"), dreamIcons: [$("tc-dream-fish"), $("tc-dream-yarn"), $("tc-dream-heart")],
      body: $("tc-body"), yarn: $("tc-yarn"), water: $("tc-water"), snack: $("tc-snack"),
      head: $("tc-head"), features: $("tc-features"), hat: $("tc-hat"),
      armL: $("tc-armL"), armR: $("tc-armR"),
      padsL: $("tc-padsL"), padsR: $("tc-padsR"),
      tongue: $("tc-tongue"),
      mouth: $("tc-mouth"), drool: $("tc-drool"), blush: $("tc-blush"), hearts: $("tc-pet-hearts"),
      eyeL: $("tc-eyeL"),
      eyeR: $("tc-eyeR"), sleepEyes: $("tc-sleep-eyes"), zzz: $("tc-zzz"),
      pawL: $("tc-pawL"),
      pawR: $("tc-pawR"),
    };
    let mood = 'normal', lastAttention = Date.now(), wakeUntil = 0;
    let personality = 'calm';
    const profiles = {
      calm: { boredMs: 120000, sleepMs: 300000, idleMin: 11000, idleMax: 23000, waveChance: 0.16, motion: 0.65, peekChance: 0.35, peekCooldownMs: 7000, celebrationLift: 5, celebrationSmile: 18, celebrationEye: 0.65 },
      playful: { boredMs: 150000, sleepMs: 420000, idleMin: 6500, idleMax: 14000, waveChance: 0.45, motion: 1, peekChance: 0.6, peekCooldownMs: 4500, celebrationLift: 8, celebrationSmile: 24, celebrationEye: 0.45 },
      sleepy: { boredMs: 60000, sleepMs: 180000, idleMin: 15000, idleMax: 30000, waveChance: 0.08, motion: 0.4, peekChance: 0.15, peekCooldownMs: 12000, celebrationLift: 2, celebrationSmile: 10, celebrationEye: 0.8 },
    };
    function profile() { return profiles[personality]; }
    function setPersonality(value) {
      if (!Object.hasOwn(profiles, value)) return;
      personality = value;
      nextIdleAt = performance.now() + profile().idleMin;
      nextPeekAt = performance.now() + 1800;
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
      if (mood !== 'sleepy') el.dream.setAttribute('opacity', '0');
      if (previous === 'sleepy' && mood !== 'sleepy') wakeStart = performance.now();
      if (mood === 'sleepy') yawnStart = performance.now();
      container.dispatchEvent(new CustomEvent('cat-mood-change', { detail: { mood } }));
    }
    function devMood(next) { lastAttention = Date.now(); setMood(next, true); }
    function wave() { const now = performance.now(); if (react("wave", now, 1100)) pawWaveStart = now; }

    // Personality changes mood thresholds, but never affects the break reminder timer.
    function attention() { lastAttention = Date.now(); forcedMood = null; setMood('normal'); }
    container.addEventListener('pointerdown', attention);
    let welcomeStart = -1e9;
    function returnToSearch() {
      // Only greet after inactivity, once per return, including an already-focused input.
      const returning = mood === 'bored' || mood === 'sleepy' || Date.now() - lastAttention >= profile().boredMs;
      attention();
      if (returning) {
        welcomeStart = performance.now();
        wakeStart = -1e9; // The greeting replaces the usual wake stretch.
        yawnStart = -1e9;
        nextIdleAt = Math.max(nextIdleAt, welcomeStart + 2600);
      }
    }
    input.addEventListener('focus', returnToSearch);
    // Search expressions share the existing frame loop; never alter paw state.
    const LONG_QUERY_LENGTH = 24;
    let previousQuery = input.value || '', nextPeekAt = performance.now() + 1800;
    let searchReaction = null, searchReactionStart = -1e9;
    function startSearchReaction(name) {
      welcomeStart = -1e9;
      stopYarn();
      attention();
      searchReaction = name;
      searchReactionStart = performance.now();
    }
    function queryChanged(event) {
      stopYarn();
      returnToSearch();
      const query = input.value, now = performance.now();
      if (!event.isComposing && previousQuery.trim().length >= LONG_QUERY_LENGTH && !query.trim()) {
        startSearchReaction('surprise');
      } else if (query.length > previousQuery.length && query.trim() && now >= nextPeekAt) {
        nextPeekAt = now + profile().peekCooldownMs;
        if (Math.random() < profile().peekChance && (!searchReaction || now - searchReactionStart > 1100)) startSearchReaction('peek');
      }
      previousQuery = query;
    }
    // Programmatic clears after submission must not count as user clearing a query.
    function queryReset() { previousQuery = input.value || ''; }
    function searchCompleted() { queryReset(); startSearchReaction('celebrate'); }
    input.addEventListener('input', queryChanged);
    let yarnStart = -1e9, yarnRunning = false, yarnWakeMs = 0, yarnStruck = false, yarnPersonality = 'calm';
    const yarnProfiles = {
      calm: { duration: 3000, delay: 0, interest: 0.85 },
      playful: { duration: 2400, delay: 0, interest: 1 },
      sleepy: { duration: 3600, delay: 500, interest: 0.65 },
    };
    const yarnQuotes = {
      calm: ['A little play, then back to your day.', 'That was lovely. One small task next?', 'I’ll keep you company while you work.'],
      playful: ['Your turn—go catch that deadline!', 'Enough yarn. Go do your thing!', 'I caught the ball. You’ve got this!'],
      sleepy: ['You work. I’ll handle the naps.', 'Back to work… quietly, please.', 'One little task, then we rest.'],
    };
    const lastYarnQuote = {};
    let yarnQuoteUntil = -1e9;
    function clearYarnQuote() {
      if (yarnQuoteUntil > 0) container.dispatchEvent(new CustomEvent('cat-yarn-quote-clear'));
      yarnQuoteUntil = -1e9;
    }
    let yarnProfile = yarnProfiles.calm;
    function stopYarn() {
      clearYarnQuote();
      yarnRunning = false; yarnStruck = false;
      el.yarn.setAttribute('opacity', '0');
    }
    function playYarn() {
      const now = performance.now();
      if (!alive || dragging || yarnRunning || now < focusUntil || now - lastKey < 450 || now < happyUntil) return false;
      stopYarn();
      const wasSleeping = mood === 'sleepy' || Date.now() - lastAttention >= profile().sleepMs;
      attention(); welcomeStart = -1e9; wakeStart = wasSleeping ? now : -1e9; yawnStart = -1e9;
      yarnWakeMs = wasSleeping ? 700 : 0;
      yarnPersonality = personality;
      reaction = 'idle'; reactionUntil = now;
      searchReaction = null; idleGestureStart = -1e9;
      yarnProfile = yarnProfiles[personality]; yarnStart = now; yarnRunning = true;
      nextIdleAt = Math.max(nextIdleAt, now + yarnWakeMs + yarnProfile.duration + 2000);
      return true;
    }
    let careKind = null, careStart = -1e9, happyUntil = -1e9, fullUntil = -1e9;
    let careClicks = [], belly = 0, wasFull = false;
    let manualCare = null, manualNear = false, manualLift = 0, pendingManualCare = null;
    function cancelManualCare() { manualCare = null; manualNear = false; }
    function beginManualCare(kind) {
      if (!alive || dragging || !Object.hasOwn(careIcons, kind)) return false;
      stopYarn(); pendingManualCare = null;
      manualCare = { kind, point:null, woke:false, readyAt:0 }; manualNear = false;
      return true;
    }
    function updateManualCare(clientX, clientY) {
      if (!manualCare || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
      manualCare.point = {x:clientX, y:clientY};
      const bounds = container.getBoundingClientRect();
      const matrix = el.mouth.getScreenCTM?.();
      const mouth = matrix ? {x:matrix.a*150+matrix.c*166+matrix.e, y:matrix.b*150+matrix.d*166+matrix.f}
        : {x:bounds.left+bounds.width/2, y:bounds.top+(166+34)/364*bounds.height};
      const distance = Math.hypot(clientX-mouth.x, clientY-mouth.y);
      const scale = bounds.width / 300;
      manualNear = distance < 155 * scale;
      if (manualNear && !manualCare.woke) {
        const sleeping = mood === 'sleepy' || Date.now()-lastAttention >= profile().sleepMs;
        attention(); welcomeStart = -1e9; yawnStart = -1e9;
        wakeStart = sleeping ? performance.now() : -1e9;
        manualCare.woke = true; manualCare.readyAt = performance.now() + (sleeping ? 950 : 0);
      }
      if (distance > 32 * scale || performance.now() < manualCare.readyAt) return false;
      const kind = manualCare.kind;
      cancelManualCare();
      if (!giveCare(kind, true)) return false;
      container.dispatchEvent(new CustomEvent('cat-manual-care-delivered'));
      return true;
    }
    function giveCare(kind, manual = false) {
      if (!alive || dragging || !Object.hasOwn(careIcons, kind)) return false;
      const now = performance.now();
      if (now - careStart < 350) return false; // Ignore double clicks; never queue reactions.
      stopYarn(); cancelManualCare(); pendingManualCare = manual ? {kind, personality} : null;
      attention(); welcomeStart = -1e9; wakeStart = -1e9; yawnStart = -1e9;
      careKind = kind; careStart = now; happyUntil = now + 2200;
      careClicks = careClicks.filter(t => now - t < 12000).slice(-4);
      careClicks.push(now);
      if (careClicks.length >= 5) fullUntil = now + 4500;
      nextIdleAt = Math.max(nextIdleAt, happyUntil + 1200);
      return true;
    }
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
      if (hoveringCat && !wasHoveringForWake && !dragging && !manualCare) attention();
      wasHoveringForWake = hoveringCat;
      // Detect deliberate back-and-forth strokes across the face, not ordinary hovering.
      const onHead = px >= 78 && px <= 222 && py >= 100 && py <= 188;
      if (!onHead || dragging || manualCare) { resetPetStroke(); }
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
    function onDrag(e) { if (e.detail) { cancelManualCare(); pendingManualCare = null; stopYarn(); el.dream.setAttribute('opacity', '0'); } dragging = e.detail; if (dragging) reach = 0; }
    window.addEventListener("cat-drag", onDrag);
    function clearPointer() { stopYarn(); pointer = null; wasHoveringForWake = false; resetPetStroke(); }
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

    // A sustained run of typing quiets autonomous gestures through brief pauses.
    // Keep this separate from paw timing and explicit search/pointer reactions.
    const FOCUS_ENTRY_MS = 2500, FOCUS_PAUSE_MS = 3000;
    let typingRunStart = -1e9, typingRunCount = 0, focusUntil = -1e9, wasFocused = false;
    function noteTyping(now) {
      if (now - lastKey > 1200) { typingRunStart = now; typingRunCount = 0; }
      typingRunCount++;
      if (now < focusUntil || (typingRunCount >= 6 && now - typingRunStart >= FOCUS_ENTRY_MS)) {
        focusUntil = now + FOCUS_PAUSE_MS;
      }
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
      cancelManualCare(); pendingManualCare = null;
      stopYarn();
      returnToSearch();
      const now = performance.now();
      if (!e.repeat) noteTyping(now);
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

    let dreamStart = -1e9, nextDreamAt = Infinity, wasNapping = false, dreamKind = -1;
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
      const focused = now < focusUntil;
      if (focused) idleGestureStart = -1e9;
      // Give a finished typing session a gentle pause before resuming idle gestures.
      if (wasFocused && !focused) nextIdleAt = Math.max(nextIdleAt, now + 1200);
      wasFocused = focused;
      // Lightweight autonomous gestures. Never preempt typing, petting, or reaching.
      if (!yarnRunning && !focused && now >= nextIdleAt) {
        const cfg = profile();
        nextIdleAt = now + cfg.idleMin + Math.random() * (cfg.idleMax - cfg.idleMin);
        if (!reduce && !dragging && !pointer && mood === 'normal' && activeReaction(now) === 'idle') {
          idleGesture = ['ear', 'tilt', 'glance'][Math.floor(Math.random() * 3)];
          idleGestureStart = now;
          if (Math.random() < cfg.waveChance) wave();
        }
      }
      if (now >= yarnQuoteUntil) clearYarnQuote();
      const yarnAge = now - yarnStart - yarnWakeMs;
      if (yarnRunning && yarnAge >= yarnProfile.duration) {
        const completed = yarnStruck && yarnAge < yarnProfile.duration + 500;
        yarnRunning = false; yarnStruck = false;
        if (completed) {
          const choices = yarnQuotes[yarnPersonality].filter((_, i) => i !== lastYarnQuote[yarnPersonality]);
          const message = choices[Math.floor(Math.random() * choices.length)];
          lastYarnQuote[yarnPersonality] = yarnQuotes[yarnPersonality].indexOf(message);
          yarnQuoteUntil = now + 4500;
          container.dispatchEvent(new CustomEvent('cat-yarn-complete', { detail: { personality: yarnPersonality, message } }));
        }
      }
      const yarnProgress = clamp(yarnAge / yarnProfile.duration, 0, 1);
      // Roll to the inner edge of the right paw, then reverse only after its contact.
      const contact = 0.52;
      if (yarnRunning && yarnProgress >= contact) yarnStruck = true;
      const approach = clamp(yarnProgress / 0.45, 0, 1);
      const returnProgress = clamp((yarnProgress - contact) / (1 - contact), 0, 1);
      const yarnX = yarnProgress <= contact ? -120 + 297 * ease(approach) : 177 - 297 * ease(returnProgress);
      const yarnY = 300;
      const yarnBat = yarnRunning && !reduce && !dragging && yarnProgress >= 0.36 && yarnProgress < 0.68
        ? Math.sin(Math.PI * (yarnProgress - 0.36) / 0.32) : 0;
      el.yarn.setAttribute('opacity', yarnRunning && !dragging && yarnAge >= 0 ? '1' : '0');
      el.yarn.setAttribute('transform', `translate(${reduce ? -80 : yarnX} ${yarnY}) rotate(${reduce ? 0 : (yarnX + 120) * 2.7}) scale(0.65) translate(-32 -32)`);
      const yarnWatch = yarnRunning && !reduce && yarnAge >= yarnProfile.delay
        ? Math.min(1, (yarnAge - yarnProfile.delay) / 250, (yarnProfile.duration - yarnAge) / 350) * yarnProfile.interest : 0;
      // Smile on approach, while the ball is close, rather than after it rolls away.
      const yarnHappy = yarnRunning && !dragging && yarnProgress >= 0.32 && yarnProgress <= 0.62;
      const yarnAimX = clamp((yarnX - 150) / 90, -1, 1);
      const yarnTilt = yarnAimX * yarnWatch * 20;
      const idleAge = now - idleGestureStart;
      const idleAmount = !yarnRunning && !focused && !reduce && !pointer && mood === 'normal' && activeReaction(now) === 'idle' && idleAge >= 0 && idleAge < 1200
        ? Math.sin(Math.PI * idleAge / 1200) * profile().motion : 0;
      const careAge = now - careStart;
      manualLift += ((manualNear ? 1 : 0) - manualLift) * Math.min(1, dt * 9);
      if (pendingManualCare && careAge >= 1400) {
        const {kind, personality:carePersonality} = pendingManualCare;
        pendingManualCare = null;
        if (careAge < 1900 && !dragging) {
          const lines = kind === 'water'
            ? { calm:['A lovely little sip. Thank you.','Refreshed and ready to keep you company.','Water delivered with love. ♡'], playful:['Hydrated! Back to mischief.','Five-star water service!','Sip, sip… you’re my favorite human.'], sleepy:['A sleepy sip… thank you.','Water, then a tiny nap.','Even dreamers need a drink.'] }
            : { calm:['That was lovely. Thank you for the treat.','A little snack, a lot of love.','I’ll save you a cozy spot beside me.'], playful:['Fish delivery! Best day ever.','You bring the snacks. I bring the charm.','That deserves a happy little purr!'], sleepy:['A snack before my nap? Perfect.','Mmm… dreaming of the next one already.','Full tummy. Sleepy paws. Happy cat.'] };
          const choices = lines[carePersonality];
          const message = now < fullUntil ? 'So loved—and so full! Let’s save the next one. ♡' : choices[Math.floor(Math.random()*choices.length)];
          yarnQuoteUntil = now + 4500;
          container.dispatchEvent(new CustomEvent('cat-manual-care-complete', {detail:{kind, message}}));
        }
      }
      const caring = !dragging && careAge >= 0 && careAge < 1400;
      const full = now < fullUntil;
      const careHappy = !dragging && (now < happyUntil || full);
      if (full !== wasFull) {
        wasFull = full;
        container.dispatchEvent(new CustomEvent('cat-care-full', { detail: { full } }));
      }
      const itemFade = caring ? (reduce ? 1 : Math.min(1, careAge / 160, (1400 - careAge) / 220)) : 0;
      el.water.setAttribute('opacity', careKind === 'water' ? itemFade.toFixed(3) : '0');
      el.snack.setAttribute('opacity', careKind === 'snack' ? itemFade.toFixed(3) : '0');
      belly += ((full ? 1 : 0) - belly) * Math.min(1, dt * (reduce ? 100 : 5));
      const welcomeAge = now - welcomeStart;
      const welcoming = welcomeAge >= 0 && welcomeAge < 1400 && !focused && !dragging && mood === 'normal' && activeReaction(now) !== 'petting';
      const welcomeAmount = welcoming && !reduce ? Math.pow(Math.sin(Math.PI * welcomeAge / 1400), 2) : 0;
      const welcomeLift = personality === 'calm' ? welcomeAmount * 3 : 0;
      const welcomeTilt = personality === 'playful' ? welcomeAmount * 6 : 0;
      const welcomeBlink = personality === 'sleepy' ? 1 - welcomeAmount * 0.9 : 1;
      const searchAge = now - searchReactionStart;
      if (searchAge >= 1100) searchReaction = null;
      const searchVisible = !dragging && mood === 'normal';
      const surprised = searchVisible && searchReaction === 'surprise';
      const celebrating = searchVisible && searchReaction === 'celebrate';
      const peek = searchVisible && searchReaction === 'peek' && !reduce
        ? Math.sin(Math.PI * clamp(searchAge / 1100, 0, 1)) : 0;
      const celebrationLift = celebrating && !reduce
        ? Math.pow(Math.sin(Math.PI * clamp(searchAge / 1100, 0, 1)), 2) * profile().celebrationLift : 0;
      const currentReaction = activeReaction(now);
      const petting = currentReaction === "petting" && now < pettingUntil;
      const sleepy = mood === 'sleepy', bored = mood === 'bored';
      const blend = Math.min(1, dt * (reduce ? 20 : 3.8));
      sleepBlend += ((sleepy ? 1 : 0) - sleepBlend) * blend;
      boredomBlend += ((bored ? 1 : 0) - boredomBlend) * blend;
      const wakeAge = now - wakeStart, yawnAge = now - yawnStart;
      const waking = wakeAge >= 0 && wakeAge < 950 && !reduce;
      const yawning = yawnAge >= 0 && yawnAge < 1100 && !reduce;
      // Settle the head into the chest; paws retain their existing animation path.
      const napPose = reduce || dragging ? 0 : sleepBlend;
      const napping = sleepy && !yawning && !dragging;
      // Dream only after settling into sleep, with long pauses between bubbles.
      if (!napping) {
        dreamStart = -1e9; nextDreamAt = Infinity;
      } else if (!wasNapping) {
        nextDreamAt = now + 4500;
      } else if (now >= nextDreamAt) {
        dreamStart = now;
        nextDreamAt = now + 17000 + Math.random() * 12000;
        const choices = [0, 1, 2].filter(kind => kind !== dreamKind);
        dreamKind = choices[Math.floor(Math.random() * choices.length)];
        el.dreamIcons.forEach((icon, i) => icon.setAttribute('opacity', i === dreamKind ? '1' : '0'));
      }
      wasNapping = napping;
      const dreamAge = now - dreamStart;
      const dreaming = napping && dreamAge >= 0 && dreamAge < 3600;
      const dreamFade = dreaming ? (reduce ? 1 : Math.min(1, dreamAge / 550, (3600 - dreamAge) / 650)) : 0;
      el.dream.setAttribute('opacity', dreamFade.toFixed(3));
      el.dream.setAttribute('transform', `translate(0 ${dreaming && !reduce ? -3 * Math.sin(Math.PI * dreamAge / 3600) : 0})`);
      el.drool.setAttribute('opacity', napping ? (sleepBlend * 0.85).toFixed(3) : '0');
      el.sleepEyes.setAttribute('opacity', Math.max(sleepBlend, petting ? 0.95 : 0).toFixed(3));
      // Rare delight after a successful pet, never while typing or during reduced motion.
      if (!focused && !reduce && !petting && pettingStarted > 0 && now - pettingUntil > 0 &&
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
      el.blush.setAttribute("opacity", Math.max(careHappy || manualNear ? 0.6 : 0, smile * 0.28, petting ? 0.65 : delighted ? 0.55 : 0).toFixed(3));
      if (napping) el.mouth.setAttribute('d', 'M137 164 Q150 171 163 164');
      if (yarnHappy) el.mouth.setAttribute('d', 'M137 164 Q150 175 163 164');
      if (welcoming) el.mouth.setAttribute('d', 'M138 164 Q150 175 162 164');
      if (delighted) el.mouth.setAttribute("d", "M132 163 Q150 185 168 163");
      if (celebrating) el.mouth.setAttribute('d', `M135 163 Q150 ${163 + profile().celebrationSmile} 165 163`);
      if (surprised) el.mouth.setAttribute('d', 'M145 165 a5 7 0 1 0 10 0 a5 7 0 1 0 -10 0');
      if (petting) el.mouth.setAttribute("d", "M135 165 Q150 181 165 165");
      if (yawning && !petting) {
        const open = Math.sin(Math.PI * yawnAge / 1100);
        el.mouth.setAttribute('d', `M142 167 Q150 ${167 + 20 * open} 158 167 Q150 ${164 - 5 * open} 142 167Z`);
      }
      if (careHappy) el.mouth.setAttribute('d', 'M133 163 Q150 186 167 163');
      if (manualNear) el.mouth.setAttribute('d', 'M139 164 Q150 188 161 164 Q150 156 139 164Z');
      if (caring || manualNear) el.tongue.setAttribute('opacity', '0');
      const hunting = !manualCare && !yarnRunning && !petting && !sleepy && !bored && !dragging && near && now - lastKey > 700 && !reduce && reactionPriority[activeReaction(now)] <= 1;
      reach += ((hunting ? 1 : 0) - reach) * follow;
      if (dragging) reach = 0;
      const inputBounds = peek ? input.getBoundingClientRect() : null;
      const peekX = inputBounds ? clamp(((inputBounds.left + inputBounds.width / 2 - bounds.left) / bounds.width * 300 - 150) / 180, -1, 1) : 0;
      const gazeX = (lookX * (1 - peek) + peekX * peek) * (1 - yarnWatch) + yarnAimX * yarnWatch;
      const gazeY = (lookY * (1 - peek) + peek) * (1 - yarnWatch) + yarnWatch;
      const hx = gazeX * (sleepy ? 0 : bored ? 2 : reduce ? 2 : 9) + (idleGesture === 'glance' ? idleAmount * 4 : 0), hy = gazeY * (sleepy ? 0 : reduce ? 2 : 7);
      const t = now / 1000,
        k = reduce ? 0.3 : 1;
      const breathe = Math.sin(t * (sleepy ? 1.5 : 2.1)) * (sleepy ? 0.9 : 0.6);
      const by = (breathe - celebrationLift - bob * (2.2 + speed * 2.5) + (waking ? -5 * Math.sin(Math.PI * wakeAge / 950) : 0)) * k;
      // A small parallax shift suggests a turn, while all mouth details stay attached.
      const turn = reduce || dragging || sleepy ? 0 : gazeX * 0.8;
      el.features.setAttribute('transform', `translate(${turn * 10} 0) translate(150 140) scale(${1 - Math.abs(turn) * 0.06} 1) translate(-150 -140)`);
      el.hat.setAttribute('transform', `translate(${-turn * 3} 0)`);
      el.body.setAttribute("transform", `translate(0 ${by * 0.5})${belly > 0.001 ? ` translate(150 280) scale(${1 + belly * 0.16} 1) translate(-150 -280)` : ''}`);
      el.head.setAttribute("transform", `translate(${hx} ${by + hy - welcomeLift + napPose * 10 + yarnWatch * 12}) rotate(${yarnTilt + welcomeTilt + gazeX * 3 * k + (napPose * 8) + (waking ? 5 * Math.sin(Math.PI * wakeAge / 950) : 0) + (idleGesture === 'tilt' ? idleAmount * 5 : idleGesture === 'ear' ? idleAmount * -2 : 0)} 150 175)`);


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
          clamp(py - 310, -55, 0) * catchAmount + waveLift - 30 * hoverReachStrength - (i === 1 ? yarnBat * 8 : 0) - (!reduce ? manualLift * 30 : 0);
        const x = i ? 200 : 100;
        const tapLift = pawOffset(p, now) * k;
        const wristRoll = !reduce && !dragging && p.lift ? (i ? -1 : 1) * clamp(-tapLift / p.lift, 0, 1) * 6 : 0;
        const rot = clamp(dx * 0.18 + wristRoll, -12, 12) - (i === 1 ? yarnBat * 18 : 0) + (!reduce ? (i ? -1 : 1) * manualLift * 8 : 0);
        const endX = x + dx, endY = 300 + dy;
        const arm = i ? el.armR : el.armL;
        // Tapered forearm stays attached to the shoulder and wrist at every reach.
        arm.setAttribute("d", `M${x-16} 240 C${x-26} 259 ${endX-24} ${endY-24} ${endX-21} ${endY+2} Q${endX} ${endY+14} ${endX+21} ${endY+2} C${endX+24} ${endY-24} ${x+25} 259 ${x+16} 240 Q${x} 232 ${x-16} 240Z`);
        arm.setAttribute("fill", "url(#tc-volume)");
        arm.setAttribute("stroke", "#BD793C");
        arm.setAttribute("stroke-width", "1");
        arm.setAttribute("stroke-opacity", "0");
        (i ? el.padsR : el.padsL).setAttribute("opacity", clamp((-dy - 18) / 70, 0, 0.48).toFixed(2));
        p.el.setAttribute(
          "transform",
          `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${x} 300)`,
        );
      }

      if (manualCare?.point) updateManualCare(manualCare.point.x, manualCare.point.y);
      // blink (a bit faster while typing)
      if (now > blinkAt) {
        blinkT0 = now;
        blinkAt = now + 2000 + Math.random() * 3500 - speed * 1000;
      }
      const bu = (now - blinkT0) / 140;
      const sy = bu >= 0 && bu <= 1 ? 1 - 0.9 * Math.sin(bu * Math.PI) : 1;
      const eye = `translate(${gazeX * (3 + yarnWatch * 6)} ${128 + gazeY * (2 + yarnWatch * 4)}) scale(1 ${(Math.max(0.02, (1 - sleepBlend) * (1 - boredomBlend * 0.55) * (careHappy ? 0.6 : petting ? 0.03 : surprised ? 1.3 : celebrating ? profile().celebrationEye : 1) * (surprised ? 1 : sy * welcomeBlink))).toFixed(3)}) translate(0 -128)`;
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
      setMood: devMood, setPersonality, wave, searchCompleted, queryReset, giveCare, playYarn, beginManualCare, updateManualCare, cancelManualCare,
      destroy() {
        cancelManualCare(); pendingManualCare = null;
        stopYarn();
        el.dream.setAttribute('opacity', '0');
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
        input.removeEventListener("focus", returnToSearch);
        input.removeEventListener("input", queryChanged);
        container.removeEventListener("pointerdown", attention);
      },
    };
  }
  return { mount, careIcons, yarnIcon };
})();

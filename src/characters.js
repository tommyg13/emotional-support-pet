// Built-in animated SVG characters + a renderer that also handles gif/png/lottie.
(function () {
  const CAT_CSS = `
    .cat-bob{animation:cat-bob 2.2s ease-in-out infinite;transform-origin:200px 380px}
    .cat-blink{transform-box:fill-box;transform-origin:center;animation:cat-blink 3.4s infinite}
    .cat-ear-l,.cat-ear-r{transform-box:fill-box;transform-origin:50% 100%}
    .cat-ear-l{animation:cat-twitch 4s infinite}
    .cat-ear-r{animation:cat-twitch 5.3s 1.2s infinite}
    .cat-whisk{transform-box:fill-box;transform-origin:100% 50%;animation:cat-whisk 1.8s ease-in-out infinite alternate}
    .cat-whisk.r{transform-origin:0 50%}
    @keyframes cat-bob{0%{transform:rotate(-2.5deg)}100%{transform:rotate(2.5deg)}}
    @keyframes cat-blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.07)}}
    @keyframes cat-twitch{0%,88%,100%{transform:rotate(0)}91%{transform:rotate(-14deg)}95%{transform:rotate(5deg)}}
    @keyframes cat-whisk{0%{transform:rotate(-3deg)}100%{transform:rotate(3deg)}}`;

  function cat(c) {
    const eye = (cx) => `
      <g class="cat-blink">
        <ellipse cx="${cx}" cy="180" rx="30" ry="34" fill="${c.eye}"/>
        <ellipse cx="${cx}" cy="180" rx="9" ry="26" fill="#161616"/>
        <circle cx="${cx + 9}" cy="167" r="6" fill="#fff"/>
      </g>`;
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><style>${CAT_CSS}</style>
      <g class="cat-bob">
        <ellipse cx="200" cy="375" rx="150" ry="115" fill="${c.body}"/>
        <ellipse cx="200" cy="390" rx="85" ry="85" fill="${c.belly}"/>
        <g class="cat-ear-l"><path d="M85 150 L95 28 L188 105 Z" fill="${c.body}"/><path d="M106 126 L108 62 L160 105 Z" fill="${c.pink}"/></g>
        <g class="cat-ear-r"><path d="M315 150 L305 28 L212 105 Z" fill="${c.body}"/><path d="M294 126 L292 62 L240 105 Z" fill="${c.pink}"/></g>
        <ellipse cx="200" cy="190" rx="135" ry="108" fill="${c.body}"/>
        <path d="M200 86 L200 120 M174 91 L180 118 M226 91 L220 118 M68 185 L100 190 M70 210 L102 207 M332 185 L300 190 M330 210 L298 207"
              stroke="${c.stripe}" stroke-width="9" stroke-linecap="round" fill="none"/>
        <ellipse cx="200" cy="234" rx="54" ry="38" fill="${c.belly}"/>
        ${eye(140)}${eye(260)}
        <path d="M183 214 Q200 207 217 214 Q200 238 183 214 Z" fill="${c.nose}"/>
        <path d="M200 230 Q200 250 177 252 M200 230 Q200 250 223 252" stroke="#5a2d2d" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g stroke="${c.whisker}" stroke-width="3" stroke-linecap="round" fill="none">
          <path class="cat-whisk" d="M140 226 L40 208"/><path class="cat-whisk" d="M140 240 L36 244"/>
          <path class="cat-whisk r" d="M260 226 L360 208"/><path class="cat-whisk r" d="M260 240 L364 244"/>
        </g>
      </g>
      <ellipse cx="130" cy="380" rx="44" ry="30" fill="${c.body}"/><ellipse cx="270" cy="380" rx="44" ry="30" fill="${c.body}"/>
      <path d="M116 376 v16 M130 374 v18 M144 376 v16 M256 376 v16 M270 374 v18 M284 376 v16" stroke="${c.stripe}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  const LIZ_CSS = `
    .liz-bob{animation:liz-bob 1.6s ease-in-out infinite;transform-origin:200px 400px}
    .liz-blink{transform-box:fill-box;transform-origin:center;animation:liz-blink 3s infinite}
    .liz-pupil{animation:liz-look 3.6s ease-in-out infinite}
    .liz-tongue{transform-origin:200px 285px;animation:liz-wag .7s ease-in-out infinite alternate}
    .liz-arm-l,.liz-arm-r{transform-box:fill-box;transform-origin:50% 100%}
    .liz-arm-l{animation:liz-wave 1.1s ease-in-out infinite alternate}
    .liz-arm-r{animation:liz-wave 0.8s ease-in-out infinite alternate-reverse}
    @keyframes liz-bob{0%{transform:rotate(-2deg) scaleY(1)}100%{transform:rotate(2deg) scaleY(1.02)}}
    @keyframes liz-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
    @keyframes liz-look{0%,100%{transform:translate(0,0)}30%{transform:translate(-9px,3px)}65%{transform:translate(9px,-3px)}}
    @keyframes liz-wag{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}
    @keyframes liz-wave{0%{transform:rotate(-16deg)}100%{transform:rotate(16deg)}}`;

  function lizard(c) {
    const eye = (cx) => `
      <g class="liz-blink">
        <circle cx="${cx}" cy="118" r="34" fill="#fff" stroke="${c.dark}" stroke-width="5"/>
        <g class="liz-pupil"><circle cx="${cx}" cy="120" r="15" fill="#151515"/><circle cx="${cx + 5}" cy="114" r="5" fill="#fff"/></g>
      </g>`;
    const mouth = 'M108 245 Q200 212 292 245 Q288 332 200 336 Q112 332 108 245 Z';
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><style>${LIZ_CSS}</style>
      <g class="liz-bob">
        <ellipse cx="200" cy="395" rx="135" ry="135" fill="${c.body}"/>
        <ellipse cx="200" cy="410" rx="80" ry="100" fill="${c.belly}"/>
        <g class="liz-arm-l"><ellipse cx="70" cy="330" rx="19" ry="48" transform="rotate(28 70 330)" fill="${c.body}" stroke="${c.dark}" stroke-width="4"/>
          <circle cx="52" cy="287" r="9" fill="${c.body}"/><circle cx="72" cy="283" r="9" fill="${c.body}"/></g>
        <g class="liz-arm-r"><ellipse cx="330" cy="320" rx="19" ry="50" transform="rotate(-32 330 320)" fill="${c.body}" stroke="${c.dark}" stroke-width="4"/>
          <circle cx="352" cy="272" r="9" fill="${c.body}"/><circle cx="332" cy="268" r="9" fill="${c.body}"/></g>
        <circle cx="125" cy="118" r="46" fill="${c.body}"/><circle cx="275" cy="118" r="46" fill="${c.body}"/>
        <ellipse cx="200" cy="215" rx="145" ry="105" fill="${c.body}"/>
        <g fill="${c.spot}" opacity=".55"><circle cx="165" cy="168" r="9"/><circle cx="238" cy="172" r="7"/><circle cx="205" cy="152" r="6"/><circle cx="110" cy="205" r="8"/><circle cx="292" cy="208" r="8"/></g>
        ${eye(125)}${eye(275)}
        <path d="${mouth}" fill="#7a1f3a" stroke="${c.dark}" stroke-width="6" stroke-linejoin="round"/>
        <g class="liz-tongue"><path d="M168 280 Q166 362 200 368 Q234 362 232 280 Z" fill="#ff6f9a"/><path d="M200 292 L200 345" stroke="#e0457a" stroke-width="5" stroke-linecap="round"/></g>
        <circle cx="184" cy="194" r="4.5" fill="${c.dark}"/><circle cx="216" cy="194" r="4.5" fill="${c.dark}"/>
      </g>
    </svg>`;
  }

  const catColors = {
    orange: { body: '#f0a04b', belly: '#fff1dc', stripe: '#c4721f', eye: '#9be15d', pink: '#ffb3c1', nose: '#ff8fa3', whisker: '#7a4a1c' },
    gray:   { body: '#9aa3ad', belly: '#e9edf1', stripe: '#6b7580', eye: '#ffd54a', pink: '#ffb3c1', nose: '#ff8fa3', whisker: '#4f5863' },
    black:  { body: '#2b2b33', belly: '#46464f', stripe: '#1a1a20', eye: '#ffd54a', pink: '#d98aa0', nose: '#e58fa6', whisker: '#9aa0a6' },
    white:  { body: '#f7f3ee', belly: '#ffffff', stripe: '#dccfc2', eye: '#6ec6ff', pink: '#ffc2cf', nose: '#ff9db0', whisker: '#a89a8c' },
  };
  const lizColors = {
    green:  { body: '#6fb26a', belly: '#cfe8a8', spot: '#3f7d3d', dark: '#2f6a35' },
    blue:   { body: '#5aa9e6', belly: '#d4ecff', spot: '#2f6fb0', dark: '#245a8f' },
    orange: { body: '#f08a4b', belly: '#ffe2c4', spot: '#b4521a', dark: '#9c4116' },
    purple: { body: '#a98be8', belly: '#eadfff', spot: '#6c4bb8', dark: '#553a98' },
  };

  const builtin = [];
  for (const [k, c] of Object.entries(catColors))
    builtin.push({ id: 'cat-' + k, name: k[0].toUpperCase() + k.slice(1) + ' cat', group: 'Cats', type: 'svg', svg: () => cat(c) });
  for (const [k, c] of Object.entries(lizColors))
    builtin.push({ id: 'lizard-' + k, name: k[0].toUpperCase() + k.slice(1) + ' lizard', group: 'Lizards', type: 'svg', svg: () => lizard(c) });

  function render(el, ch) {
    el.innerHTML = '';
    if (ch.type === 'svg') {
      el.innerHTML = ch.svg();
    } else if (ch.type === 'image') {
      const img = new Image();
      img.draggable = false;
      img.src = ch.url;
      el.appendChild(img);
    } else if (ch.type === 'lottie' && window.lottie) {
      window.lottie.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(ch.data)) });
    }
  }

  window.Characters = { builtin, render };
})();

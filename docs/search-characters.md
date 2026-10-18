# Search characters

`src/search-character.js` contains the predefined search companion registry and
`CharacterController`. It is separate from `src/characters.js`, which serves the
existing summon/gallery feature.

Mount with `SearchCharacters.mount(id, mode, container, options)`. Only registered
IDs and modes are accepted. The wizard cat supplies `docked` and `roaming`
factories, wrapping TypingCat and WalkingCat without rewriting their animations. The Pomeranian supplies a docked renderer and a roaming movement adapter.

Definitions include ID, name, renderer type, food/drink/toy identifiers, supported
modes and renderer factories. A future 3D character can supply its own factories;
no controller branch needs to check whether it uses SVG or 3D.

Factories return `{renderer, actions, icons}`. `renderer.destroy()` must cancel
animation, remove listeners and resolve pending movement with false. Common
movement promises resolve true on arrival and false on interruption. `runTo`
forces running while preserving other movement options, such as home bounds.
`getBounds()` supplies renderer-independent screen bounds for desktop hit tests
and bubble placement. `lookAt(point, seconds)` controls gaze.

Call `supports(action)` before offering optional actions. Unsupported actions
return false. Actions are disabled after destroy; repeated destroy is harmless.
The shared vocabulary includes sleep and wake, but these are currently automatic
inside the existing cat renderers and are not exposed as explicit actions.
Food and toy icons are supplied by the docked adapter; renderer-specific care
and search reactions retain their current cancellation and completion behavior.

This first stage keeps the current cat-specific IPC names, events, bubble text,
chase choreography and settings for compatibility. The Pomeranian is selected through Settings and supplies its own docked
and roaming factories. Future roaming characters will need the remaining cat-specific
chase and bubble policies moved into their own definitions.
Never pass user-provided paths or model URLs as character IDs.

Checks: `node --test`. Contract tests cover registry restrictions, capabilities,
care/search forwarding, run options, arrival/interruption and cleanup. Existing
cat tests continue to cover SVG reactions and dock controls.

## Pomeranian

The `pomeranian` preset uses the `Pomeranian` renderer and a `RoamingDog` desktop adapter. Choose it in
Settings → Search character. This choice is separate from the summon/gallery
character. Switching closes any roaming companion and remounts the dock renderer.
The main process validates the choice and authorizes roaming only for the two predefined companions.

The source GLB came from the user's Downloads archive
`pomeranian-dog-standing-pose-realistic-toy-breed-character/pomeranian dog 001 glb.rar`.
Its textures are embedded. The unmodified source had no skeleton, morph targets
or animation clips. The app now uses a seventeen-bone rig with Curious,
HeadTilt, TailWag, Happy, Walk, Trot, Sit and Sleep clips, plus bone, water bowl and heart overlays,
and a small 3D play ball.
Typing occasionally triggers a short glance toward the search input; food, water,
play and completed searches trigger Happy. It walks and trots with four two-joint leg chains, and can sit or lie down to rest; a moving jaw and closed eyelids are still pending. Manual water and bone delivery
uses the shared care controls; the cat's richer controls remain intact.

All modules and model assets live under src and are included by the existing
packaging rule. Three.js 0.180.0 and its MIT license are vendored under
`src/vendor/three`; run `npm run vendor:three` to regenerate that subset from the
pinned package. No CDN or model URL from settings is used. The model is about 4.2 MB with embedded 1024-pixel color and normal textures, plus about 2 MB of renderer modules before packaging compression. The editable source retains its original 4096-pixel textures.

`previews/pomeranian-studio.html` is a standalone interactive preview. The renderer
normalizes model bounds, uses transparent WebGL with a capped pixel ratio, and
only redraws changed frames at up to 30 fps. Reduced motion avoids bouncing and
rolling, while retaining item feedback. Cleanup releases skinning resources, animation bindings, textures, geometries,
materials, the WebGL context, input listeners and the resize observer. Loading
failures show a Retry button; switching back to the cat through Settings is also available.

## Editable rig

`art/pomeranian/pomeranian-rig.blend` is the editable source with packed textures,
a Root/Body/Head/Tail skeleton plus four upper/lower/paw chains and normalized vertex weights. It contains all six reaction and gait actions. The original Downloads archives are untouched.
The art directory is outside src so the Blender source is not packaged in the
app. `art/pomeranian/rig-report.json` records the inspected weight counts and
maximum edge stretch at key poses. Tail movement is intentionally small because
the tail is fused to the body mesh. `gait-report.json` separately records leg weights and inspected walk/trot deformation bounds.

To rebuild from the original extracted Blender file:

```
/Applications/Blender.app/Contents/MacOS/Blender --background "/path/to/pomeranian dog 001.blend" --python scripts/create-pomeranian-rig.py -- /path/to/output
```

The script creates the initial four-bone Blender source, GLB, deformation report and pose renders.
Inspect the renders before replacing the packaged model. It does not overwrite
the input file. The preview has separate head-turn, tilt and wag buttons, and
front/side/back views to inspect the tail. Reduced motion keeps the skeleton at
rest and shows static item feedback instead. The roaming adapter moves directly to destinations when reduced motion is enabled.

## Live head gaze

The puppy follows window-local pointer positions with its Head bone, rather than
rotating the entire model. Yaw and pitch are bounded and eased. Search focus and
typing occasionally override the pointer with a glance toward the input, then
return to the pointer or neutral pose. Reactions take priority over tracking;
TailWag can run alongside gaze. The unmodified animation quaternion is restored
before each additive gaze update, preventing cumulative rotation drift.

Pointer leave and window blur reset the pointer target. Reduced motion disables
gaze movement. Gaze listeners are removed on destroy. `npm run check:pomeranian`
runs an optional desktop Electron check using rendered pixels to verify visible
head movement, stationary paws, stable gaze, blur reset, search glances and
cleanup. `node --test` remains usable without a desktop session.

Sitting remains unsupported. Separate prototype deformations distorted the
fused rear fur and were not installed in the app or committed as usable assets.

## Mouth delivery

The puppy implements beginManualCare/updateManualCare/cancelManualCare. Its mouth
and mouth-right anchors are children of the animated Head bone. Their projected
positions drive the delivery radius and sprite location/rotation, including at
the dock's minimum width. A small target ring appears during a manual carry.
Both ordinary clicks and manual deliveries hold the bone or bowl near the mouth;
this is an attachment effect, not a moving-jaw animation.

Manual completion fires one legacy cat-manual-care-complete event after the item
finishes. It includes a non-repeating personality quote, displayed by the shared
dock bubble. Ordinary clicks emit no completion quote. Releasing a distant carry,
typing, starting another reaction, losing focus, switching characters or destroying
the renderer cancels pending delivery appropriately. Cancellation also tells the
shared UI to drop its carried sprite. Delivery's endCarry callback is safe: the
pending manual state is cleared before dispatching the delivered event, so it
does not cancel the attached item. Quote timers are cleared during cleanup.

`npm run check:pomeranian-care` verifies real long-press pointer capture, mouth
anchoring, completion-only quotes, interruption, cleanup and reduced motion in an
Electron desktop session. The standalone preview supports the same long press
and drag gesture as the actual dock.

## Ball play

The puppy's play action starts a bounded 3D ball sequence. A striped sphere rolls
in toward the front paws, gives a small contact bounce, then rolls away. Head
gaze follows its projected position; the existing TailWag clip supplies the
finale. This docked play sequence does not animate a paw batting the ball. The ball,
stripes and ground shadow are local Three.js primitives and require no new asset.

CompanionBall.sample in src/companion-ball.js describes the continuous stage path
independently of the renderer. Personality controls session length and selects
one of three completion replies, avoiding an immediate repeat. Repeated play
requests are ignored while active. A reply is emitted once through the existing
cat-yarn-complete event only after the session finishes. Feeding, typing, other
reactions, blur, hiding the window and destroying the character cancel it. A gap
over one second between rendered frames also cancels, so a stalled or suspended
session cannot report an unseen successful completion.

Reduced motion shows a stationary ball briefly and skips skeletal motion. The
ball and shadow stop rendering when idle; their GPU resources are released with
the character. npm run check:pomeranian-ball checks offline playback, repeat
suppression, completion-only replies, interruptions, cleanup, reduced motion and
stalled-frame handling. The normal node test suite covers bounded positions,
phase continuity, reduced motion and invalid timing inputs.

## Quiet idle and return reactions

CompanionIdle (src/companion-idle.js) is a clock-injected timing policy. Calm,
Playful and Sleepy companions first glance after roughly 30, 20 and 45 seconds of
inactivity; later glances are spaced roughly 60, 45 and 90 seconds apart, with
small timing variation. Glances alternate existing head-tilt and looking clips.
They never count as human activity or produce automatic chatter.

A real pointer/focus/input return after at least 90 seconds may trigger Happy
and a personality greeting. Automatic greetings have a two-minute cooldown and
never preempt care, play, another reaction or an existing reply. The generic
companion-bubble event displays the greeting through the existing dock bubble.
Typing stops the greeting motion and resumes search gaze, while its message
remains briefly visible. Any new care/play action or blur clears it normally.

Pointer activity interrupts idle motion. Hidden windows and busy interactions
postpone glances; reduced motion disables them. Reduced-motion welcome replies
remain available without moving the skeleton. Idle motion does not reset away
time, so the puppy can still greet a returning person after looking around on
its own. Idle policies and their focus listeners are destroyed with the renderer.

The preview provides Idle glance and Welcome back buttons for immediate testing.
npm run check:pomeranian-idle uses a virtual policy clock with real animation
timing to test automatic timing, greeting replies, typing priority, care/play
protection, cleanup and reduced motion. The normal node tests cover cadence,
cooldown, priority and independent per-character policy state.

### Companion names

Settings shows the selected companion’s name. The cat uses the existing `catName` setting; the puppy uses `puppyName`. Both default to empty and normalize to 24 Unicode characters. Switching preserves both names, and saving temporarily disables switching to avoid saving a name against the wrong companion. The break reminder keeps the cat’s name. Names appear as plain text in care labels and the puppy’s welcome messages.

### Developer reaction controls

Developer settings includes puppy buttons for an idle glance, welcome greeting, water, bone and ball. Select Pomeranian and enable the dock first. The controls skip idle/away delays while respecting normal busy-state and reduced-motion rules. Existing cat mood and wave controls remain available. Main-process routing accepts only predefined actions from the Settings window in developer mode, and never switches the selected pet. `npm run check:pomeranian-dev` checks the real preload listener and dock, including cat isolation.

### Loading and graphics recovery

The puppy exposes loading/ready/error states and `aria-busy`. A slow load changes the status after 15 seconds. Failed asset loads and lost WebGL contexts stop interactions and animation, clear pending care/play replies, and show a keyboard-accessible Retry button. Retry replaces only the current renderer; names, personality, and the chosen character remain unchanged. Switching to the cat remains available. The standalone preview supports the same retry event. `npm run check:pomeranian-recovery` blocks the local model request, retries it, loses an actual WebGL context, and checks recovery and switching through the real preload and dock.

## Pomeranian desktop roaming

Both predefined companions now support the shared roaming window. `roaming-dog.js` wraps the offline puppy renderer in a bounded desktop position controller, with cancellable walk/run arrival promises, smooth model heading, four-leg animation, gradual acceleration/deceleration, explicit jump, speed control and pointer-captured pickup/drop. Reduced motion moves directly to the destination and skips bounce/jump/swing. Sit is available for the puppy; it also settles into a lying pose after longer inactivity. Travel and ball chasing no longer add automatic whole-body hops.

The paw/Home button and `/walk`/`/home` commands work for either pet. Desktop-click navigation, return-home coordinates, drag bubbles and typing curiosity share the existing manager. While the puppy roams, its toy command displays a ball and chases random destinations. The original SVG cat keeps yarn, sitting and sleeping behavior. The roaming puppy supports graphics-error retry in place and can return home immediately if graphics fail. Closing the dock or changing the selected companion closes the roaming surface as before.

`npm run check:pomeranian-roaming` runs both actual renderer pages with the real preload and desktop manager. It tests movement and cancellation, pointer drag/drop, ball chase, home completion, reduced motion, coordinate bounds, GPU-loss retry, cleanup, and original cat movement. The desktop-click source is injected in this check; real macOS Accessibility permission and multi-monitor placement still need a manual desktop check.

## Natural movement and optimized asset

To extend the initial rig, run `scripts/add-pomeranian-gait.py` with Blender against the **four-bone** source generated by `create-pomeranian-rig.py`, passing a separate output folder after `--`. It rejects an already extended rig. The script preserves 4K images in its editable blend, exports 1K images only to the GLB, and renders both-side gait inspection frames. The original Downloads model remains unchanged. No geometry decimation or runtime compression decoder is required; the 50,000-triangle silhouette is preserved. Texture memory is roughly one sixteenth of the original at the same format/mipmap settings.

Each leg has an upper, lower and paw bone with smoothly blended coat weights. A two-segment solver generates paw placement, a four-beat Walk with a longer planted phase, and a diagonal Trot. Loops meet at identical poses. Walk/trot are isolated in a separate mixer with only leg and Body weight-shift tracks; reaction clips bind only Head and Tail so reactions cannot freeze the legs. Gait rate follows actual desktop velocity and fades back to rest over about 180 milliseconds. Starts and stops use bounded acceleration and distance-based braking. This is a conservative procedural gait on the fused toy mesh; it does not provide jaw articulation, terrain adaptation or a full anatomical rig. Seated and lying poses are described below.

The camera remains fixed during travel. The model turns smoothly toward the screen travel vector using the shortest yaw path, including diagonal directions. Walking suppresses pointer-driven head glances. The preview includes Walk cycle, Trot cycle, Stand, Face left and Face right buttons. `npm run check:pomeranian-gait` uses rendered pixels to verify opposite facing directions, changing paw positions, a steady torso, a stable standing pose and cleanup. Asset tests validate the seventeen-bone skin, normalized weights, looping leg rotations, compact file size and texture dimensions.

### Movement refinement (stage one)

Separate paw bones keep the planted paw controls level while the upper/lower joints articulate. A three-dimensional leg solver compensates a gentle Body roll (0.65 degrees walking; 0.35 degrees trotting) so the shoulders and hips shift without lifting the planted controls. The shorter strides reduce coat deformation: the recorded peak edge stretch is 1.731 for Walk and 2.066 for Trot, down from 1.939 and 2.444. The report measures planted control height and tilt at exported cycle frames; it is not a terrain-aware foot-lock system.

Turning is bounded to 4.2 radians/second, and travel slows for large heading errors. A sharp reversal briefly steps in place before translating, rather than sliding sideways while facing the old direction. Gait playback now reaches lower rates during deceleration, and Walk/Trot transitions preserve normalized cycle phase. Existing reduced-motion, drag, return-home and cancellation behavior remain intact. The movement stage itself does not add rest poses; the next stage below adds those separately. Pickup leg poses, facial animation and jaw/paw interaction clips remain pending.

## Seated and sleeping postures (stage two)

`add-pomeranian-rest.py` extends the sixteen-bone gait source with a Hips control, Sit and Sleep clips, and matching compressed-fur corrective morphs. Rebuild in separate folders: original source → `create-pomeranian-rig.py` → `add-pomeranian-gait.py` → `add-pomeranian-rest.py`. The last script rejects an already extended rig. The blend retains full-resolution textures; the exported GLB stays below 5 MiB. Each fur corrective is merged into its skeletal clip so it cannot remain active after waking. `rest-report.json` records endpoint floor clearance and deformation bounds.

Postures blend to held endpoints over about 700 ms and wake over about 450 ms. The torso and head lower into a relaxed lying pose for sleep; eyes remain open until the facial-animation stage. Static poses do not keep drawing continuously. Reduced motion switches poses without transition animation. Input, focus, moving, return-home, picking up, jumping, play and food wake the puppy. Deferred play/care waits for waking; cancellation or destruction invalidates pending callbacks.

`CompanionRest` owns idle timing: Calm sits after 45 seconds and sleeps after 120; Playful uses 60/180, Sleepy 30/90. Care, play, movement and hidden windows postpone automatic rest. Manual sleep cannot be replaced by the earlier automatic sit stage. The dock’s roaming Sit button works for both characters, and Settings → Developer includes puppy Sit, Sleep and Wake tests. The preview has the same controls.

`npm run check:pomeranian-rest` checks rendered lowering, automatic posture progression with an injected clock, wake-before-play/care, cancelled wake cleanup, and reduced motion. Normal tests cover policy timing, busy/hidden guards, explicit poses, skin integrity and the corrective channels. Roaming integration checks verify that the original SVG cat still moves and that the puppy can return home and be picked up after sitting.

# Search characters

`src/search-character.js` contains the predefined search companion registry and
`CharacterController`. This registry is shared by the search dock, desktop roaming, and the larger support-moment scene. The legacy summon/gallery renderer has been removed.

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
Settings → Search Pet → Search character. The same selection is used by the heart’s support scene. Switching closes any roaming companion and remounts the dock renderer.
The main process validates the choice and authorizes roaming only for the two predefined companions.

The source GLB came from the user's Downloads archive
`pomeranian-dog-standing-pose-realistic-toy-breed-character/pomeranian dog 001 glb.rar`.
Its textures are embedded. The unmodified source had no skeleton, morph targets
or animation clips. The app now uses a seventeen-bone rig with Curious,
HeadTilt, TailWag, Happy, Walk, Trot, Sit, Sleep, Pickup and Land clips, plus bone, water bowl and heart overlays,
and a small 3D play ball.
Typing occasionally triggers a short glance toward the search input; food, water,
play and completed searches trigger Happy. It walks and trots with four two-joint leg chains, and can sit or lie down to rest; the eyes blink and close for sleep; jaw articulation is still pending. Manual water and bone delivery
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

Sitting and sleeping now use the corrected rest poses described below.

## Mouth delivery

The puppy implements beginManualCare/updateManualCare/cancelManualCare. Its mouth
and mouth-right anchors are children of the animated Head bone. Their projected
positions drive the delivery radius and sprite location/rotation, including at
the dock's minimum width. A small target ring appears during a manual carry.
Both ordinary clicks and manual deliveries hold the bone or bowl near the mouth;
localized lower-muzzle chewing and tongue lapping now accompany the attachment.

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
finale. A front-paw push now meets the ball before it rolls away. The ball,
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

Turning is bounded to 4.2 radians/second, and travel slows for large heading errors. A sharp reversal briefly steps in place before translating, rather than sliding sideways while facing the old direction. Gait playback now reaches lower rates during deceleration, and Walk/Trot transitions preserve normalized cycle phase. Existing reduced-motion, drag, return-home and cancellation behavior remain intact. The movement stage itself does not add rest poses; the next stage below adds those separately. Pickup leg poses are added in stage three below. Facial rest motion is added in stage four below; feeding and paw contact are described in stage five below.

## Seated and sleeping postures (stage two)

`add-pomeranian-rest.py` extends the sixteen-bone gait source with a Hips control, Sit and Sleep clips, and matching compressed-fur corrective morphs. Rebuild in separate folders: original source → `create-pomeranian-rig.py` → `add-pomeranian-gait.py` → `add-pomeranian-rest.py`. The last script rejects an already extended rig. The blend retains full-resolution textures; the exported GLB stays below 5 MiB. Each fur corrective is merged into its skeletal clip so it cannot remain active after waking. `rest-report.json` records endpoint floor clearance and deformation bounds.

Postures blend to held endpoints over about 700 ms and wake over about 450 ms. The torso and head lower into a relaxed lying pose for sleep; the eyes now close through the independent facial morph added in stage four. Still poses skip rendering unless another visible motion needs a frame. Reduced motion switches poses without transition animation. Input, focus, moving, return-home, picking up, jumping, play and food wake the puppy. Deferred play/care waits for waking; cancellation or destruction invalidates pending callbacks.

`CompanionRest` owns idle timing: Calm sits after 45 seconds and sleeps after 120; Playful uses 60/180, Sleepy 30/90. Care, play, movement and hidden windows postpone automatic rest. Manual sleep cannot be replaced by the earlier automatic sit stage. The dock’s roaming Sit button works for both characters, and Settings → Developer includes puppy Sit, Sleep and Wake tests. The preview has the same controls.

`npm run check:pomeranian-rest` checks rendered lowering, automatic posture progression with an injected clock, wake-before-play/care, cancelled wake cleanup, and reduced motion. Normal tests cover policy timing, busy/hidden guards, explicit poses, skin integrity and the corrective channels. Roaming integration checks verify that the original SVG cat still moves and that the puppy can return home and be picked up after sitting.

## Pickup and landing (stage three)

`add-pomeranian-pickup.py` extends the seventeen-bone rest-stage blend with Pickup and Land actions, without changing vertex weights, geometry or texture resolution. Pickup relaxes all four leg chains and angles the paws down; Land briefly lowers the Body while solving the legs to keep the paws planted, then returns to the original standing transforms. The GLB stays below 5 MiB and the editable blend retains 4K textures. `pickup-report.json` records the inspected endpoint deformation: 1.698 peak edge stretch for Pickup and 1.292 for Land. Negative Pickup Z is intentional because hanging paws extend below the standing baseline; the Land pose remains on the floor.

The roaming adapter enters Pickup only after the pointer moves more than five pixels. A press/release without movement keeps click-to-home behavior and does not land. A sleeping puppy wakes first; releasing before waking completes invalidates the queued pickup. Normal drop blends into the one-shot landing clip, while blur, pointer cancellation, hiding, destruction and failed graphics cancel without landing. Starting another action interrupts landing safely. Pickup/landing postpones automatic resting and does not alter the stored name or personality.

`CompanionSwing` applies a bounded damped spring to pointer movement. Its pivot follows the approximate neck position for the facing direction, and it settles gently after release. Reduced motion disables swing and landing motion while keeping the static relaxed leg pose. Static held poses stop rendering once their blend completes.

The standalone preview has Pickup pose and Set down buttons. `npm run check:pomeranian-pickup` checks rendered leg changes, landing/rest recovery, cancelled pickup during wake, actual captured pointer dragging, quick-click home, blur cancellation, and reduced motion. Unit tests check swing bounds, frame-rate consistency, settling and reduced motion; asset checks verify landing loop endpoints and deformation limits.

## Blinking and resting breath (stage four)

`add-pomeranian-life.py` extends the pickup-stage source with independent Blink and Breath shape keys. The sculpted face is asymmetric, so the two eye regions use separately inspected centers. The eye shape compresses the textured eye surface and surrounding lids on the skinned mesh; it follows the Head bone without an overlay. The chest shape affects only the middle coat, leaving the paws and head geometry unchanged. `life-report.json` records the regions and a maximum chest displacement of about 0.0051 source units. The editable blend retains full-resolution images; the exported GLB remains below 5 MiB. Sparse facial deltas are retained, while imperceptible Breath normal deltas and their unused storage are removed.

`CompanionLife` uses an injected clock and no timers. Personality changes the quiet blink interval (roughly 3.5–9.5 seconds across profiles), blink duration (170–240 ms), and breathing period (3.8–5.8 seconds). Sleeping holds the eyes closed; waking opens them smoothly. Manual Blink ignores busy or sleeping states. Care, play, locomotion and pickup suppress spontaneous facial motion without replacing their skeletal actions. Hidden surfaces reset pending blinks so they never replay a backlog.

Facial weights are applied after skeletal and corrective-morph animation, so a held rest clip cannot overwrite the eyelids or chest. Resting breath redraws at up to 10 fps; blinks retain the renderer’s 30 fps limit. The hidden docked puppy pauses drawing, idle posture changes and facial sampling while its roaming counterpart is visible. Reduced motion disables blinking and breathing, retaining static closed sleep eyes and immediate reopening. Destruction removes the policy and all mesh references along with existing GPU cleanup.

The preview and Settings → Developer include Blink. Sleep and Stand / wake exercise the closed-eye transitions. `npm run check:pomeranian-life` verifies rendered blink/reopen, visible but subtle chest movement, unchanged paw pixels, closed sleep eyes, waking, hidden-surface suspension, cleanup and reduced motion. Clock-policy tests cover scheduling, interruption, bounds and resuming without blink bursts. Exact-pixel tests for independent head/gait/pickup behavior inject a quiet face policy, while the new check covers their facial counterpart.

## Feeding and paw contact (stage five)

`add-pomeranian-care.py` extends the life-stage source with Chew and Lap shape keys. Both affect only the lower muzzle and tongue, below the nose, with displacement below 0.01 source units. This is a restrained approximation on the fused sculpt, rather than an anatomical jaw or tongue rig. The editable blend retains its packed 4K textures; the runtime GLB remains below 5 MiB. `care-report.json` records affected vertices and maximum displacement.

`CompanionInteraction` supplies bounded chewing/lapping cycles and a small head nod during the existing 1500 ms delivery. Both click and manual feeding animate; only completed manual feeding emits its existing quote. Shapes reset on completion or interruption. Reduced motion leaves the mouth still.

Docked ball play uses three existing left-front leg bones for a bounded reach and return. The target is computed from the posed paw in world space, so it follows the current heading. The ball releases at the strike (34% of the session), then the paw returns to rest. These offsets are reset before other mixers and on cancellation. The desktop roaming toy chase still uses its existing arrival/look behavior; this stage refines the separate 3D ball sequence.

`npm run check:pomeranian-interaction` checks the exported motion in Electron and measures paw-to-ball proximity. Unit checks cover timing envelopes, contact-path continuity, and mouth-region isolation; existing care and ball checks cover completion, interruption and reduced motion.

## Bamboo panda

The predefined `panda` character uses `src/panda.js` and the approved Cute-v2 model. Settings → Search offers Bamboo panda and stores a separate normalized `pandaName`. A restricted `panda-name` preload listener updates the dock. The cat and puppy retain their existing renderers and movement capabilities. Panda supports docked and roaming modes; the walk/home toggle and `/walk` use the shared desktop manager. Settings → Developer includes panda blink, doze/wake, care, leaf play, idle and welcome tests.

The GLB is about 2.4 MiB, with 67,522 triangles, 13 bones, material-only colors, and no network assets. Ten eye meshes retain matching Blink shapes. SeatedIdle is a loop, Nibble is the short feeding clip, and Sleep lowers the head into a seated doze. The roaming stage below adds standing and a two-foot toy-style waddle. Sleep remains a seated doze; fur and lying poses are not included. The bamboo prop has its own bone and can be hidden for drinking and sleeping.

The renderer reuses CompanionLife/Rest/Idle policies. It bounds head gaze toward the cursor or active search input; reduced motion pauses clip motion and blinking, retaining closed eyes for sleep. Quiet awake motion renders at up to 10 fps, with up to 30 fps for blinks and interactions. CSS-hidden/document-hidden docks stop rendering and cancel care/play/quotes. Graphics errors show Retry; switching/destroying clears listeners, timers, animation mixers, skinned meshes and WebGL resources.

Water and bamboo support click and long-press mouth delivery. Snack plays the held bamboo/nibbling sequence; water hides bamboo and attaches the bowl near the Head anchor. Only a completed manual delivery produces a personality reply. Leaf play is a small docked flutter/look sequence with a completion reply. Typing, blur, hiding, replacement and destruction cancel unfinished interactions.

Editable source is `art/panda/panda-rig.blend`; `rig-report.json` records export metadata. `scripts/create-panda.py -- /private/tmp/panda-approved` (run in Blender) reproduces the approved appearance. Open that generated blend and run `scripts/prepare-panda.py -- /private/tmp/panda-prepared` in Blender to add Blink shapes and Sleep, then copy the resulting GLB into `src/assets/panda/`. The original user-approved Documents files are preserved; an additional Panda-Electron-Rig.blend is saved beside them.

`npm run check:panda` exercises the actual dock/preload with network requests blocked: selection, developer sleep, waking while typing, blink, both dock widths, water/snack delivery, completion-only replies, interruptions, leaf play, all three character mounts, graphics loss/retry, reduced motion and cleanup. `previews/panda-studio.html` provides a larger standalone preview. Unit coverage validates the asset, registry contract, independent name and developer-message authorization. Physical multi-display and Windows GPU behavior still require testing on those systems.

### Panda roaming and movement

`scripts/add-panda-motion.py` extends the seated source with Stand, Sit, Walk, Run, RoamSleep, Pickup and Land. Feet rotate their pads toward the floor and move under the body for standing; Walk/Run use alternating planted and lifted phases with a small body weight shift. Stride rate follows desktop velocity. `motion-report.json` records foot height: the gait and landing stay at or above zero, while sit/stand transitions preserve the original seated pad baseline of -0.025 source units. Pickup intentionally lets the feet hang lower. The face and approved seated appearance are unchanged.

The shared `RoamingDog` adapter now accepts an internal renderer profile; Pomeranian remains its default and panda passes Panda with roaming enabled. Both reuse acceleration, bounded heading changes, screen clamps, arrival/cancellation promises, drag capture, damped swing, click-to-home, graphics retry and cleanup. Panda wakes/stands before travel or pickup; a quick drop invalidates a pending pickup. Land settles into standing. Idle policies sit at 45/60/30 seconds and doze at 120/180/90 seconds for calm/playful/sleepy. Automatic sitting preserves the original idle clock.

The desktop toy is the panda's leaf. Existing typing curiosity, personality bubbles, speed, jump, sit, desktop click targets and running-home controls are available. Head/body yaw follows travel; the original cat and puppy paths are preserved. The preview offers standing mode, walk/run, facing, pickup and set-down controls. `check:panda-motion` verifies rendered poses, gait, rest timing and pending-action cleanup. `check:panda-roaming` exercises the actual native window/preload/manager, including drag/drop, wake-before-walk, leaf chase, reduced motion, context loss/retry, simulated negative display origin and disconnection.

To reproduce motion, run the motion script in Blender on the prepared seated blend from `prepare-panda.py`; copy its GLB and reports into the asset/art folders. The prepared editable source and the additional Documents Panda-Electron-Rig.blend now contain all ten clips.

## Companion activities

The star button beside the dock opens Focus buddy, Hide & peek, and Bring a gift. Focus presets are 5/15/25/45 minutes; `/focus N` accepts integer minutes from 1 to 120, with `/focus pause`, `/focus resume`, and `/focus stop`. Enter and the search arrow recognize these commands before search/AI submission. `/gift`, `/hide` and `/peek` are shortcuts. Hide/peek is available while docked; typing reveals the head for about 3.2 seconds, then it hides again. Character switching and undocking reveal the character and clear transient activity visuals.

Focus is a local, in-memory wall-clock timer. Pause preserves remaining time; cancellation never celebrates. An overdue session completes once after computer sleep; hidden windows defer the visual celebration until visible. Sessions continue across companion switches/undocking within the open dock, but close/restart of the dock/app discards them. No system notifications, network calls or persisted focus history are added.

Gifts bring an envelope and one of three personality notes/challenges without an immediate repeat. Dropping a file on a docked or roaming character produces a brief inspect/hug/sniff visual according to calm/playful/sleepy personality. The presenter uses existing character actions and outer visual transforms without touching movement position. Only file metadata is classified; no file path is requested, no content is read, and no file is opened, uploaded, saved, copied or moved. Drops outside the pet do not trigger reactions, and default file/link navigation is prevented. Actual Finder/Explorer drag routing on transparent roaming windows still needs a physical desktop check; synthetic Electron drop events exercise the handler.

`companion-activities-core.js` owns testable timing and personality text; `companion-activities.js` owns presentation, keyboard/menu controls and drop listeners. Styles respect reduced motion. The preload/desktop manager relays only focus-start, focus-complete, focus-cancel and gift from the authorized dock to the active roaming window, refusing requests while held or returning home. Pending native presentation is invalidated by newer activity messages. Timers, listeners and transient nodes are removed on unload.

`npm run check:activities` tests the real dock at both widths, timer completion/pause/cancel, commands without search submission, all three companions, hide/peek, gifts, synthetic metadata-only drops, Escape, reduced motion and cleanup. The roaming panda check also covers native activity relay/cancellation and file drops. Unit coverage checks long clock jumps, no repeated completion, invalid durations, paused time, privacy and relay authorization.

## Pack away search

Activities → Pack away search first removes care items, walks the companion to the edge, and lets the pet dive into a temporary sack with a small turn and shrink. Only after the pet is inside does the search fold into the sack, before `dock-stow.js` shrinks the native dock to a 72×72 transparent window with a restore paw. The previous expanded width is retained in memory, and compact moves/resize-end events cannot overwrite saved dock dimensions or position. Clicking the paw, pressing Escape/Enter/Space in the compact window, or using the existing global search shortcut restores the dock. Restore clamps to the current display work area and uses the current AI-panel height without discarding chat history. Character switching cancels a pending push; renderer reload receives compact state through an authorized handshake. Undocked companions must come home before packing away search.

`dock-stow-ui.js` owns the sack presentation and recovery button. The 3D companions reuse their skeletal walking/heading controls; the SVG cat temporarily uses its roaming renderer inside dock bounds. These temporary poses and actors are cleaned up on completion, cancellation or character changes. During restore, the search and care items return first, followed by a vertical pet jump without rotation. A completed unpack shows a short random personality message; interruption skips it, and existing activity/care messages take priority. Bubbles expire or clear on typing and interaction. Reduced motion skips staging animation. Hidden dock renderers pause through their existing CSS visibility checks. Focus countdowns continue while compact, with completion held until the dock has restored. A focus shortcut or Escape cancels pending push staging. The compact flag is not persisted across app restarts. No other application window is resized.

`check:dock-stow` exercises the real native window with all companions and both dock widths, exact restoration, AI-panel changes while compact, renderer reload, shortcut-style native restoration, Escape/reduced motion and deferred focus completion. Unit checks cover sender validation, idempotence, current panel height, roaming exclusion and negative display origins.

## Support moments

The heart, its menu, Ctrl/Cmd + Shift + H, and Settings → Moments open `support-moment.html`. `support-moment-window.js` creates a small, focusable, closable window inside the heart’s display work area. It waits for an authorized renderer-ready handshake before showing the selected pet. Heart/settings requests and scene close events validate their sender. Reopening an active scene from the heart focuses it without restarting a session; an explicit settings choice starts that mode. Closing destroys the window and its GPU surface. A support scene does not change the dock, compact state, roaming pet, or persistent selection.

`support-moment-core.js` provides a clock-based session: three 4-second inhale / 6-second exhale cycles, a 6.5-second personality encouragement, or a 20-second break. Sessions start on demand, support pause/resume, cancel when switching modes, and complete only once. Hidden scenes pause automatically. Text invites the user to follow their own pace. Reduced motion removes the expanding ring and pet scale.

`support-moment-ui.js` mounts the existing predefined dock renderer at a larger size, applies that companion’s name and personality, and destroys it on close or replacement. Loading failures have a retry action. Escape and the close button work while loading too. All text is local and names use textContent. There is no chat, file access, or network dependency in the scene.

The former character registry, gallery assets and Lottie dependency are removed. The still-used stretch reminder image lives at `src/assets/stretch-cat.webp`; previously imported files in user data are never deleted. `npm run check:support` covers real Electron rendering for every pet and activity, pause/completion/cancellation, settings entry, cleanup, reduced motion, and compact display layout.

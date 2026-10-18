# Search characters

`src/search-character.js` contains the predefined search companion registry and
`CharacterController`. It is separate from `src/characters.js`, which serves the
existing summon/gallery feature.

Mount with `SearchCharacters.mount(id, mode, container, options)`. Only registered
IDs and modes are accepted. The wizard cat supplies `docked` and `roaming`
factories, wrapping TypingCat and WalkingCat without rewriting their animations.

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
factory. Future roaming characters will need the remaining cat-specific
chase and bubble policies moved into their own definitions.
Never pass user-provided paths or model URLs as character IDs.

Checks: `node --test`. Contract tests cover registry restrictions, capabilities,
care/search forwarding, run options, arrival/interruption and cleanup. Existing
cat tests continue to cover SVG reactions and dock controls.

## Pomeranian

The `pomeranian` preset uses the docked-only `Pomeranian` renderer. Choose it in
Settings → Search character. This choice is separate from the summon/gallery
character. Switching closes any roaming cat and remounts the dock renderer.
The main process validates the choice and rejects puppy roaming requests.

The source GLB came from the user's Downloads archive
`pomeranian-dog-standing-pose-realistic-toy-breed-character/pomeranian dog 001 glb.rar`.
Its textures are embedded. The unmodified source had no skeleton, morph targets
or animation clips. The app now uses a conservative four-bone rig with Curious,
HeadTilt, TailWag and Happy clips, plus bone, water bowl, ball and heart overlays.
Typing occasionally triggers a short glance toward the search input; food, water,
play and completed searches trigger Happy. It cannot walk, sit or eat with a moving mouth. Manual delivery is unsupported. The cat's richer controls remain intact.

All modules and model assets live under src and are included by the existing
packaging rule. Three.js 0.180.0 and its MIT license are vendored under
`src/vendor/three`; run `npm run vendor:three` to regenerate that subset from the
pinned package. No CDN or model URL from settings is used. This adds about 30 MB
for the model, plus about 2 MB of renderer modules before packaging compression.

`previews/pomeranian-studio.html` is a standalone interactive preview. The renderer
normalizes model bounds, uses transparent WebGL with a capped pixel ratio, and
only redraws changed frames at up to 30 fps. Reduced motion avoids bouncing and
rolling, while retaining item feedback. Cleanup releases skinning resources, animation bindings, textures, geometries,
materials, the WebGL context, input listeners and the resize observer. Loading
failures show a message; switch back to the cat through Settings to recover.

## Editable rig

`art/pomeranian/pomeranian-rig.blend` is the editable source with packed textures,
a Root/Body/Head/Tail skeleton and normalized vertex weights. Happy is selected
on the timeline, ready to play. The original Downloads archives are untouched.
The art directory is outside src so the Blender source is not packaged in the
app. `art/pomeranian/rig-report.json` records the inspected weight counts and
maximum edge stretch at key poses. Tail movement is intentionally small because
the tail is fused to the body mesh; this is a first-pass rig, not a full gait rig.

To rebuild from the original extracted Blender file:

```
/Applications/Blender.app/Contents/MacOS/Blender --background "/path/to/pomeranian dog 001.blend" --python scripts/create-pomeranian-rig.py -- /path/to/output
```

The script creates a new Blender source, GLB, deformation report and pose renders.
Inspect the renders before replacing the packaged model. It does not overwrite
the input file. The preview has separate head-turn, tilt and wag buttons, and
front/side/back views to inspect the tail. Reduced motion keeps the skeleton at
rest and shows static item feedback instead. Unsupported roaming remains blocked.

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

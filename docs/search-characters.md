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
chase choreography and settings for compatibility. There is no character picker
or dog renderer yet. Before adding a second character, migrate these remaining
cat-specific UI policies, define its capabilities and hide unavailable controls.
Never pass user-provided paths or model URLs as character IDs.

Checks: `node --test`. Contract tests cover registry restrictions, capabilities,
care/search forwarding, run options, arrival/interruption and cleanup. Existing
cat tests continue to cover SVG reactions and dock controls.

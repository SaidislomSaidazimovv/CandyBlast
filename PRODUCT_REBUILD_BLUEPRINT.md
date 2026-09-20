# Candy Blast product rebuild blueprint

Updated: 2026-09-20. This document defines the target product before further visual patching.

## Reference findings

Candy Crush succeeds through a short, repeatable mobile loop: map → current level → pre-level goals and optional boosters → board → result → map. The board remains readable while the surrounding meta-game supplies progression, identity, rewards and events. Official King documentation confirms separate pre-game, in-game and end-game boosters, escalating cascade feedback, account-backed progress, profile access from the main journey and a settings model split into General and Accessibility.

Reference material:

- https://apps.apple.com/us/app/candy-crush-saga/id553834731
- https://www.candycrushsaga.com/
- https://candycrush.zendesk.com/hc/en-us/articles/360000750998-What-are-Boosters
- https://candycrush.zendesk.com/hc/en-us/articles/211939745-What-are-Sweet-cascades
- https://candycrush.zendesk.com/hc/en-us/articles/27184207521565-Discover-the-Settings-Menu
- https://candycrush.zendesk.com/hc/en-us/articles/360004457758-Why-should-I-log-in-to-my-profile

Candy Blast must learn from those interaction principles while keeping its own name, candy silhouettes, world art, copy, sounds, maps and progression identity.

## Current evidence

- 181 globally declared functions, 48 `window.*` exports and 80 inline event handlers couple screens to implementation order.
- `game.js` is over 51 KB and owns rules, session state, persistence, navigation, audio and UI side effects.
- CSS is spread across seven files with many inline declarations and `!important` overrides. `interface.css` alone is over 40 KB.
- There are no audio assets. Music and effects are generated from bare Web Audio oscillators.
- Seven selectable color themes change the same generic background instead of presenting authored 3D worlds.
- The settings panel clips its final account action on the audited short viewport.
- Monthly rewards compress 30 rewards into tiny low-contrast cells with weak hierarchy.
- Guest profile opens authentication instead of a useful guest profile with an explicit save-progress action.
- The home, map, board and tutorial use different density, spacing and surface rules.
- The 3D board is technically real WebGL and uses instancing, capped pixel ratio and an idle render loop. Its background remains a simple plane/fog scene and does not yet express the level world.

## Product principles

1. One obvious primary action per screen.
2. The current level and its objective remain the center of the journey.
3. Text is UI; candy and world art are visual rewards. They must not compete.
4. Every tap responds within one frame with scale, light, sound or haptic feedback.
5. Rewards use a reveal sequence, then one explicit claim action, then a compact inventory update.
6. Motion communicates cause: swap, match, fall, obstacle damage, collection and goal completion.
7. Low-end devices retain clear gameplay by reducing particles, reflections and render scale before reducing input responsiveness.
8. Auth protects progress but never blocks first play.

## Target screen structure

### Boot and account

- Branded loading scene with real progress states: loading assets, restoring session, syncing journey, ready.
- First launch offers Play now and Save my progress. Sign-in is a focused sheet, not the entire product shell.
- Google, Apple and email share one error/status area and return to the exact screen that initiated auth.
- Guest profile shows local name, level, stars, inventory and a prominent Save progress action.
- Signed-in profile shows avatar, public name, player ID, level, stars, best score, inventory, last cloud sync, sign out and delete-account entry.

### Journey map

- Opens immediately after Play or successful sign-in.
- A continuous 3D-styled path occupies the full canvas; the current level is centered and visually lifted.
- Completed nodes show solid earned stars. Locked nodes use readable depth and a lock, not low-opacity outlines.
- The top bar holds profile, lives and currency/inventory shortcuts. Bottom navigation is limited to Journey, Events and Profile for the first release.
- Selecting a level opens a bottom sheet containing goal, difficulty label derived from authored data, best result and pre-level boosters.

### Gameplay

- Top HUD: back/pause, level, remaining moves and compact goals. Score is secondary.
- Board owns the largest safe rectangle and keeps at least 8 px breathing room from the device edge.
- In-game tools remain below the board and require a second board tap when a target is needed.
- Selection uses lift, halo and a directional affordance. Invalid swaps visibly return and consume a move only if the authored rule says so.
- Cascades escalate through color, camera impulse, particles, pitch and short original words; the board never becomes unreadable.
- Win sequence completes remaining board motion, counts rewards, fills stars and returns to the journey. Loss offers retry and a clearly priced continue action when implemented.

### Rewards, tutorial and settings

- Rewards use a seven-day horizontal cycle and milestone cards; 30-day history is secondary, not a 30-cell primary grid.
- Lucky Spin shows the wheel even with zero spins, with disabled action and a clear route to earning one.
- Tutorial is embedded into levels 1–3. The separate guide becomes a replayable reference, not a second rules engine.
- Settings uses General and Accessibility tabs. General: separate music/effects levels, haptics and notifications. Accessibility: hints, reduced motion, flashing effects and high-contrast candy markers.

## Design system

- Base spacing: 4 px. Standard gaps: 8, 12, 16, 24 and 32 px.
- Minimum touch target: 48×48 px; destructive actions are separated from primary actions.
- Phone content width: full safe width. Tablet journey/game max width is contextual rather than one 560 px cap for every screen.
- Display type: a locally bundled rounded face with clear numeral forms. Body type: a locally bundled highly readable sans. No runtime Google Fonts dependency in the mobile build.
- Type scale: 12 caption, 14 body-small, 16 body/action, 20 section, 28 screen title, 44–56 display.
- Surfaces use three depths: world, floating HUD and modal sheet. Borders supplement contrast; they do not define every object.
- Icons are a single custom SVG family with 2.25 px optical stroke and filled active states. Emoji are removed from production UI.
- Stickers are original rendered candy/character illustrations used only for celebrations, onboarding and empty states.
- The logo must work as wordmark, square app icon and one-color mark. It will be redesigned after the in-app art direction is locked.

## 3D and effects

- Keep Three.js and the current instanced candy approach.
- Split renderer into scene lifecycle, board view, world view, effects pool and input adapter.
- One authored world per chapter. World 1 needs foreground platform, mid-ground path props, distant candy terrain, subtle atmosphere and a limited character/sticker presence.
- Reuse geometry/materials, pool particles and cap DPR. Quality tiers control DPR, shadows, reflections, particles and background prop density.
- No continuous render while idle. Motion, theme changes and UI transitions wake the renderer.
- Effects budget per move: selection halo, swap trail, match burst, fall squash, objective fly-to-HUD and at most one cascade title.

## Audio direction

- Replace oscillator-only output with original local assets.
- Separate buses: music, UI, board, rewards and ambience.
- Required first pack: tap, back, swap, invalid, match tiers 1–5, fall, special create, striped, wrapped, color blast, ice crack, collect, star fill, win, loss, reward reveal and spin ticks.
- Music uses short seamless original loops per world with a quieter menu arrangement. Resume, pause and interruption must fade rather than restart abruptly.
- Settings store separate music and effects levels. Mono and reduced high-frequency options are later accessibility additions.

## Architecture target

```text
Platform adapters (web / Android / iOS)
  → app shell and router
    → feature controllers (journey, level, rewards, profile, settings)
      → game session state machine
        → pure match-3 rules and authored level data
      → repositories (local save, cloud save, auth)
    → renderers (DOM UI, Three.js board/world, audio, haptics)
```

- Rules never read DOM or localStorage.
- The session state machine is the only owner of ready, swapping, resolving, paused, won and lost states.
- UI subscribes to state and emits actions. It does not mutate game arrays.
- Storage uses a versioned schema and an explicit local/cloud merge policy.
- Screen routing owns focus, back behavior, modal stacking and deep-link return.

## Execution order and exit criteria

1. **Foundation:** freeze the visual tokens, replace inline screen navigation with one router, define versioned app/player/session state and preserve existing saves. Exit: current 65 tests pass and every screen has one owner.
2. **Core loop:** rebuild journey → level sheet → pre-game → board → result → journey. Exit: the complete flow works without legacy level-select paths or stacked dialogs.
3. **Board feel:** finish selection, swap, fall, cascade, goal collection and special-combination feedback. Exit: every board event has deterministic visual/audio feedback and can be cancelled safely.
4. **Meta screens:** profile, rewards, spin, settings and tutorial reference. Exit: every empty/loading/error/offline/signed-out state is designed and tested at supported sizes.
5. **World and brand:** chapter-one 3D world, original stickers, logo, icon and audio pack. Exit: no emoji or placeholder art remains in production UI.
6. **Native and QA:** Capacitor shells, secure auth callbacks, device lifecycle, physical Android/iPhone performance and store assets. Exit: signed test builds pass the release matrix.
7. **Official site:** rebuild in a white editorial style after the app logo, screenshots and store links are final.

Supported layout matrix for every exit: 320×568, 360×800, 390×844, 430×932, common Android landscape, iPhone landscape, 768 px tablet portrait and desktop preview. Automated layout checks supplement, but do not replace, physical-device testing.

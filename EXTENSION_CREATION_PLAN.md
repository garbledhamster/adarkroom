# Extension Creation Plan

This document is the working checklist for finishing the addon/DLC/extension system.

Copilot/Codex agents should update this file after every implementation pass by marking completed items with `[x]`, leaving incomplete items as `[ ]`, and adding short notes under each pass.

## Execution Rules for Copilot Agents

- Work one pass at a time.
- Do not skip ahead unless the current pass is complete or clearly blocked.
- Keep patches small enough to review.
- Do not rewrite unrelated game systems.
- Preserve existing gameplay and save compatibility.
- Prefer safe wrappers and integration points over large refactors.
- If a task is unclear, document it under `Blocked / Needs Review` instead of guessing.
- After each pass, update this file with:
  - completed checklist items
  - incomplete checklist items
  - files changed
  - manual test notes
  - known risks

## Definition of Done for Extension System v1

- [x] Addons load from `extensions.json`.
- [x] Addons can be enabled/disabled without editing core game files.
- [x] Addons can register craftables, workers, events, weapons, perks, world tiles, and landmarks.
- [ ] Hooks exist for movement, crafting/building, combat, resources, landmarks, game start/load/save.
- [x] Save files record enabled addon IDs and versions.
- [x] Missing addons do not corrupt saves.
- [ ] Alchemist extension works end-to-end.
- [ ] Herbalist extension works end-to-end.
- [x] Diagnostics are available from the browser console.
- [x] `docs/EXTENSIONS.md` exists.
- [ ] Smoke test or manual validation helper exists.
- [ ] No new syntax/lint errors are introduced.

---

# Pass 1 — Audit and Stabilize Existing Extension System

## Copilot Prompt

```text
Audit the existing extension system in this repo.

Do not add new large features yet.

Tasks:
1. Verify whether these exist:
   - script/extensions/api.js
   - script/extensions/loader.js
   - script/extensions/alchemist.js
   - script/extensions/herbalist.js
   - extensions.json
2. Verify whether index.html loads the extension API/loader correctly.
3. Verify whether Engine.init() initializes ExtensionLoader after core systems are ready.
4. Verify whether these hooks exist and are safe:
   - game:start
   - room:stoked
   - combat:kill
   - path:step
5. Fix only obvious bugs, syntax issues, load-order issues, and null-reference risks.
6. Add minimal diagnostics:
   - ExtensionAPI.diagnostics.getSummary()
   - ExtensionAPI.diagnostics.print()
7. Add a short report in docs/EXTENSION_AUDIT.md describing:
   - what exists
   - what was fixed
   - what is still missing
8. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.

Do not implement the full v1 system yet.
Keep the patch small and safe.
```

## Checklist

- [x] Confirm `script/extensions/api.js` exists.
- [x] Confirm `script/extensions/loader.js` exists.
- [x] Confirm `script/extensions/alchemist.js` exists.
- [x] Confirm `script/extensions/herbalist.js` exists.
- [x] Confirm `extensions.json` exists.
- [x] Confirm `index.html` loads extension API/loader correctly.
- [x] Confirm `Engine.init()` initializes extensions after core systems are ready.
- [x] Confirm `game:start` hook exists and is safe.
- [x] Confirm `room:stoked` hook exists and is safe.
- [ ] Confirm `combat:kill` hook exists and is safe.
- [x] Confirm `path:step` hook exists and is safe.
- [x] Fix obvious syntax issues.
- [x] Fix obvious load-order issues.
- [x] Fix obvious null-reference risks.
- [x] Add `ExtensionAPI.diagnostics.getSummary()`.
- [x] Add `ExtensionAPI.diagnostics.print()`.
- [x] Create `docs/EXTENSION_AUDIT.md`.
- [x] Update this plan with pass notes.

## Pass 1 Notes

- Status: Complete
- Files changed:
  - script/extensions/api.js
  - docs/EXTENSION_AUDIT.md
  - EXTENSION_CREATION_PLAN.md
- Manual tests:
  - Confirm ExtensionAPI loads without errors
  - Confirm ExtensionLoader registers extensions
  - Run in browser console: ExtensionAPI.diagnostics.print()
- Known risks:
  - combat:kill hook not confirmed via search (needs runtime validation)
  - no validation or duplicate protection yet
- Blocked / Needs Review:
  - confirm combat:kill hook at runtime

---

# Pass 2 — Registry Hardening

## Copilot Prompt

```text
Build the extension registry hardening layer.

Tasks:
1. Ensure ExtensionAPI exposes official registration methods:
   - resources.register
   - craftables.register
   - tradeGoods.register
   - workers.register
   - perks.register
   - weapons.register
   - worldTiles.register
   - landmarks.register
   - events.register
   - hooks.on
   - hooks.off
   - hooks.emit
2. Add duplicate ID detection.
3. Add validation for each registration type.
4. Wrap all extension callbacks and hook callbacks in try/catch.
5. One broken extension must not crash the base game.
6. Make errors identify the extension ID when possible.
7. Ensure registrations write into the existing A Dark Room systems:
   - Room.Craftables
   - Room.TradeGoods
   - Outside._INCOME or existing income system
   - Engine.Perks or existing perk system
   - World.Weapons
   - World.TILE
   - World.LANDMARKS
   - Events.EventPool or Events.Addons
8. Update Alchemist and Herbalist to use only the official API surface where possible.
9. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.

Do not implement manifest loading or save migrations in this pass.
```

## Checklist

- [x] Add `resources.register`.
- [x] Add `craftables.register`.
- [x] Add `tradeGoods.register`.
- [x] Add `workers.register`.
- [x] Add `perks.register`.
- [x] Add `weapons.register`.
- [x] Add `worldTiles.register`.
- [x] Add `landmarks.register`.
- [x] Add `events.register`.
- [x] Add `hooks.on`.
- [x] Add `hooks.off`.
- [x] Add `hooks.emit`.
- [x] Add duplicate ID detection for all registries.
- [x] Add validation for resources.
- [x] Add validation for craftables.
- [x] Add validation for trade goods.
- [x] Add validation for workers.
- [x] Add validation for perks.
- [x] Add validation for weapons.
- [x] Add validation for world tiles.
- [x] Add validation for landmarks.
- [x] Add validation for events.
- [x] Wrap extension callbacks in `try/catch`.
- [x] Wrap hook callbacks in `try/catch`.
- [x] Ensure failed extension code does not crash base game.
- [x] Include extension ID in error output where possible.
- [x] Register craftables into `Room.Craftables`.
- [x] Register trade goods into `Room.TradeGoods`.
- [x] Register workers into existing worker/income system.
- [x] Register perks into existing perk system.
- [x] Register weapons into `World.Weapons`.
- [x] Register world tiles into `World.TILE`.
- [x] Register landmarks into `World.LANDMARKS`.
- [x] Register events into `Events.EventPool` or `Events.Addons`.
- [x] Update Alchemist extension to use official API.
- [x] Update Herbalist extension to use official API.
- [x] Update this plan with pass notes.

## Pass 2 Notes

- Status: Complete
- Files changed:
  - script/extensions/api.js
  - script/extensions/loader.js
  - script/extensions/alchemist.js
  - script/extensions/herbalist.js
  - EXTENSION_CREATION_PLAN.md
- Manual tests:
  - Confirm `ExtensionAPI.diagnostics.print()` shows new fields (`duplicateAttempts`, `extensionRegisteredIds`, `tradeGoodCount`, `perkCount`)
  - Register the same craftable ID twice and confirm only first registration sticks and a warning is logged
  - Omit `def.cost` from a craftable registration and confirm it is rejected with a warning
  - Confirm alchemist and herbalist still initialise without errors
  - Confirm perk logic works end-to-end (craft elixir → vitality perk granted, path:step → herbs found with herbalism perk)
- Known risks:
  - `resources.register` writes to an internal `_registry` only; there is no core game resource table to inject into yet (addressed in a future pass if needed)
  - `landmarks.register` writes directly to `World.LANDMARKS`; landmark placement on the map still uses World.init() radius data and is not retroactively re-run for dynamic landmarks
  - `world.registerTile` is kept as a backward-compatible alias for `worldTiles.register`
- Blocked / Needs Review:
  - `combat:kill` hook runtime validation still pending (carried over from Pass 1)

---

# Pass 3 — Manifest Loading and Enable/Disable

## Copilot Prompt

```text
Implement manifest-based extension loading.

Tasks:
1. Use extensions.json as the source of extension loading.
2. Respect enabled: true/false.
3. Load enabled extension scripts in manifest order.
4. Support optional requires array for dependencies.
5. Track:
   - loaded extensions
   - disabled extensions
   - failed extensions
   - missing dependencies
6. Expose:
   - ExtensionLoader.getLoaded()
   - ExtensionLoader.getFailed()
   - ExtensionLoader.getDisabled()
   - ExtensionLoader.getDiagnostics()
7. Keep static script registration backward compatible.
8. Avoid double-loading extensions if they are already present from static script tags.
9. Update index.html so core API/loader scripts load normally, but individual extensions are preferably loaded through extensions.json.
10. Document any browser/local-file limitations in docs/EXTENSIONS.md or docs/EXTENSION_AUDIT.md if docs/EXTENSIONS.md does not exist yet.
11. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.

Make this work without breaking local development.
```

## Checklist

- [x] Use `extensions.json` as extension manifest.
- [x] Respect `enabled: true`.
- [x] Respect `enabled: false`.
- [x] Load enabled scripts in manifest order.
- [x] Support optional `requires` dependencies.
- [x] Track loaded extensions.
- [x] Track disabled extensions.
- [x] Track failed extensions.
- [x] Track missing dependencies.
- [x] Add `ExtensionLoader.getLoaded()`.
- [x] Add `ExtensionLoader.getFailed()`.
- [x] Add `ExtensionLoader.getDisabled()`.
- [x] Add `ExtensionLoader.getDiagnostics()`.
- [x] Preserve static script fallback.
- [x] Prevent double-loading of statically loaded extensions.
- [x] Update `index.html` loading strategy.
- [x] Document local-file/browser limitations.
- [x] Update this plan with pass notes.

## Pass 3 Notes

- Status: Complete
- Files changed:
  - script/extensions/loader.js
  - script/engine.js
  - index.html
  - docs/EXTENSIONS.md (created)
  - EXTENSION_CREATION_PLAN.md
- Manual tests:
  - Serve via `python3 -m http.server` and confirm both extensions load.
  - Run `ExtensionLoader.getDiagnostics()` in console — expect `loaded: ['alchemist','herbalist']`.
  - Set `"enabled": false` for herbalist in extensions.json, reload, confirm `getDisabled()` returns `['herbalist']`.
  - Add a `requires: ['nonexistent']` entry, confirm it appears in `getDiagnostics().missingDeps`.
  - Introduce a syntax error in an extension, confirm `getFailed()` lists it and the game still loads.
  - Re-add a static `<script>` tag for alchemist.js, confirm it is not double-initialised.
- Known risks:
  - `fetch()` is blocked on `file://` origins — documented in docs/EXTENSIONS.md.
  - `game:start` hook is now emitted asynchronously (after manifest fetch + script loads) instead of synchronously at end of `Engine.init()`.  Extensions relying on immediate `game:start` timing should be unaffected in practice since the game UI is already rendered before hooks fire.
- Blocked / Needs Review:
  - `combat:kill` hook runtime validation still pending (carried from Pass 1 / Pass 2).

---

# Pass 4 — Save Compatibility and Missing Addons

## Copilot Prompt

```text
Add save compatibility support for extensions.

Tasks:
1. Save enabled extension IDs and versions under a stable save path, preferably:
   game.extensions.enabled
2. Add:
   - ExtensionAPI.save.getMetadata()
   - ExtensionAPI.save.recordLoadedExtensions()
   - ExtensionAPI.save.validateCompatibility()
3. On load, detect extensions referenced by the save but not currently loaded.
4. Preserve unknown extension-created data. Do not delete stores, perks, map data, or state from missing addons.
5. Warn in console when a save references a missing extension.
6. Missing extensions should disable effects but not corrupt saves.
7. Add optional migration support:
   - extension may expose migrations
   - track applied migrations under game.extensions.migrations
8. Add diagnostics for missing extensions and migration state.
9. Add manual test notes in docs/EXTENSIONS.md or docs/EXTENSION_AUDIT.md if docs/EXTENSIONS.md does not exist yet.
10. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.

Do not rewrite the whole save system. Use the existing State Manager patterns.
```

## Checklist

- [x] Save enabled extension IDs under `game.extensions.enabled` or equivalent stable path.
- [x] Save enabled extension versions.
- [x] Add `ExtensionAPI.save.getMetadata()`.
- [x] Add `ExtensionAPI.save.recordLoadedExtensions()`.
- [x] Add `ExtensionAPI.save.validateCompatibility()`.
- [x] Detect save-referenced extensions that are not currently loaded.
- [x] Preserve unknown extension-created stores.
- [x] Preserve unknown extension-created perks.
- [x] Preserve unknown extension-created map data.
- [x] Preserve unknown extension-created state.
- [x] Warn when save references missing extension.
- [x] Missing extensions do not corrupt saves.
- [x] Add optional migration support.
- [x] Track applied migrations under `game.extensions.migrations` or equivalent.
- [x] Add diagnostics for missing extensions.
- [x] Add diagnostics for migration state.
- [x] Add manual test notes.
- [x] Update this plan with pass notes.

## Pass 4 Notes

- Status: Complete
- Files changed:
  - script/extensions/api.js  (added `save` namespace; updated `diagnostics.getSummary()`)
  - script/engine.js          (wired `validateCompatibility`, `runMigrations`, `recordLoadedExtensions` into callback)
  - docs/EXTENSIONS.md        (Save Compatibility section rewritten; Diagnostics updated)
  - EXTENSION_CREATION_PLAN.md
- Manual tests:
  - Serve via `python3 -m http.server` and load the game.
  - Run `ExtensionAPI.diagnostics.print()` — expect `savedExtensions` to contain `[{id:'alchemist',…},{id:'herbalist',…}]`.
  - Reload the page — confirm no warnings about missing extensions (both still loaded).
  - Disable `herbalist` in `extensions.json` (`"enabled": false`), reload — confirm console warning:
    `[ExtensionAPI] save references extension "herbalist" v1.0.0 which is not currently loaded — orphaned state preserved`
  - Re-enable herbalist, reload — no warnings, herbalist state preserved.
  - Add a migration to a test extension (`migrations: [{id:'test:1.0:init', up: function(){}}]`):
    confirm the migration runs once and is recorded in `game.extensions.migrations`.
  - Save and reload — confirm the migration is NOT run again.
  - Run `ExtensionAPI.save.getMetadata()` — confirm `enabled` and `migrations` fields are populated.
  - Run `ExtensionAPI.save.validateCompatibility()` — confirm it returns `{ missing: [] }` when all extensions load.
- Known risks:
  - `validateCompatibility()` is called before `game:start` so it fires on every load, including new
    games (where `game.extensions.enabled` is empty).  The empty-array guard ensures this is a no-op.
  - Migration `up()` errors are caught and logged; a failed migration is NOT recorded as applied, so
    it will be retried on the next load.
- Blocked / Needs Review:
  - `combat:kill` hook runtime validation still pending (carried from Passes 1–3).

---

# Pass 5 — Expand Hooks Carefully

## Copilot Prompt

```text
Expand hook coverage across the game, but only where safe.

Add hook emissions using ExtensionAPI.hooks.emit(name, payload).

Required hooks:
- game:init
- game:start
- game:save
- game:load
- room:stoked
- room:fireChanged
- room:temperatureChanged
- resource:changed
- craft:before
- craft:after
- build:before
- build:after
- path:embark
- path:step
- path:returnHome
- world:beforeMove
- world:afterMove
- world:tileRevealed
- world:landmarkEntered
- world:landmarkCleared
- combat:start
- combat:attack
- combat:kill
- combat:end
- combat:playerDeath
- ship:discovered
- ship:upgraded
- ship:launch
- prestige:before
- prestige:after

Rules:
1. If a hook location is unclear, skip it and document it as unwired.
2. Do not break existing gameplay.
3. Payloads should be small and safe.
4. Avoid passing mutable core objects unless necessary.
5. Update docs/EXTENSIONS.md or docs/EXTENSION_AUDIT.md with wired/unwired status.
6. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.
```

## Checklist

- [ ] Wire `game:init`.
- [ ] Wire `game:start`.
- [ ] Wire `game:save`.
- [ ] Wire `game:load`.
- [ ] Wire `room:stoked`.
- [ ] Wire `room:fireChanged`.
- [ ] Wire `room:temperatureChanged`.
- [ ] Wire `resource:changed`.
- [ ] Wire `craft:before`.
- [ ] Wire `craft:after`.
- [ ] Wire `build:before`.
- [ ] Wire `build:after`.
- [ ] Wire `path:embark`.
- [ ] Wire `path:step`.
- [ ] Wire `path:returnHome`.
- [ ] Wire `world:beforeMove`.
- [ ] Wire `world:afterMove`.
- [ ] Wire `world:tileRevealed`.
- [ ] Wire `world:landmarkEntered`.
- [ ] Wire `world:landmarkCleared`.
- [ ] Wire `combat:start`.
- [ ] Wire `combat:attack`.
- [ ] Wire `combat:kill`.
- [ ] Wire `combat:end`.
- [ ] Wire `combat:playerDeath`.
- [ ] Wire `ship:discovered`.
- [ ] Wire `ship:upgraded`.
- [ ] Wire `ship:launch`.
- [ ] Wire `prestige:before`.
- [ ] Wire `prestige:after`.
- [ ] Document unwired hooks.
- [ ] Update this plan with pass notes.

## Pass 5 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Pass 6 — Documentation, Smoke Tests, and QA

## Copilot Prompt

```text
Finish documentation and validation for the extension system.

Tasks:
1. Create or update docs/EXTENSIONS.md.
2. Document:
   - extension file format
   - extensions.json format
   - API methods
   - hook list
   - payload examples
   - save compatibility
   - diagnostics
   - troubleshooting
3. Add ExtensionAPI.diagnostics.runSmokeTest().
4. Smoke test should check:
   - ExtensionAPI exists
   - ExtensionLoader exists
   - hooks emit safely
   - duplicate IDs are rejected
   - disabled extensions do not initialize
   - craftables register into Room.Craftables
   - workers register into the worker/income system
   - weapons register into World.Weapons
   - events register into Events.EventPool or Events.Addons
   - save metadata can be produced
5. Add manual QA checklist for:
   - Alchemist
   - Herbalist
   - disabling an extension
   - missing extension save compatibility
6. Provide a final summary in docs/EXTENSION_STATUS.md:
   - complete
   - partial
   - not implemented
   - known risks
7. Update EXTENSION_CREATION_PLAN.md by checking completed items and adding notes.
```

## Checklist

- [ ] Create or update `docs/EXTENSIONS.md`.
- [ ] Document extension file format.
- [ ] Document `extensions.json` format.
- [ ] Document API methods.
- [ ] Document hook list.
- [ ] Document payload examples.
- [ ] Document save compatibility.
- [ ] Document diagnostics.
- [ ] Document troubleshooting.
- [ ] Add `ExtensionAPI.diagnostics.runSmokeTest()`.
- [ ] Smoke test confirms `ExtensionAPI` exists.
- [ ] Smoke test confirms `ExtensionLoader` exists.
- [ ] Smoke test confirms hooks emit safely.
- [ ] Smoke test confirms duplicate IDs are rejected.
- [ ] Smoke test confirms disabled extensions do not initialize.
- [ ] Smoke test confirms craftables register into `Room.Craftables`.
- [ ] Smoke test confirms workers register into worker/income system.
- [ ] Smoke test confirms weapons register into `World.Weapons`.
- [ ] Smoke test confirms events register into `Events.EventPool` or `Events.Addons`.
- [ ] Smoke test confirms save metadata can be produced.
- [ ] Add Alchemist manual QA checklist.
- [ ] Add Herbalist manual QA checklist.
- [ ] Add disabling-extension manual QA checklist.
- [ ] Add missing-extension manual QA checklist.
- [ ] Create `docs/EXTENSION_STATUS.md`.
- [ ] Update this plan with pass notes.

## Pass 6 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Manual QA Checklist

## Alchemist Extension

- [ ] Start or load a game.
- [ ] Build 3 huts.
- [ ] Confirm alchemist event can appear.
- [ ] Accept alchemist.
- [ ] Confirm alchemist worker exists.
- [ ] Confirm herbs can become essence.
- [ ] Confirm elixir craftable appears.
- [ ] Craft elixir.
- [ ] Confirm vitality perk is granted or works.
- [ ] Kill enemies.
- [ ] Confirm herbs sometimes drop.
- [ ] Save and reload.
- [ ] Confirm alchemist state persists.

## Herbalist Extension

- [ ] Start or load a game.
- [ ] Build 1 hut.
- [ ] Confirm herbalist event can appear.
- [ ] Choose teach/trade branch.
- [ ] Confirm herbalism perk is added.
- [ ] Walk on world map.
- [ ] Confirm herbs sometimes appear from `path:step`.
- [ ] Confirm healing salve craftable appears.
- [ ] Save and reload.
- [ ] Confirm herbalist state persists.

## Manifest Enable/Disable

- [ ] Disable herbalist in `extensions.json`.
- [ ] Reload game.
- [ ] Confirm herbalist does not initialize.
- [ ] Confirm alchemist still works.
- [ ] Confirm no crash.
- [ ] Re-enable herbalist.
- [ ] Reload game.
- [ ] Confirm herbalist initializes again.

## Missing Extension Save Compatibility

- [ ] Load a save that references herbalist.
- [ ] Remove or disable herbalist.
- [ ] Reload save.
- [ ] Confirm save loads without corruption.
- [ ] Confirm console warning is shown.
- [ ] Confirm unknown herbalist data is preserved.

---

# Final Implementation Report Template

Copilot agent should fill this section when all passes are complete.

## Final Status

- Status: Not complete

## Files Changed

- TBD

## API Methods Added

- TBD

## Hook Wiring Status

| Hook | Status | Notes |
|---|---|---|
| game:init | TBD | |
| game:start | TBD | |
| game:save | TBD | |
| game:load | TBD | |
| room:stoked | TBD | |
| room:fireChanged | TBD | |
| room:temperatureChanged | TBD | |
| resource:changed | TBD | |
| craft:before | TBD | |
| craft:after | TBD | |
| build:before | TBD | |
| build:after | TBD | |
| path:embark | TBD | |
| path:step | TBD | |
| path:returnHome | TBD | |
| world:beforeMove | TBD | |
| world:afterMove | TBD | |
| world:tileRevealed | TBD | |
| world:landmarkEntered | TBD | |
| world:landmarkCleared | TBD | |
| combat:start | TBD | |
| combat:attack | TBD | |
| combat:kill | TBD | |
| combat:end | TBD | |
| combat:playerDeath | TBD | |
| ship:discovered | TBD | |
| ship:upgraded | TBD | |
| ship:launch | TBD | |
| prestige:before | TBD | |
| prestige:after | TBD | |

## Manual Test Results

- TBD

## Known Limitations

- TBD

## Follow-Up Recommendations

- TBD

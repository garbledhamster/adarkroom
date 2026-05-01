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

- [ ] Addons load from `extensions.json`.
- [ ] Addons can be enabled/disabled without editing core game files.
- [ ] Addons can register craftables, workers, events, weapons, perks, world tiles, and landmarks.
- [ ] Hooks exist for movement, crafting/building, combat, resources, landmarks, game start/load/save.
- [ ] Save files record enabled addon IDs and versions.
- [ ] Missing addons do not corrupt saves.
- [ ] Alchemist extension works end-to-end.
- [ ] Herbalist extension works end-to-end.
- [ ] Diagnostics are available from the browser console.
- [ ] `docs/EXTENSIONS.md` exists.
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

- [ ] Confirm `script/extensions/api.js` exists.
- [ ] Confirm `script/extensions/loader.js` exists.
- [ ] Confirm `script/extensions/alchemist.js` exists.
- [ ] Confirm `script/extensions/herbalist.js` exists.
- [ ] Confirm `extensions.json` exists.
- [ ] Confirm `index.html` loads extension API/loader correctly.
- [ ] Confirm `Engine.init()` initializes extensions after core systems are ready.
- [ ] Confirm `game:start` hook exists and is safe.
- [ ] Confirm `room:stoked` hook exists and is safe.
- [ ] Confirm `combat:kill` hook exists and is safe.
- [ ] Confirm `path:step` hook exists and is safe.
- [ ] Fix obvious syntax issues.
- [ ] Fix obvious load-order issues.
- [ ] Fix obvious null-reference risks.
- [ ] Add `ExtensionAPI.diagnostics.getSummary()`.
- [ ] Add `ExtensionAPI.diagnostics.print()`.
- [ ] Create `docs/EXTENSION_AUDIT.md`.
- [ ] Update this plan with pass notes.

## Pass 1 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

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

- [ ] Add `resources.register`.
- [ ] Add `craftables.register`.
- [ ] Add `tradeGoods.register`.
- [ ] Add `workers.register`.
- [ ] Add `perks.register`.
- [ ] Add `weapons.register`.
- [ ] Add `worldTiles.register`.
- [ ] Add `landmarks.register`.
- [ ] Add `events.register`.
- [ ] Add `hooks.on`.
- [ ] Add `hooks.off`.
- [ ] Add `hooks.emit`.
- [ ] Add duplicate ID detection for all registries.
- [ ] Add validation for resources.
- [ ] Add validation for craftables.
- [ ] Add validation for trade goods.
- [ ] Add validation for workers.
- [ ] Add validation for perks.
- [ ] Add validation for weapons.
- [ ] Add validation for world tiles.
- [ ] Add validation for landmarks.
- [ ] Add validation for events.
- [ ] Wrap extension callbacks in `try/catch`.
- [ ] Wrap hook callbacks in `try/catch`.
- [ ] Ensure failed extension code does not crash base game.
- [ ] Include extension ID in error output where possible.
- [ ] Register craftables into `Room.Craftables`.
- [ ] Register trade goods into `Room.TradeGoods`.
- [ ] Register workers into existing worker/income system.
- [ ] Register perks into existing perk system.
- [ ] Register weapons into `World.Weapons`.
- [ ] Register world tiles into `World.TILE`.
- [ ] Register landmarks into `World.LANDMARKS`.
- [ ] Register events into `Events.EventPool` or `Events.Addons`.
- [ ] Update Alchemist extension to use official API.
- [ ] Update Herbalist extension to use official API.
- [ ] Update this plan with pass notes.

## Pass 2 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

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

- [ ] Use `extensions.json` as extension manifest.
- [ ] Respect `enabled: true`.
- [ ] Respect `enabled: false`.
- [ ] Load enabled scripts in manifest order.
- [ ] Support optional `requires` dependencies.
- [ ] Track loaded extensions.
- [ ] Track disabled extensions.
- [ ] Track failed extensions.
- [ ] Track missing dependencies.
- [ ] Add `ExtensionLoader.getLoaded()`.
- [ ] Add `ExtensionLoader.getFailed()`.
- [ ] Add `ExtensionLoader.getDisabled()`.
- [ ] Add `ExtensionLoader.getDiagnostics()`.
- [ ] Preserve static script fallback.
- [ ] Prevent double-loading of statically loaded extensions.
- [ ] Update `index.html` loading strategy.
- [ ] Document local-file/browser limitations.
- [ ] Update this plan with pass notes.

## Pass 3 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

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

- [ ] Save enabled extension IDs under `game.extensions.enabled` or equivalent stable path.
- [ ] Save enabled extension versions.
- [ ] Add `ExtensionAPI.save.getMetadata()`.
- [ ] Add `ExtensionAPI.save.recordLoadedExtensions()`.
- [ ] Add `ExtensionAPI.save.validateCompatibility()`.
- [ ] Detect save-referenced extensions that are not currently loaded.
- [ ] Preserve unknown extension-created stores.
- [ ] Preserve unknown extension-created perks.
- [ ] Preserve unknown extension-created map data.
- [ ] Preserve unknown extension-created state.
- [ ] Warn when save references missing extension.
- [ ] Missing extensions do not corrupt saves.
- [ ] Add optional migration support.
- [ ] Track applied migrations under `game.extensions.migrations` or equivalent.
- [ ] Add diagnostics for missing extensions.
- [ ] Add diagnostics for migration state.
- [ ] Add manual test notes.
- [ ] Update this plan with pass notes.

## Pass 4 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

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

# Mod Manager Creation Guide

This guide defines the implementation plan for adding an in-game extension toggle manager.

Player-facing button label:

```text
Mods
```

Documentation/system name:

```text
Mod Manager
```

The Mod Manager should let players view installed extensions and toggle them on/off from inside the game.

---

# Design Goal

Add a bottom/menu button named `Mods` beside the existing footer/menu buttons. Clicking it opens a small Mod Manager panel or event-style dialog where installed extensions can be enabled or disabled.

The Mod Manager should manage extension state without requiring users to manually edit `extensions.json`.

---

# Important Constraint

Browser JavaScript cannot rewrite `extensions.json` on a normal hosted/static site.

Therefore:

- `extensions.json` remains the list of installed mods and their default enabled state.
- The Mod Manager stores player-specific enable/disable overrides in save/local state.
- On load, `ExtensionLoader` should combine:
  - installed mod definitions from `extensions.json`
  - user overrides from save/local state

Conceptual rule:

```text
extensions.json = installed/default mod list
Mod Manager = player override layer
```

---

# Storage Design

Store user mod preferences in game state:

```js
game.mods.overrides = {
  "alchemist": true,
  "herbalist": false
}
```

Meaning:

```text
true  -> force enabled
false -> force disabled
missing key -> use extensions.json default
```

The loaded extension state should be determined by:

```js
effectiveEnabled = overrideExists ? overrideValue : manifestEnabled
```

---

# Required User Flow

1. Player clicks `Mods` button at the bottom/menu area.
2. Mod Manager opens.
3. Player sees installed mods from `extensions.json`.
4. Each mod displays:
   - name
   - id
   - version
   - enabled/disabled status
   - load status if known
   - short description if available
5. Player can toggle a mod on/off.
6. Game stores the override.
7. Player is told reload is required for changes to take effect.
8. Optional: provide a reload button.

---

# Pass 1 — Audit Menu/Footer Button Pattern

## Copilot Prompt

```text
Audit the existing game menu/footer button pattern before implementing the Mod Manager.

Tasks:
1. Find where bottom/menu buttons such as save, restart, share, lights off, and hyper are created.
2. Identify the safest place to add a new button labeled "Mods".
3. Identify whether the game has an existing dialog/event system suitable for the Mod Manager UI.
4. Identify whether `Events.startEvent()` is appropriate for opening the Mod Manager.
5. Do not implement the Mod Manager yet.
6. Create docs/MOD_MANAGER_AUDIT.md documenting findings.
7. Update MOD_MANAGER_CREATION_GUIDE.md Pass 1 checklist and notes.
```

## Checklist

- [x] Locate existing bottom/menu button creation code.
- [x] Identify safest insertion point for `Mods` button.
- [x] Identify existing dialog/event UI system.
- [x] Decide whether `Events.startEvent()` should be used.
- [x] Create `docs/MOD_MANAGER_AUDIT.md`.
- [x] Update Pass 1 notes.

## Pass 1 Notes

- Status: Complete
- Files changed:
  - `docs/MOD_MANAGER_AUDIT.md` (created)
  - `MOD_MANAGER_CREATION_GUIDE.md` (this file — checklist updated)
- Findings:
  - Menu buttons are all created in `Engine.init()` (`script/engine.js` ~lines 118–201).
  - Each button is a `<span class="menuBtn">` appended to a `<div class="menu">` fixed at
    bottom-right of the page; spans float right so the last appended span renders leftmost.
  - Safest insertion point: append after the `github.` button (i.e. add it last in
    `Engine.init`), placing `mods.` at the far left of the menu row.
  - `Events.startEvent()` / `Events.endEvent()` is the idiomatic dialog system and is
    already used by all three menu-triggered dialogs (`exportImport`, `confirmDelete`,
    `confirmHyperMode`).
  - `Events.startEvent()` IS appropriate; the `onLoad` callback in `scenes.start` can
    inject the dynamic mod list into `#description`.
- Blocked / Needs Review: None.

---

# Pass 2 — Add Mod Manager State Helpers

## Copilot Prompt

```text
Add state helpers for Mod Manager overrides.

Design:
- `extensions.json` defines installed/default mods.
- `game.mods.overrides` stores player-specific enable/disable overrides.
- Missing override means use the manifest default.

Tasks:
1. Add helper methods to ExtensionLoader or ExtensionAPI:
   - getModOverrides()
   - setModOverride(id, enabled)
   - clearModOverride(id)
   - getEffectiveEnabled(entry)
2. Store overrides under `game.mods.overrides`.
3. Do not break existing manifest loading.
4. Ensure missing overrides fall back to `entry.enabled !== false`.
5. Add diagnostics showing overrides.
6. Update docs if needed.
7. Update MOD_MANAGER_CREATION_GUIDE.md Pass 2 checklist and notes.
```

## Checklist

- [ ] Add `getModOverrides()`.
- [ ] Add `setModOverride(id, enabled)`.
- [ ] Add `clearModOverride(id)`.
- [ ] Add `getEffectiveEnabled(entry)`.
- [ ] Store overrides under `game.mods.overrides`.
- [ ] Missing override falls back to manifest default.
- [ ] Add diagnostics showing overrides.
- [ ] Preserve existing manifest loading.
- [ ] Update Pass 2 notes.

## Pass 2 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Pass 3 — Apply Overrides During Manifest Loading

## Copilot Prompt

```text
Apply Mod Manager overrides during extension manifest loading.

Tasks:
1. Update ExtensionLoader.loadFromManifest() or equivalent manifest path.
2. For each manifest entry, compute effective enabled state:
   - if `game.mods.overrides[id]` exists, use that boolean
   - otherwise use `entry.enabled !== false`
3. Disabled-by-override mods should be tracked separately from disabled-by-manifest mods if simple.
4. Ensure disabled mods do not load their script.
5. Ensure toggling requires reload and does not try to unload already-running JavaScript.
6. Update diagnostics:
   - installed mods
   - effective enabled state
   - disabled reason if possible: manifest or override
7. Update MOD_MANAGER_CREATION_GUIDE.md Pass 3 checklist and notes.
```

## Checklist

- [ ] Manifest loading checks overrides.
- [ ] Override `true` force-enables a mod.
- [ ] Override `false` force-disables a mod.
- [ ] Missing override uses manifest default.
- [ ] Disabled mods do not load scripts.
- [ ] Already-running mods are not hot-unloaded.
- [ ] Diagnostics include installed mods.
- [ ] Diagnostics include effective enabled state.
- [ ] Diagnostics include disabled reason if simple.
- [ ] Update Pass 3 notes.

## Pass 3 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Pass 4 — Add the `Mods` Button

## Copilot Prompt

```text
Add a new bottom/menu button labeled "Mods".

Tasks:
1. Add the button near existing menu buttons such as save/restart/share/hyper.
2. Label must be exactly: Mods
3. Clicking the button should open the Mod Manager UI.
4. Do not change existing menu button behavior.
5. Do not add complex styling unless needed.
6. Ensure button exists after game init.
7. Update MOD_MANAGER_CREATION_GUIDE.md Pass 4 checklist and notes.
```

## Checklist

- [ ] Add bottom/menu button labeled `Mods`.
- [ ] Place near existing menu buttons.
- [ ] Click opens Mod Manager UI.
- [ ] Existing menu buttons still work.
- [ ] Button appears after game init.
- [ ] Update Pass 4 notes.

## Pass 4 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Pass 5 — Build Mod Manager UI

## Copilot Prompt

```text
Build the Mod Manager UI.

Preferred approach:
- Use existing event/dialog UI if appropriate.
- If `Events.startEvent()` is a good fit, use it.

UI requirements:
1. Title: Mod Manager
2. Show installed mods from `extensions.json`.
3. Each mod should show:
   - name
   - id
   - version
   - current effective enabled/disabled status
   - default manifest enabled/disabled status
   - override state if any
4. Each mod should have a toggle action.
5. Toggling should update `game.mods.overrides`.
6. Display message that reload is required.
7. Add optional reload button if simple.
8. Add close/cancel button.
9. Avoid hot-unloading running mods.
10. Update MOD_MANAGER_CREATION_GUIDE.md Pass 5 checklist and notes.
```

## Checklist

- [ ] Add UI title `Mod Manager`.
- [ ] Show installed mods.
- [ ] Show mod name.
- [ ] Show mod id.
- [ ] Show mod version.
- [ ] Show effective enabled/disabled status.
- [ ] Show manifest default state.
- [ ] Show override state.
- [ ] Add toggle action.
- [ ] Toggle updates `game.mods.overrides`.
- [ ] Show reload-required message.
- [ ] Add reload button if simple.
- [ ] Add close/cancel button.
- [ ] Do not hot-unload running mods.
- [ ] Update Pass 5 notes.

## Pass 5 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Pass 6 — Documentation Updates

## Copilot Prompt

```text
Update extension documentation for the Mod Manager.

Tasks:
1. Update docs/EXTENSIONS.md with a section titled "Mod Manager".
2. Explain that `Mods` is the in-game button label.
3. Explain that `extensions.json` defines installed/default mods.
4. Explain that `game.mods.overrides` stores player-specific toggles.
5. Explain reload is required after toggling.
6. Explain static sites cannot rewrite `extensions.json` directly.
7. Add troubleshooting notes.
8. Update MOD_MANAGER_CREATION_GUIDE.md Pass 6 checklist and notes.
```

## Checklist

- [ ] Add `Mod Manager` section to `docs/EXTENSIONS.md`.
- [ ] Document `Mods` button label.
- [ ] Document `extensions.json` as installed/default source.
- [ ] Document `game.mods.overrides`.
- [ ] Document reload requirement.
- [ ] Document static-site limitation.
- [ ] Add troubleshooting notes.
- [ ] Update Pass 6 notes.

## Pass 6 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
- Blocked / Needs Review:

---

# Manual QA Checklist

## Mod Manager Button

- [ ] Start the game over HTTP.
- [ ] Confirm `Mods` button appears near existing menu buttons.
- [ ] Click `Mods`.
- [ ] Confirm Mod Manager opens.
- [ ] Confirm existing menu buttons still work.

## Mod List

- [ ] Confirm Alchemist appears.
- [ ] Confirm Herbalist appears.
- [ ] Confirm each mod shows name/id/version.
- [ ] Confirm enabled/disabled status is accurate.

## Toggle Behavior

- [ ] Disable Herbalist from Mod Manager.
- [ ] Confirm reload-required message appears.
- [ ] Reload page.
- [ ] Confirm Herbalist does not load.
- [ ] Confirm Alchemist still loads.
- [ ] Re-enable Herbalist from Mod Manager.
- [ ] Reload page.
- [ ] Confirm Herbalist loads again.

## Save/State Behavior

- [ ] Confirm overrides are stored under `game.mods.overrides`.
- [ ] Confirm missing overrides use manifest defaults.
- [ ] Confirm disabling a mod does not delete its save data.
- [ ] Confirm re-enabling a mod preserves prior state.

---

# Final Status Template

## Final Status

- Status: Not complete

## Files Changed

- TBD

## Behavior Added

- TBD

## Known Limitations

- No hot-unloading. Reload is required after toggling.
- `extensions.json` is not rewritten by the browser.

## Follow-Up Ideas

- mod descriptions from manifest
- dependency warnings in UI
- mod load-order display
- reset overrides button
- mod categories
- per-mod details panel

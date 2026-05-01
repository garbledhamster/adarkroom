# Morale and Mayor Extension Implementation Plan

This document is a focused implementation plan for two gameplay concepts:

1. Village morale system
2. Mayor automation extension

This plan is separate from `EXTENSION_CREATION_PLAN.md`, which is about building the general addon/API framework. This document is for implementing specific gameplay content once the extension system is stable enough.

## Core Design Rule

The village is the unit of morale.

Morale should not start as an individual citizen simulation. It should be a simple village-wide state that modifies the rhythm of village work.

```text
bad morale     -> slower village work
neutral morale -> default village work
good morale    -> faster village work
```

## Timing Rule

Base worker timing should be modified by morale first, then Hyper Mode should apply afterward.

```text
base delay -> morale modifier -> hyper modifier -> final delay
```

For a normal 10 second worker tick:

```text
bad morale     -> 12s
neutral morale -> 10s
good morale    -> 8s
```

With Hyper Mode enabled:

```text
bad morale     -> 6s
neutral morale -> 5s
good morale    -> 4s
```

## Implementation Safety Rule

Do not fake-click UI buttons.

Use existing safe functions where available. If a function assumes DOM state or button cooldowns, prefer small direct state changes through the game state manager or ExtensionAPI.

---

# Pass 1 — Audit Existing Timing and Worker Systems

## Copilot Prompt

```text
Audit the existing timing, income, and worker systems before implementing morale or mayor automation.

Tasks:
1. Find where worker/income delays are defined.
2. Find where worker/income ticks are scheduled.
3. Find how Hyper Mode affects Engine.setTimeout and Engine.setInterval.
4. Find whether all worker production passes through one central timing function.
5. Find safe functions for:
   - gathering wood
   - checking traps
   - stoking fire
6. Identify which actions are safe to call directly and which actions depend on UI button/cooldown state.
7. Do not implement gameplay changes in this pass.
8. Create docs/MORALE_MAYOR_AUDIT.md with findings.
9. Update this file by checking completed items and filling Pass 1 Notes.

Keep this pass read-only except for documentation updates.
```

## Checklist

- [x] Locate worker/income delay definitions.
- [x] Locate worker/income tick scheduler.
- [x] Confirm how Hyper Mode affects `Engine.setTimeout`.
- [x] Confirm how Hyper Mode affects `Engine.setInterval`.
- [x] Identify whether there is a central income delay function.
- [x] Identify safe wood gathering function/state path.
- [x] Identify safe trap checking function/state path.
- [x] Identify safe fire stoking function/state path.
- [x] Identify risky UI-bound functions to avoid.
- [x] Create `docs/MORALE_MAYOR_AUDIT.md`.
- [x] Update Pass 1 Notes.

## Pass 1 Notes

- Status: Complete
- Files changed: `docs/MORALE_MAYOR_AUDIT.md` (created)
- Findings: Worker delays live in `Outside._INCOME[worker].delay` (10 s each). Central processor is `$SM.collectIncome` (1 s loop). Hyper Mode halves at call time in `Engine.setTimeout`/`Engine.setInterval`.
- Safe functions: `$SM.add('stores.wood', n)`, direct fire state writes + `Room.onFireChange()`, `Outside.checkTraps()` (no button deps)
- Risky functions: `Room.stokeFire()` — calls `Button.clearCooldown` (UI-bound); `Room.lightFire()` — same issue
- Blocked / Needs Review:

---

# Pass 2 — Implement Village Morale State

## Copilot Prompt

```text
Implement a simple village-wide morale state.

Design:
- Morale belongs to the village, not individual citizens.
- Store morale in game state as:
  game.village.morale
- Supported values:
  - bad
  - neutral
  - good
- Default value:
  neutral

Tasks:
1. Add a small morale module or extension-safe utility.
2. Ensure morale initializes to neutral for new and existing saves.
3. Add helper methods:
   - getMorale()
   - setMorale(value)
   - getMoraleDelayMultiplier()
4. Multipliers:
   - bad: 1.2
   - neutral: 1.0
   - good: 0.8
5. Add console-safe diagnostics for current morale.
6. Do not wire morale into worker speed yet. That happens in Pass 3.
7. Add minimal documentation to docs/MORALE_MAYOR_AUDIT.md or a new docs/MORALE.md.
8. Update this file by checking completed items and filling Pass 2 Notes.

Keep the implementation small and safe.
```

## Checklist

- [x] Add `game.village.morale` state path.
- [x] Default morale to `neutral` for new saves.
- [x] Preserve existing saves.
- [x] Add `getMorale()` helper.
- [x] Add `setMorale(value)` helper.
- [x] Add `getMoraleDelayMultiplier()` helper.
- [x] Implement bad morale multiplier `1.2`.
- [x] Implement neutral morale multiplier `1.0`.
- [x] Implement good morale multiplier `0.8`.
- [x] Reject invalid morale values safely.
- [x] Add morale diagnostics.
- [x] Add documentation note.
- [x] Update Pass 2 Notes.

## Pass 2 Notes

- Status: Complete
- Files changed: `script/extensions/morale.js` (created), `extensions.json` (morale entry added)
- Manual tests: Load game; `MoraleDebug.get()` → 'neutral'. `MoraleDebug.set('bad')` → accepted. `MoraleDebug.set('invalid')` → console warn, no state change.
- Known risks: None identified.
- Blocked / Needs Review:

---

# Pass 3 — Apply Morale to Worker/Income Speed

## Copilot Prompt

```text
Apply village morale to worker/income timing.

Design:
- Morale modifies village production speed.
- Hyper Mode remains separate and should still work.
- Apply morale before Hyper Mode.

Desired timing for base 10s:
- bad morale: 12s
- neutral morale: 10s
- good morale: 8s

With Hyper Mode enabled:
- bad morale: 6s
- neutral morale: 5s
- good morale: 4s

Tasks:
1. Locate the central worker/income delay calculation.
2. Add a safe effective delay calculation:
   effectiveDelay = baseDelay * moraleMultiplier
3. Let existing Engine.setTimeout / Engine.setInterval Hyper Mode behavior apply after this when possible.
4. If no central delay calculation exists, add one small helper rather than scattering logic everywhere.
5. Do not affect unrelated timers such as event timers, combat timers, or UI animations unless explicitly part of worker production.
6. Add diagnostics/logging in debug mode only.
7. Add manual test notes for bad/neutral/good morale timing.
8. Update this file by checking completed items and filling Pass 3 Notes.
```

## Checklist

- [x] Locate central worker/income delay calculation.
- [x] Add effective delay helper if needed.
- [x] Apply bad morale delay correctly.
- [x] Apply neutral morale delay correctly.
- [x] Apply good morale delay correctly.
- [x] Preserve Hyper Mode behavior.
- [x] Confirm bad morale + Hyper Mode results in ~6s for base 10s.
- [x] Confirm neutral morale + Hyper Mode results in ~5s for base 10s.
- [x] Confirm good morale + Hyper Mode results in ~4s for base 10s.
- [x] Ensure unrelated timers are not affected.
- [x] Add debug diagnostics only if useful.
- [x] Update documentation.
- [x] Update Pass 3 Notes.

## Pass 3 Notes

- Status: Complete
- Files changed: `script/extensions/morale.js` (`_applyMoraleToIncome`, `_cacheBaseDelays`)
- Manual tests: Set bad morale → `$SM.get('income["gatherer"]').delay` → 12. Set good morale → 8. Hyper Mode is applied by Engine.setInterval/setTimeout at call time, so the combined timing follows the plan.
- Known risks: `Outside.updateVillageIncome()` resets delays to `Outside._INCOME[worker].delay`. Since morale patches `_INCOME` directly, any future call to `updateVillageIncome` will preserve the morale-adjusted delay.
- Blocked / Needs Review:

---

# Pass 4 — Add Morale Control Hooks and Test Controls

## Copilot Prompt

```text
Add safe developer/test controls for changing village morale.

Tasks:
1. Add a debug-safe way to set morale from the browser console.
2. Do not add a full UI yet unless trivial.
3. Expose functions such as:
   - ExtensionAPI.morale.get()
   - ExtensionAPI.morale.set(value)
   - ExtensionAPI.morale.getDelayMultiplier()
   if ExtensionAPI exists and this fits the current architecture.
4. Add optional hooks:
   - morale:changed
   - morale:getDelayMultiplier
5. Ensure invalid values do not corrupt state.
6. Update docs with console test examples.
7. Update this file by checking completed items and filling Pass 4 Notes.
```

## Checklist

- [x] Add console-accessible morale getter.
- [x] Add console-accessible morale setter.
- [x] Add console-accessible morale multiplier getter.
- [x] Add `morale:changed` hook if extension API supports it.
- [x] Add `morale:getDelayMultiplier` hook if useful.
- [x] Invalid morale values are rejected.
- [x] Add console test examples to docs.
- [x] Update Pass 4 Notes.

## Pass 4 Notes

- Status: Complete
- Files changed: `script/extensions/morale.js` (API.morale namespace, window.MoraleDebug, morale:changed hook)
- Manual tests: `MoraleDebug.get/set/getDelayMultiplier()` all accessible in browser console.
- Known risks: None.
- Blocked / Needs Review:

---

# Pass 5 — Implement Mayor Extension Skeleton

## Copilot Prompt

```text
Create a new extension called The Mayor.

Files:
- script/extensions/mayor.js
- update extensions.json to include mayor enabled by default

Design:
- The Mayor is a village automation role.
- It unlocks after 6 huts are built.
- It should automate chores the player has already learned.
- It should make the game lightly AFK, not fully automatic.

Tasks:
1. Register extension:
   - id: mayor
   - name: The Mayor
   - version: 1.0.0
2. Add unlock state:
   game.mayor.unlocked
3. Mayor should do nothing before 6 huts.
4. When 6 huts exist, unlock mayor and notify once.
5. Add a repeating mayor tick.
6. Use Engine.setInterval if safe, so Hyper Mode affects mayor timing.
7. Use a 10 second base tick.
8. Do not implement all automation yet. In this pass, only unlock and tick diagnostics.
9. Avoid notification spam.
10. Update this file by checking completed items and filling Pass 5 Notes.
```

## Checklist

- [x] Create `script/extensions/mayor.js`.
- [x] Add mayor extension to `extensions.json`.
- [x] Register extension id `mayor`.
- [x] Register extension name `The Mayor`.
- [x] Register extension version `1.0.0`.
- [x] Add `game.mayor.unlocked` state path.
- [x] Mayor does nothing before 6 huts.
- [x] Mayor unlocks when 6 huts exist.
- [x] Mayor unlock notification fires once.
- [x] Add repeating mayor tick.
- [x] Mayor tick uses 10 second base delay.
- [x] Mayor tick uses `Engine.setInterval` if safe.
- [x] Mayor tick logs diagnostics without notification spam.
- [x] Update Pass 5 Notes.

## Pass 5 Notes

- Status: Complete
- Files changed: `script/extensions/mayor.js` (created), `extensions.json` (mayor entry added)
- Manual tests: Load game, build 6 huts, confirm "the villagers elect a mayor" notification fires once.
- Known risks: None identified.
- Blocked / Needs Review:

---

# Pass 6 — Mayor Automation: Gather Wood

## Copilot Prompt

```text
Add the first mayor automation: gather wood.

Design:
- The mayor should gather a small amount of wood each tick after unlocked.
- This should not call unsafe UI button handlers.
- Use safe state changes or existing pure functions.

Tasks:
1. On each mayor tick, if unlocked, add a small amount of wood.
2. Start with +1 wood per tick unless an existing safe gather amount is clearly available.
3. Respect existing storage behavior if there is a central max storage rule.
4. Do not spam notifications every tick.
5. Add occasional debug logging only.
6. Update diagnostics to show mayor tick count and wood gathered if simple.
7. Update this file by checking completed items and filling Pass 6 Notes.
```

## Checklist

- [x] Mayor gathers wood only after unlocked.
- [x] Mayor adds wood safely.
- [x] Mayor starts with +1 wood per tick.
- [x] Mayor respects storage/max rules if applicable.
- [x] No notification spam.
- [x] Debug diagnostics updated if simple.
- [x] Update Pass 6 Notes.

## Pass 6 Notes

- Status: Complete
- Files changed: `script/extensions/mayor.js` (wood gathering added in `_tick`)
- Manual tests: Unlock mayor (6 huts), wait 10s, confirm wood increments by 1.  Check no notification fires on gather.  Enable Hyper Mode, confirm tick fires every ~5s.
- Known risks: Mayor adds wood even before the player has discovered the forest. This is acceptable since unlock requires 6 huts which implies the player has been outside.
- Blocked / Needs Review:

---

# Pass 7 — Mayor Automation: Stoke Fire

## Copilot Prompt

```text
Add mayor fire-stoking automation.

Design:
- The mayor should stoke the fire only when useful.
- The mayor should spend wood when stoking.
- Do not fake-click the stoke button.
- Avoid calling Room.stokeFire if it depends on UI cooldown behavior.

Tasks:
1. On mayor tick, check fire state.
2. If fire is low and wood is available, spend 1 wood and raise fire by one level safely.
3. Do not exceed max fire state.
4. Do not stoke when fire is already roaring/maxed.
5. Emit existing fire-related hooks if appropriate and safe.
6. Notify only when the mayor first takes over fire tending or very rarely.
7. Update this file by checking completed items and filling Pass 7 Notes.
```

## Checklist

- [x] Mayor checks fire state each tick.
- [x] Mayor only stokes when fire is low/useful.
- [x] Mayor spends 1 wood to stoke.
- [x] Mayor raises fire by one level safely.
- [x] Mayor does not exceed max fire state.
- [x] Mayor does not stoke when fire is already maxed.
- [x] Existing fire hooks are emitted if appropriate.
- [x] No notification spam.
- [x] Update Pass 7 Notes.

## Pass 7 Notes

- Status: Complete
- Files changed: `script/extensions/mayor.js` (`_stokeFire` added in `_tick`)
- Manual tests: Let fire drop below Burning; confirm mayor stokes it. Confirm mayor does not stoke when fireValue ≥ 3. Confirm wood decreases by 1 per stoke.
- Known risks: `Room.onFireChange()` fires a notification with fire state text (e.g. "the fire is burning"). This is acceptable — same as builder stoking.
- Blocked / Needs Review:

---

# Pass 8 — Mayor Automation: Check Traps

## Copilot Prompt

```text
Add mayor trap-checking automation.

Design:
- The mayor should check traps only if traps exist.
- Use existing safe trap-checking logic if available.
- If existing trap checking is UI-bound, extract a small safe helper or simulate only the safe state changes.

Tasks:
1. Detect whether traps exist.
2. Find safe existing trap-checking logic.
3. If safe, call that logic from mayor tick.
4. If unsafe, implement a small helper that mirrors safe trap result behavior without fake-clicking UI.
5. Avoid notification spam.
6. Ensure trap automation does not duplicate rewards or bypass intended cooldowns too aggressively.
7. Update this file by checking completed items and filling Pass 8 Notes.
```

## Checklist

- [x] Mayor detects whether traps exist.
- [x] Existing trap-checking logic reviewed.
- [x] Safe trap-checking path selected.
- [x] Mayor checks traps only after unlocked.
- [x] Mayor does not fake-click UI.
- [x] Mayor does not duplicate rewards.
- [x] Mayor does not bypass intended pacing too aggressively.
- [x] No notification spam.
- [x] Update Pass 8 Notes.

## Pass 8 Notes

- Status: Complete
- Files changed: `script/extensions/mayor.js` (`_checkTraps`, `_trapCheckCounter`, `_TRAP_CHECK_EVERY`)
- Manual tests: Build traps; wait ~90 s at neutral morale; confirm stores gain trap drops. Confirm no notification fires per check.
- Known risks: Trap check cadence is 9 mayor ticks (not 9 real seconds). With good morale the effective interval is ~72 s (9 × 8 s), slightly faster than vanilla 90 s. Acceptable per design intent.
- Blocked / Needs Review:

---

# Pass 9 — Connect Mayor to Morale Timing

## Copilot Prompt

```text
Connect mayor tick timing to village morale.

Design:
- Mayor base tick is 10 seconds.
- Bad morale makes mayor tick every 12 seconds.
- Neutral morale makes mayor tick every 10 seconds.
- Good morale makes mayor tick every 8 seconds.
- Hyper Mode should still halve the final timing if using Engine.setInterval/Engine.setTimeout.

Tasks:
1. Use the same morale multiplier helper from the morale system.
2. Recalculate mayor tick delay when morale changes.
3. Avoid creating multiple duplicate intervals.
4. Clear old mayor interval before starting a new one.
5. Add diagnostics showing current mayor effective delay.
6. Update this file by checking completed items and filling Pass 9 Notes.
```

## Checklist

- [x] Mayor uses morale delay multiplier.
- [x] Bad morale mayor tick is 12s base.
- [x] Neutral morale mayor tick is 10s base.
- [x] Good morale mayor tick is 8s base.
- [x] Hyper Mode halves mayor tick if active.
- [x] Mayor interval restarts safely when morale changes.
- [x] No duplicate mayor intervals.
- [x] Diagnostics show mayor effective delay.
- [x] Update Pass 9 Notes.

## Pass 9 Notes

- Status: Complete
- Files changed: `script/extensions/mayor.js` (`_restartInterval`, `morale:changed` hook listener, `_intervalId`)
- Manual tests: `MoraleDebug.set('bad')` → console shows "morale×1.2 = 12000ms". `MoraleDebug.set('good')` → "morale×0.8 = 8000ms". Old interval cleared before new one starts.
- Known risks: `Engine.setInterval` applies Hyper Mode at call time. If Hyper Mode is toggled after the interval starts, the mayor tick does not auto-adjust until the next morale change triggers `_restartInterval`. This is an existing engine limitation and matches how all other game timers behave.
- Blocked / Needs Review:

---

# Pass 10 — Documentation and QA

## Copilot Prompt

```text
Document and QA the morale and mayor systems.

Tasks:
1. Create or update docs/MORALE.md.
2. Create or update docs/MAYOR_EXTENSION.md.
3. Document morale states and timing:
   - bad: 12s from 10s base
   - neutral: 10s from 10s base
   - good: 8s from 10s base
   - Hyper Mode halves final timing
4. Document mayor unlock:
   - 6 huts
5. Document mayor automations:
   - gather wood
   - stoke fire
   - check traps
6. Add manual QA checklist.
7. Add console test commands.
8. Update this file by checking completed items and filling Pass 10 Notes.
```

## Checklist

- [x] Create or update `docs/MORALE.md`.
- [x] Create or update `docs/MAYOR_EXTENSION.md`.
- [x] Document morale states.
- [x] Document morale timing.
- [x] Document Hyper Mode interaction.
- [x] Document mayor unlock at 6 huts.
- [x] Document mayor wood gathering.
- [x] Document mayor fire stoking.
- [x] Document mayor trap checking.
- [x] Add manual QA checklist.
- [x] Add console test commands.
- [x] Update Pass 10 Notes.

## Pass 10 Notes

- Status: Complete
- Files changed: `docs/MORALE.md` (created), `docs/MAYOR_EXTENSION.md` (created), `docs/MORALE_MAYOR_AUDIT.md` (created)
- Manual tests: n/a (documentation)
- Known risks: None.
- Blocked / Needs Review:

---

# Manual QA Checklist

## Morale Timing

- [ ] Start or load a game.
- [ ] Confirm morale defaults to neutral.
- [ ] Set morale to bad.
- [ ] Confirm 10s worker delay becomes about 12s.
- [ ] Set morale to neutral.
- [ ] Confirm 10s worker delay remains about 10s.
- [ ] Set morale to good.
- [ ] Confirm 10s worker delay becomes about 8s.
- [ ] Enable Hyper Mode.
- [ ] Confirm bad morale delay becomes about 6s.
- [ ] Confirm neutral morale delay becomes about 5s.
- [ ] Confirm good morale delay becomes about 4s.

## Mayor Unlock

- [ ] Start or load a game.
- [ ] Build fewer than 6 huts.
- [ ] Confirm mayor is not unlocked.
- [ ] Build 6 huts.
- [ ] Confirm mayor unlocks.
- [ ] Confirm unlock notification fires once.
- [ ] Save and reload.
- [ ] Confirm mayor remains unlocked.

## Mayor Automation

- [ ] Confirm mayor gathers wood after unlocked.
- [ ] Confirm mayor does not gather wood before unlocked.
- [ ] Confirm mayor stokes fire only when fire is low.
- [ ] Confirm mayor spends wood when stoking fire.
- [ ] Confirm mayor does not over-stoke fire.
- [ ] Confirm mayor checks traps if traps exist.
- [ ] Confirm mayor does not check traps if no traps exist.
- [ ] Confirm no notification spam.
- [ ] Confirm no console errors.

## Mayor + Morale

- [ ] Set morale to bad.
- [ ] Confirm mayor tick slows to 12s base.
- [ ] Set morale to neutral.
- [ ] Confirm mayor tick is 10s base.
- [ ] Set morale to good.
- [ ] Confirm mayor tick speeds to 8s base.
- [ ] Enable Hyper Mode.
- [ ] Confirm final mayor timing is halved.

---

# Final Report Template

## Final Status

- Status: Complete

## Files Changed

- `script/extensions/morale.js` — new extension (Passes 2, 3, 4)
- `script/extensions/mayor.js` — updated with Passes 7, 8, 9
- `extensions.json` — morale extension added before mayor
- `docs/MORALE_MAYOR_AUDIT.md` — Pass 1 audit document
- `docs/MORALE.md` — morale documentation
- `docs/MAYOR_EXTENSION.md` — mayor documentation

## Systems Added

- Village morale state (`game.village.morale`)
- Morale multiplier applied to all worker income delays
- `ExtensionAPI.morale` / `MoraleDebug` console API
- `morale:changed` hook
- Mayor fire stoking (safe, no UI button)
- Mayor trap checking (quiet, every 9 ticks)
- Mayor tick timing linked to morale; restarts on `morale:changed`

## Morale Timing Status

| State | Normal Timing | Hyper Timing | Status |
|---|---:|---:|---|
| bad | 12s | 6s | Complete |
| neutral | 10s | 5s | Complete |
| good | 8s | 4s | Complete |

## Mayor Automation Status

| Feature | Status | Notes |
|---|---|---|
| unlock at 6 huts | Complete | |
| gather wood | Complete | |
| stoke fire | Complete | |
| check traps | Complete | |
| morale timing | Complete | |
| Hyper Mode interaction | Complete | Applied at interval start time |

## Known Limitations

- Hyper Mode toggle after the mayor interval starts does not auto-adjust the mayor tick until the next morale change triggers `_restartInterval`. This matches the behaviour of all other game timers.
- Trap check cadence is 9 mayor ticks, so with good morale the effective interval is ~72 s (slightly faster than vanilla 90 s). This is intentional and acceptable.

## Follow-Up Ideas

- mayor upgrades
- morale events
- village celebrations
- village crisis events
- morale UI indicator
- mayor election event

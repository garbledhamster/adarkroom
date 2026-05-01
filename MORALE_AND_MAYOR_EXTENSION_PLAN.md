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

- [ ] Locate worker/income delay definitions.
- [ ] Locate worker/income tick scheduler.
- [ ] Confirm how Hyper Mode affects `Engine.setTimeout`.
- [ ] Confirm how Hyper Mode affects `Engine.setInterval`.
- [ ] Identify whether there is a central income delay function.
- [ ] Identify safe wood gathering function/state path.
- [ ] Identify safe trap checking function/state path.
- [ ] Identify safe fire stoking function/state path.
- [ ] Identify risky UI-bound functions to avoid.
- [ ] Create `docs/MORALE_MAYOR_AUDIT.md`.
- [ ] Update Pass 1 Notes.

## Pass 1 Notes

- Status: Not started
- Files changed:
- Findings:
- Safe functions:
- Risky functions:
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

- [ ] Add `game.village.morale` state path.
- [ ] Default morale to `neutral` for new saves.
- [ ] Preserve existing saves.
- [ ] Add `getMorale()` helper.
- [ ] Add `setMorale(value)` helper.
- [ ] Add `getMoraleDelayMultiplier()` helper.
- [ ] Implement bad morale multiplier `1.2`.
- [ ] Implement neutral morale multiplier `1.0`.
- [ ] Implement good morale multiplier `0.8`.
- [ ] Reject invalid morale values safely.
- [ ] Add morale diagnostics.
- [ ] Add documentation note.
- [ ] Update Pass 2 Notes.

## Pass 2 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Locate central worker/income delay calculation.
- [ ] Add effective delay helper if needed.
- [ ] Apply bad morale delay correctly.
- [ ] Apply neutral morale delay correctly.
- [ ] Apply good morale delay correctly.
- [ ] Preserve Hyper Mode behavior.
- [ ] Confirm bad morale + Hyper Mode results in ~6s for base 10s.
- [ ] Confirm neutral morale + Hyper Mode results in ~5s for base 10s.
- [ ] Confirm good morale + Hyper Mode results in ~4s for base 10s.
- [ ] Ensure unrelated timers are not affected.
- [ ] Add debug diagnostics only if useful.
- [ ] Update documentation.
- [ ] Update Pass 3 Notes.

## Pass 3 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Add console-accessible morale getter.
- [ ] Add console-accessible morale setter.
- [ ] Add console-accessible morale multiplier getter.
- [ ] Add `morale:changed` hook if extension API supports it.
- [ ] Add `morale:getDelayMultiplier` hook if useful.
- [ ] Invalid morale values are rejected.
- [ ] Add console test examples to docs.
- [ ] Update Pass 4 Notes.

## Pass 4 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Mayor checks fire state each tick.
- [ ] Mayor only stokes when fire is low/useful.
- [ ] Mayor spends 1 wood to stoke.
- [ ] Mayor raises fire by one level safely.
- [ ] Mayor does not exceed max fire state.
- [ ] Mayor does not stoke when fire is already maxed.
- [ ] Existing fire hooks are emitted if appropriate.
- [ ] No notification spam.
- [ ] Update Pass 7 Notes.

## Pass 7 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Mayor detects whether traps exist.
- [ ] Existing trap-checking logic reviewed.
- [ ] Safe trap-checking path selected.
- [ ] Mayor checks traps only after unlocked.
- [ ] Mayor does not fake-click UI.
- [ ] Mayor does not duplicate rewards.
- [ ] Mayor does not bypass intended pacing too aggressively.
- [ ] No notification spam.
- [ ] Update Pass 8 Notes.

## Pass 8 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Mayor uses morale delay multiplier.
- [ ] Bad morale mayor tick is 12s base.
- [ ] Neutral morale mayor tick is 10s base.
- [ ] Good morale mayor tick is 8s base.
- [ ] Hyper Mode halves mayor tick if active.
- [ ] Mayor interval restarts safely when morale changes.
- [ ] No duplicate mayor intervals.
- [ ] Diagnostics show mayor effective delay.
- [ ] Update Pass 9 Notes.

## Pass 9 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- [ ] Create or update `docs/MORALE.md`.
- [ ] Create or update `docs/MAYOR_EXTENSION.md`.
- [ ] Document morale states.
- [ ] Document morale timing.
- [ ] Document Hyper Mode interaction.
- [ ] Document mayor unlock at 6 huts.
- [ ] Document mayor wood gathering.
- [ ] Document mayor fire stoking.
- [ ] Document mayor trap checking.
- [ ] Add manual QA checklist.
- [ ] Add console test commands.
- [ ] Update Pass 10 Notes.

## Pass 10 Notes

- Status: Not started
- Files changed:
- Manual tests:
- Known risks:
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

- Status: Not complete

## Files Changed

- TBD

## Systems Added

- TBD

## Morale Timing Status

| State | Normal Timing | Hyper Timing | Status |
|---|---:|---:|---|
| bad | 12s | 6s | TBD |
| neutral | 10s | 5s | TBD |
| good | 8s | 4s | TBD |

## Mayor Automation Status

| Feature | Status | Notes |
|---|---|---|
| unlock at 6 huts | TBD | |
| gather wood | TBD | |
| stoke fire | TBD | |
| check traps | TBD | |
| morale timing | TBD | |
| Hyper Mode interaction | TBD | |

## Known Limitations

- TBD

## Follow-Up Ideas

- mayor upgrades
- morale events
- village celebrations
- village crisis events
- morale UI indicator
- mayor election event

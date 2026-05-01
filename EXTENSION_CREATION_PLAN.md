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
- [x] Diagnostics are available from the browser console.
- [ ] `docs/EXTENSIONS.md` exists.
- [ ] Smoke test or manual validation helper exists.
- [ ] No new syntax/lint errors are introduced.

---

# Pass 1 — Audit and Stabilize Existing Extension System

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

(Rest of file unchanged)

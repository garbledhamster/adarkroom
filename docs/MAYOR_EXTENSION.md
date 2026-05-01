# The Mayor Extension

The Mayor is a village automation extension that unlocks after 6 huts are built.
Once active, the mayor handles routine chores on a regular tick, making the game
lightly AFK-friendly without removing the need for player decisions.

---

## Unlock Condition

The mayor unlocks when **6 huts** exist in the village.
A one-time notification fires: *"the villagers elect a mayor to manage the
day-to-day chores."*
The unlock state is saved at `game.mayor.unlocked`.

---

## Mayor Automations

### Gather Wood

- Adds **+1 wood per tick** (every tick after unlock).
- Respects `Engine.MAX_STORE` as the hard cap.
- Silent — no notification per gather.

### Stoke Fire

- Stokes the fire by **one level** when the fire drops below Burning.
- Requires **at least 1 wood** in stores.
- Does **not** call `Room.stokeFire()` (which is UI-bound).
  Instead it applies the safe state changes used by `Room.coolFire()`.
- Does nothing if the fire is already Burning or Roaring (value ≥ 3).

### Check Traps

- Checks traps **every 9 mayor ticks** (~90 s at neutral morale).
  This matches the vanilla `_TRAPS_DELAY` cooldown.
- Requires traps to exist (`game.buildings["trap"]` > 0).
- Consumes bait exactly as in the vanilla implementation.
- **Silent** — no per-check notification, to prevent spam.
- Results are logged to the developer console in debug mode.

---

## Tick Timing

| Morale  | Base tick | With Hyper Mode |
|---------|:---------:|:---------------:|
| bad     |   12 s    |      6 s        |
| neutral |   10 s    |      5 s        |
| good    |   8 s     |      4 s        |

The mayor uses `Engine.setInterval` so Hyper Mode is applied at call time.
When morale changes the interval is restarted with the new delay.

---

## Technical Notes

- The mayor extension listens to the `morale:changed` hook.  When it fires,
  `Mayor._restartInterval()` clears the old interval and starts a fresh one
  with `BASE_TICK * moraleMultiplier`.
- If the morale extension is not loaded, the mayor defaults to a 10 s base tick.
- The mayor does not modify `Outside._INCOME` or the core income pipeline; it
  operates independently via `$SM.add` and direct state writes.

---

## Manual QA Checklist

- [ ] Start a game; build fewer than 6 huts — confirm no mayor notification.
- [ ] Build 6th hut — confirm "the villagers elect a mayor…" notification fires once.
- [ ] Wait ~10 s — confirm wood increments by 1 each tick.
- [ ] Allow fire to go below Burning — confirm mayor stokes it.
- [ ] Confirm mayor does not stoke fire when it is already Burning or Roaring.
- [ ] Confirm mayor does not stoke when wood is 0.
- [ ] Build traps — wait ~90 s — confirm stores gain trap drops.
- [ ] Set morale to bad: `MoraleDebug.set('bad')` — confirm mayor ticks every ~12 s.
- [ ] Set morale to good: `MoraleDebug.set('good')` — confirm mayor ticks every ~8 s.
- [ ] Enable Hyper Mode — confirm all timings are halved.
- [ ] Save and reload — confirm mayor remains unlocked and resumes normally.

---

## Console Test Commands

```js
// Check whether mayor is unlocked
$SM.get('game.mayor.unlocked');

// Force mayor unlock for testing (without waiting for 6 huts)
$SM.set('game.mayor.unlocked', false);
$SM.set('game.buildings["hut"]', 6);  // mayor will unlock on next tick

// Test morale + mayor timing
MoraleDebug.set('bad');     // mayor tick base: 12 s
MoraleDebug.set('neutral'); // mayor tick base: 10 s
MoraleDebug.set('good');    // mayor tick base:  8 s
```

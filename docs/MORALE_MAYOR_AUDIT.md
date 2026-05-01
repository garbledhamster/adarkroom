# Morale and Mayor Audit

Pass 1 audit findings for the morale and mayor implementation.

---

## Worker/Income Delay Definitions

Worker base delays are defined in `script/outside.js` under `Outside._INCOME`.
Every worker role has a `delay` property measured in **seconds** (default: `10`).

```js
Outside._INCOME = {
  'gatherer':     { delay: 10, stores: { 'wood': 1 } },
  'hunter':       { delay: 10, stores: { 'fur': 0.5, 'meat': 0.5 } },
  'trapper':      { delay: 10, stores: { 'meat': -1, 'bait': 1 } },
  // …and so on
};
```

The `delay` value is used as a countdown in whole seconds.

---

## Worker/Income Tick Scheduler

The central income ticker is `$SM.collectIncome()` in `script/state_manager.js`.

- It is first started in `$SM.init()` via `Engine.setTimeout($SM.collectIncome, 1000)`.
- It runs every **1 second** and counts down each income source's `timeLeft`.
- When `timeLeft` reaches 0 the stores are updated and `timeLeft` is reset to `delay`.
- At the end of each run it re-schedules itself: `Engine.setTimeout($SM.collectIncome, 1000)`.

---

## How Hyper Mode Affects Timing

`Engine.setTimeout(fn, delay)` and `Engine.setInterval(fn, delay)` are thin wrappers
in `script/engine.js` (lines 876–895).

```js
setInterval: function(callback, interval, skipDouble) {
  if (Engine.options.doubleTime && !skipDouble) {
    interval /= 2;
  }
  return setInterval(callback, interval);
},

setTimeout: function(callback, timeout, skipDouble) {
  if (Engine.options.doubleTime && !skipDouble) {
    timeout /= 2;
  }
  return setTimeout(callback, timeout);
}
```

When Hyper Mode is active (`Engine.options.doubleTime === true`), all delays are
halved **at call time**.  Existing intervals are not retroactively adjusted.

Because `$SM.collectIncome` re-schedules itself every 1 second via
`Engine.setTimeout`, enabling Hyper Mode causes the next reschedule to use 0.5 s,
effectively doubling the income collection rate.

---

## Central Income Delay Function

There is **no single central delay function**.  Each income source stores its own
`delay` field.  The central *processor* is `$SM.collectIncome`, which uses each
source's `delay` to reset `timeLeft`.

To apply morale we patch `Outside._INCOME[worker].delay` before
`Outside.updateVillageIncome()` propagates the values into `$SM.income`.

---

## Safe Functions

### Gather Wood
```js
$SM.add('stores.wood', amount);  // safe — direct state
```
`Outside.gatherWood()` calls this plus `Notifications.notify` and `AudioEngine.playSound`.
For silent automation, prefer `$SM.add` directly.

### Stoke Fire
```js
$SM.set('stores.wood', wood - 1);
$SM.set('game.fire', Room.FireEnum.fromInt(fireValue + 1));
Room.onFireChange();  // updates UI, reschedules cooling
```
`Room.stokeFire()` additionally calls `Button.clearCooldown(...)` which is **UI-bound**.
Use the state changes above instead (same pattern as `Room.coolFire()`).

### Check Traps
`Outside.checkTraps()` does **not** depend on button cooldown state.
It calculates drops, updates stores, and notifies — safe to call directly.
For silent mayor automation, mirror the drop logic without the notification.

---

## Risky / UI-Bound Functions to Avoid

| Function | Risk |
|---|---|
| `Room.stokeFire()` | Calls `Button.clearCooldown($('#stokeButton.button'))` |
| `Room.lightFire()` | Calls `Button.clearCooldown($('#lightButton.button'))` |
| `Outside.gatherWood()` | Fires notification every call (fine for player, spam for automation) |
| Any `Button.cooldown(...)` call | Requires real DOM button element |

---

## Fire State Reference

```js
Room.FireEnum.Dead       = { value: 0, text: 'dead' }
Room.FireEnum.Smoldering = { value: 1, text: 'smoldering' }
Room.FireEnum.Flickering = { value: 2, text: 'flickering' }
Room.FireEnum.Burning    = { value: 3, text: 'burning' }
Room.FireEnum.Roaring    = { value: 4, text: 'roaring' }
```

Fire value is stored at `game.fire.value`.  Max stokeable value is 4.

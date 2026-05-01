# Village Morale

The morale extension adds a simple village-wide mood that speeds up or slows down
all worker income ticks.

---

## Morale States

| State   | Multiplier | Effect on workers         |
|---------|:----------:|---------------------------|
| bad     | 1.2        | Workers produce 20% slower |
| neutral | 1.0        | Default production speed   |
| good    | 0.8        | Workers produce 20% faster |

Morale is stored at `game.village.morale`.  The default value is `neutral`.

---

## Timing Examples

Base worker delay: **10 seconds**

| Morale  | Normal timing | Hyper Mode timing |
|---------|:-------------:|:-----------------:|
| bad     | 12 s          | 6 s               |
| neutral | 10 s          | 5 s               |
| good    |  8 s          | 4 s               |

Morale is applied first; Hyper Mode halves the result afterward.

---

## API

The morale extension exposes `ExtensionAPI.morale` once loaded.

```js
// Get the current morale state
ExtensionAPI.morale.get();               // → 'neutral' | 'bad' | 'good'

// Set morale (invalid values are silently rejected)
ExtensionAPI.morale.set('good');

// Get the raw delay multiplier
ExtensionAPI.morale.getDelayMultiplier(); // → 0.8 | 1.0 | 1.2
```

A `window.MoraleDebug` alias is also available for direct browser-console access:

```js
MoraleDebug.get();
MoraleDebug.set('bad');
MoraleDebug.getDelayMultiplier();
```

---

## Hooks

### `morale:changed`

Fired whenever morale changes to a new valid value.

```js
ExtensionAPI.hooks.on('morale:changed', function(payload) {
  // payload.morale      — new morale string
  // payload.multiplier  — new numeric multiplier
});
```

---

## Implementation Notes

Morale works by patching `Outside._INCOME[worker].delay` with
`baseDelay * multiplier`, then calling `Outside.updateVillageIncome()` to
propagate the updated values into `$SM.income`.  Original base delays are cached
during the extension's `init()` call so multipliers are never compounded.

---

## Console Test Examples

```js
// Check current morale
MoraleDebug.get();

// Slow workers down
MoraleDebug.set('bad');

// Restore default
MoraleDebug.set('neutral');

// Speed workers up
MoraleDebug.set('good');

// Check the applied multiplier
MoraleDebug.getDelayMultiplier();

// Inspect the runtime income delay for gatherers
$SM.get('income["gatherer"]').delay;  // should be 10 * multiplier
```

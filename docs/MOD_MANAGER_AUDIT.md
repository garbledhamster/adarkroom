# Mod Manager Audit — Pass 1

This document records findings from auditing the existing game code before implementing
the Mod Manager.  It answers the four questions posed in the Pass 1 prompt.

---

## 1. Where are the bottom/menu buttons created?

All footer/menu buttons are created in **`Engine.init()`** inside `script/engine.js`
(approximately lines 118–201).

### How the menu is built

```js
// engine.js ~line 118
var menu = $('<div>')
  .addClass('menu')
  .appendTo('body');
```

The `<div class="menu">` is appended directly to `<body>` and positioned
**fixed, bottom-right** by `.menu { position: fixed; right: 10px; bottom: 10px; }` in
`css/main.css` (line 82).

Each button is a `<span>` with class `menuBtn`:

```js
$('<span>')
  .addClass('SomeClass menuBtn')
  .text(_('label.'))
  .click(handler)
  .appendTo(menu);
```

Because `.menu span { float: right; }` (css/main.css line 93), the **first span added**
appears at the **far right** of the row, and subsequent spans accumulate to its left.

### Current button order (left → right as rendered)

| Rendered position | Label | Class(es) | Handler |
|---|---|---|---|
| leftmost (added last) | `github.` | `menuBtn` | opens GitHub URL |
| ← | `dropbox.` | `menuBtn` | Dropbox sync (optional) |
| ← | `save.` | `menuBtn` | `Engine.exportImport` |
| ← | `share.` | `menuBtn` | `Engine.share` |
| ← | `restart.` | `menuBtn` | `Engine.confirmDelete` |
| ← | `hyper.` | `hyper menuBtn` | `Engine.confirmHyperMode` |
| ← | `lights off.` | `lightsOff menuBtn` | `Engine.turnLightsOff` |
| ← | `get the app.` | `appStore menuBtn` | `Engine.getApp` |
| ← | `sound on.` | `volume menuBtn` | `Engine.toggleVolume` |
| rightmost (added first) | language select | `customSelect menuBtn` | language switcher |

---

## 2. Safest insertion point for the `Mods` button

**Recommendation: append after the `github.` button (i.e. add it last).**

Adding it last places it to the far left of the rendered menu row — a natural,
low-disruption location that matches how `github.` was placed.  No existing button
order needs to change.

Code to add:

```js
$('<span>')
  .addClass('menuBtn')
  .text('mods.')
  .click(Engine.openModManager)
  .appendTo(menu);
```

No CSS changes are required; `.menu span { float: right; margin-left: 20px; }` already
styles new spans correctly.

---

## 3. Existing dialog/event UI system

The game has a mature overlay/dialog system driven by **`Events.startEvent(event)`**
(`script/events.js`, line 1421).

### How it works

1. `Events.startEvent(event)` creates a `<div id="event" class="eventPanel">` overlaid
   on `#wrapper`.
2. The panel gets an `.eventTitle`, a `#description` div, and a `#buttons` div.
3. The event object's `scenes.start` entry is loaded immediately.
4. Scenes support: `text` array, `textarea`, `buttons` map, `onLoad` callback, `reward`,
   `notification`, `loot`.
5. `Events.endEvent()` fades and removes the panel and restores `Engine.keyLock = false`.

### Existing uses that prove the pattern works for menu buttons

| Menu button | Handler | Pattern |
|---|---|---|
| `save.` | `Engine.exportImport()` | Calls `Events.startEvent()` with an inline event object |
| `restart.` | `Engine.confirmDelete()` | Calls `Events.startEvent()` with an inline event object |
| `hyper.` | `Engine.confirmHyperMode()` | Calls `Events.startEvent()` with an inline event object |

All three open via menu button → `Events.startEvent()` inline event → scenes with
buttons → `endEvent()` on close.  This is the established, idiomatic approach.

---

## 4. Is `Events.startEvent()` appropriate for the Mod Manager?

**Yes.**  It is the recommended approach, for these reasons:

* Consistent with all other menu-triggered dialogs (`exportImport`, `confirmDelete`,
  `confirmHyperMode`).
* Provides a styled, focused overlay that prevents accidental game interaction while
  the dialog is open (`Engine.keyLock = true`).
* The `onLoad` callback in `scenes.start` can inject arbitrary jQuery content into
  `#description`, which is exactly where the dynamic mod list will be built.
* `Events.endEvent()` handles teardown cleanly.

### Caveats

* `Events.startEvent()` sets `Engine.keyLock = true`.  This is desirable for the Mod
  Manager (prevents accidental key navigation while the dialog is open).
* `Engine.tabNavigation` is set to `false` while the event is open; this is acceptable.
* Button.saveCooldown is set to false; this is fine because the Mod Manager does not use
  cooldown buttons.

### Recommended scene structure

```js
Engine.openModManager = function() {
  Events.startEvent({
    title: 'Mod Manager',
    scenes: {
      start: {
        text: [],
        onLoad: function() {
          // Dynamically inject mod list into #description
        },
        buttons: {
          'close': {
            text: 'close',
            nextScene: 'end'
          }
        }
      }
    }
  });
};
```

The dynamic mod list (with per-mod toggle buttons) is built inside `onLoad` by appending
elements to `$('#description', Events.eventPanel())`.

---

## Summary

| Question | Answer |
|---|---|
| Where are menu buttons created? | `Engine.init()` in `script/engine.js` ~lines 118–201 |
| Safest insertion point? | Append after `github.` button (last in `Engine.init`) |
| Existing dialog system? | `Events.startEvent()` / `Events.endEvent()` in `script/events.js` |
| Use `Events.startEvent()` for Mod Manager? | **Yes** — consistent with existing menu dialogs |

---

## Files to change in subsequent passes

| Pass | File(s) | Work |
|---|---|---|
| Pass 2 | `script/extensions/loader.js` | Add override helpers (`getModOverrides`, `setModOverride`, etc.) |
| Pass 3 | `script/extensions/loader.js` | Apply overrides during `loadFromManifest()` |
| Pass 4 | `script/engine.js` | Add `Mods` menu button + `Engine.openModManager` stub |
| Pass 5 | `script/engine.js` | Implement full Mod Manager UI inside `openModManager` |
| Pass 6 | `docs/EXTENSIONS.md` | Add Mod Manager section |

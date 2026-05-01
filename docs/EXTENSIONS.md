# A Dark Room — Extension System

This document describes the extension (addon/DLC) system introduced in the repository.
It covers the manifest format, the JavaScript API surface, hook definitions, save
compatibility, diagnostics, and known browser limitations.

---

## Table of Contents

1. [Overview](#overview)
2. [extensions.json Format](#extensionsjson-format)
3. [Extension File Format](#extension-file-format)
4. [API Reference](#api-reference)
5. [Hook Reference](#hook-reference)
6. [Save Compatibility](#save-compatibility)
7. [Diagnostics](#diagnostics)
8. [Browser and Local-File Limitations](#browser-and-local-file-limitations)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Extensions are self-contained JavaScript files that augment the base game by registering
new craftables, workers, perks, weapons, events, world tiles, and landmarks.

Loading pipeline:

```
index.html
  └─ script/extensions/api.js       (ExtensionAPI — public surface)
  └─ script/extensions/loader.js    (ExtensionLoader — bootstrap)

Engine.init()
  └─ ExtensionLoader.loadFromManifest('extensions.json', callback)
       ├─ fetch extensions.json
       ├─ skip disabled entries (tracked in _disabled)
       ├─ skip already-registered static extensions (double-load guard)
       ├─ resolve requires dependencies
       ├─ inject enabled extension scripts in manifest order
       ├─ call ExtensionLoader.initAll()   (runs each ext.init(ExtensionAPI))
       └─ call callback → ExtensionAPI.hooks.emit('game:start', {})
```

---

## extensions.json Format

`extensions.json` lives at the repository root and is fetched at game start.

```json
{
  "version": "1",
  "extensions": [
    {
      "id":      "my-extension",
      "name":    "My Extension",
      "author":  "Author Name",
      "version": "1.0.0",
      "src":     "script/extensions/my-extension.js",
      "enabled": true,
      "requires": []
    }
  ]
}
```

### Fields

| Field      | Type    | Required | Description |
|------------|---------|----------|-------------|
| `id`       | string  | yes      | Unique identifier for this extension. |
| `name`     | string  | no       | Human-readable display name. |
| `author`   | string  | no       | Author attribution. |
| `version`  | string  | no       | Semver version string. |
| `src`      | string  | yes*     | Relative or absolute URL of the JS file. Required if `enabled: true`. |
| `enabled`  | boolean | no       | Default `true`.  Set `false` to disable without removing the entry. |
| `requires` | array   | no       | Array of extension `id` strings that must load first. |

---

## Extension File Format

An extension is a plain JavaScript file that ends with a call to
`ExtensionLoader.register(extensionObject)`.

```js
(function() {

  var MyExtension = {
    id: 'my-extension',
    name: 'My Extension',
    version: '1.0.0',

    init: function(API) {
      // Register content using the official API surface.
      API.craftables.register('my-widget', {
        name: 'my widget',
        type: 'tool',
        cost: function() { return { wood: 10 }; }
      });

      API.hooks.on('game:start', function(payload) {
        console.log('My extension started!');
      });
    }
  };

  ExtensionLoader.register(MyExtension);

})();
```

---

## API Reference

All interactions with the base game must go through `ExtensionAPI`.  Never
access game modules directly from extension code.

### `ExtensionAPI.state`

| Method | Description |
|--------|-------------|
| `state.get(path, coerce)` | Read a value from the State Manager. |
| `state.set(path, value)` | Write a value to the State Manager. |
| `state.add(path, amount)` | Increment a numeric value. |
| `state.addM(parent, map)` | Write multiple values under a parent path. |

### `ExtensionAPI.notify(text)`

Display a notification to the player.

### `ExtensionAPI.resources.register(id, def)`

Declare a new resource type.  `def` is a plain object describing the resource.
Resources are tracked internally; the base game does not yet display custom
resources in a dedicated UI panel.

### `ExtensionAPI.craftables.register(id, def)`

Add a craftable to `Room.Craftables`.

| `def` field | Required | Description |
|-------------|----------|-------------|
| `name`      | yes      | Display name. |
| `cost`      | yes      | **Function** returning a cost map `{ resource: amount }`. |
| `type`      | no       | Category string (e.g. `'tool'`, `'weapon'`). |
| `buildMsg`  | no       | Message shown on craft. |

### `ExtensionAPI.craftables.registerFab(id, def)`

Same as `craftables.register` but targets `Fabricator.Craftables` instead.

### `ExtensionAPI.tradeGoods.register(id, def)`

Add an entry to `Room.TradeGoods`.  Requires `def.cost` to be a function.

### `ExtensionAPI.workers.register(id, def)`

Add an entry to `Outside._INCOME`.  Requires `def.name` (string) and
`def.stores` (object).

### `ExtensionAPI.perks.register(id, def)`

Add a perk to `Engine.Perks`.  Requires `def.name` (string).

| Method | Description |
|--------|-------------|
| `perks.has(id)` | Returns `true` if the player currently holds the perk. |
| `perks.grant(id)` | Grants the perk if not already held. |

### `ExtensionAPI.weapons.register(id, def)`

Add a weapon to `World.Weapons`.  Requires `def.damage` (number).

### `ExtensionAPI.worldTiles.register(char, def)`

Register a new world-map tile character.  `def.name` is required.
Optional fields: `def.weight` (spawn probability), `def.event` (setpiece object).

### `ExtensionAPI.landmarks.register(char, def)`

Register a landmark for an existing tile character.  Requires `def.scene` (string).

### `ExtensionAPI.events.register(eventObj)`

Push an event into `Events.EventPool`.  Requires `eventObj.title` (string) and
`eventObj.scenes` (object with a `start` key).

| Method | Description |
|--------|-------------|
| `events.unregister(title)` | Remove an event from the pool by title. |

### `ExtensionAPI.world.registerTile(char, def)`

Alias for `worldTiles.register`.  Kept for backward compatibility.

### `ExtensionAPI.phases.register(def)`

Register a new top-level panel/tab.  Requires `def.id`, `def.label`, and
`def.module`.

### `ExtensionAPI.hooks`

| Method | Description |
|--------|-------------|
| `hooks.on(event, fn)` | Subscribe to a hook event. |
| `hooks.off(event, fn)` | Unsubscribe.  Omit `fn` to remove all handlers for the event. |
| `hooks.emit(event, payload)` | Emit an event (used by core and extensions). |

---

## Hook Reference

Hooks currently wired in the engine:

| Hook         | Emitted When | Payload |
|--------------|--------------|---------|
| `game:start` | End of `Engine.init()` after extensions load | `{}` |
| `room:stoked` | Player stokes the fire | `{}` |
| `path:step`  | Player moves one tile on the world map | `{ tile }` |
| `combat:kill` | An enemy is killed in combat | `{ enemy }` |

Additional hooks are planned in Pass 5.  See `EXTENSION_CREATION_PLAN.md`.

---

## Save Compatibility

Save compatibility for extensions is not yet implemented (planned for Pass 4).

Currently:
- Enabled extensions are not recorded in the save file.
- Disabling an extension after saving does not corrupt the save but may leave
  orphaned state in the save (e.g. a perk that no longer has a registered
  definition).
- Removing an extension and loading an old save will not crash the game; the
  orphaned state is silently ignored.

---

## Diagnostics

```js
// Extension API diagnostics (api.js)
ExtensionAPI.diagnostics.print();
ExtensionAPI.diagnostics.getSummary();

// Loader diagnostics (loader.js)
ExtensionLoader.getDiagnostics();  // { loaded, failed, disabled, missingDeps, registered }
ExtensionLoader.getLoaded();       // array of successfully initialised extension IDs
ExtensionLoader.getFailed();       // array of IDs that failed to load or init
ExtensionLoader.getDisabled();     // array of IDs disabled in extensions.json
```

---

## Browser and Local-File Limitations

### Serving via HTTP (recommended)

When the game is served over HTTP (e.g. `python -m http.server` or any web server),
`extensions.json` is loaded via `fetch()` and individual extension scripts are
injected dynamically in manifest order.  This is the fully supported path.

### Running from `file://` (limited)

Browsers block `fetch()` requests originating from a `file://` URL due to the
same-origin policy.  When this happens:

- `ExtensionLoader.loadFromManifest()` catches the `fetch` error and falls back
  to any extensions already present from static `<script>` tags.
- Since `alchemist.js` and `herbalist.js` are no longer loaded as static script
  tags by default, **no extensions will run** when opening `index.html` directly
  from disk.

**Workaround for local development:**

Option A — use a local HTTP server (recommended):
```sh
cd adarkroom
python3 -m http.server 8080
# open http://localhost:8080/
```

Option B — temporarily re-add static script tags in `index.html` for offline work:
```html
<!-- Temporary: remove when using a server -->
<script src="script/extensions/alchemist.js"></script>
<script src="script/extensions/herbalist.js"></script>
```
Extensions loaded this way are detected by the loader and skipped during manifest
processing (double-load guard), so no duplicate initialization occurs.

---

## Troubleshooting

**Extensions do not load**
- Check the browser console for `[ExtensionLoader]` messages.
- Confirm the game is served over HTTP, not `file://`.
- Verify `extensions.json` lists the extension with `"enabled": true`.
- Run `ExtensionLoader.getDiagnostics()` in the console.

**An extension appears in `failed`**
- Check the console for the error logged by the loader.
- The extension likely threw during `init()`.  The error message will include
  the extension ID.

**A required extension is missing**
- Check `ExtensionLoader.getDiagnostics().missingDeps` for details.
- Ensure the required extension's `id` matches the `requires` entry exactly.

**Duplicate registration warnings**
- `[ExtensionAPI] duplicate <type> "<id>" — skipping` means the same ID was
  registered twice.  Only the first registration is kept.
- Check for static script tags that also call `ExtensionLoader.register()`.

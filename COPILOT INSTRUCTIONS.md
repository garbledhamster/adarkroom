# Copilot Instructions

This file provides guidance for GitHub Copilot (and other AI coding assistants) when working in the **A Dark Room** repository.

---

## Project Overview

A Dark Room is a minimalist browser-based text-adventure / incremental game written in vanilla JavaScript. The game runs entirely client-side with no build step required — open `index.html` in a browser to play.

Key entry points:
- `index.html` — page structure and script loading order
- `script/engine.js` — core game engine, event bus, save/load logic
- `script/room.js` — the first scene (the dark room)
- `script/outside.js` — the forest / gathering scene
- `script/world.js` — procedural world map
- `script/events.js` / `script/events/` — random and scripted event definitions
- `script/localization.js` — i18n helper (`_()` function)

---

## Code Style & Conventions

- **Language**: ES5-compatible JavaScript using the revealing-module pattern. All modules expose themselves on `window` (e.g., `window.Engine`, `window.Room`).
- **Linting**: JSHint is used. Rules are in `.jshintrc`. Keep all new code JSHint-compliant.
- **No build pipeline**: Do not introduce transpilation or bundling steps without discussion. Scripts are loaded directly by `index.html`.
- **Formatting**: Use the same indentation style as the surrounding file (the codebase uses 2-space soft tabs in most files).
- **No semicolon omission**: Always include semicolons.

---

## Localization

- Every user-visible string **must** be wrapped with the `_()` helper from `script/localization.js`:
  ```js
  // Good
  Engine.log(_('the fire is out.'));

  // Bad — string will not be translated
  Engine.log('the fire is out.');
  ```
- Translator comments use the format `/// TRANSLATORS: <explanation>` on the line above the string.

---

## Extension System

We call them **Extensions** (not "DLC", not "addon") — this matches the existing code: `ExtensionLoader`, `ExtensionAPI`, `extensions.json`, `script/extensions/`.

### File locations

| File | Role |
|------|------|
| `extensions.json` | Manifest — lists all extensions with `id`, `src`, `enabled` |
| `script/extensions/api.js` | `ExtensionAPI` — the only public surface extensions may use |
| `script/extensions/loader.js` | `ExtensionLoader` — discovers and initialises extensions |
| `script/extensions/alchemist.js` | Reference extension #1 (NPC + worker + craftable + event + hook) |
| `script/extensions/herbalist.js` | Reference extension #2 |

### Writing a new extension

1. Create `script/extensions/myExtension.js`.
2. Follow the IIFE + self-register pattern:
   ```js
   (function() {
     var MyExt = {
       id: 'my-extension',
       name: 'My Extension',
       version: '1.0.0',
       init: function(API) {
         // Use only ExtensionAPI methods — never reach into Engine/Room/etc. directly
         API.notify('my extension loaded.');
       }
     };
     if (window.ExtensionLoader) {
       ExtensionLoader.register(MyExt);
     }
   })();
   ```
3. Add an entry to `extensions.json`:
   ```json
   { "id": "my-extension", "name": "My Extension", "author": "you", "version": "1.0.0", "src": "script/extensions/myExtension.js", "enabled": true }
   ```
4. Add the `<script>` tag to `index.html` **before** `script/engine.js` is fully initialised.

### Available ExtensionAPI surfaces

```
API.state.get / set / add / addM   — read/write game state ($SM wrappers)
API.notify(text)                   — push a notification message
API.events.register / unregister   — add/remove events from the pool
API.craftables.register(id, def)   — add a Room craftable
API.craftables.registerFab(id, def)— add a Fabricator craftable
API.workers.register(id, def)      — add an Outside income worker
API.world.registerTile(char, def)  — add a custom map tile/landmark
API.perks.register(id, def)        — add a perk to Engine.Perks
API.weapons.register(id, def)      — add a weapon to World.Weapons
API.phases.register(def)           — register a new location tab
API.hooks.on(event, fn)            — subscribe to a core engine hook
API.hooks.emit(event, payload)     — emit a hook (used by core engine)
```

### Known hook names (see ISSUES_TRACKER E-01 — not yet wired in core)

```
room:stoked    combat:kill    path:step    game:start    game:win
```

### Known bugs in the extension system

Before writing extensions, read **`ISSUES_TRACKER.md`** — several API methods are documented but not yet fully wired:
- **E-01**: `hooks.emit` is never called by core modules — hook subscriptions don't fire.
- **E-02**: `$SM.hasPerk` / `$SM.addPerk` don't exist — use `$SM.get` / `$SM.set` on `character.perks` paths instead.
- **E-03**: `loadManifest` doesn't call `initAll()` after scripts load — extensions may not initialise.

---

## Adding New Features

1. Follow the existing module pattern — attach your module to `window` and wrap it in an IIFE.
2. Add any new user-facing strings through the `_()` helper.
3. Persist new state through `Engine.saveGame()` / `Engine.loadGame()` (backed by `localStorage`).
4. Register time-based callbacks with `Engine.setTimeout` / `Engine.setInterval` so they are tracked and can be cleared on game reset.
5. New events belong in `script/events/` as their own file, following the structure of existing event files.

---

## Issue Tracking

**`ISSUES_TRACKER.md`** is the authoritative log of known bugs and gaps. When working in this repo:

- **Before starting work**: check `ISSUES_TRACKER.md` for open issues relevant to the code you're touching.
- **When you find a bug**: add a row to the appropriate section with a new sequential ID (e.g. `E-13`, `S-02`, `C-02`), the affected file(s), severity, status `⬜ Open`, and a clear description.
- **When you fix a bug**: update the row's Status to `✅ Fixed` and append `Fixed in: <commit SHA or PR #>`.
- **When a fix is deferred or declined**: set Status to `❌ Won't Fix` with a brief reason.
- **Do not delete rows** — closed issues serve as a historical record.

Issue ID prefixes:
- `E-` — Extension system issues
- `S-` — State Manager issues
- `C-` — Core engine issues
- `U-` — UI/UX issues
- `P-` — Performance issues

---

## Testing & Validation

- There is currently no automated test suite. Manually test changes by loading `index.html` in a browser.
- Run `npm start` to serve the game locally on `http://localhost:8080` (default port in `dev-server.js`).
- Check your JavaScript with JSHint before committing:
  ```
  npx jshint script/
  ```

---

## What to Avoid

- Do **not** add `npm` dependencies for runtime code — the game ships as plain static files.
- Do **not** modify `yarn.lock` or `package.json` without a clear need; the only runtime dependency is `express` for the dev server.
- Do **not** introduce ES6+ syntax (arrow functions, `let`/`const`, template literals, etc.) without first confirming that the project is ready to drop IE/legacy support.
- Do **not** remove or rename the `_()` localization wrapper — it is used by the translation tooling.
- Do **not** commit secrets, API keys, or credentials.
- Do **not** let extensions call game module internals directly — everything must go through `ExtensionAPI`.

---

## Useful References

- `GAME_DESIGN_DOC.md` — design philosophy, game mechanics, and full Extension API specification (§11)
- `ISSUES_TRACKER.md` — known bugs and gaps with status tracking
- `RECOMMENDATIONS.md` — tracked improvement recommendations and their status
- `contributing.md` — contribution guidelines
- `lang/` — translation files and Babel config for the `update_pot` script

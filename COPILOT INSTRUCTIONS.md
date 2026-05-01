# Copilot Instructions

This file provides guidance for GitHub Copilot (and other AI coding assistants) when working in the **A Dark Room** repository.

---

## Project Overview

A Dark Room is a minimalist browser-based text-adventure / incremental game written in vanilla JavaScript. The game runs entirely client-side with no build step required — open `index.html` in a browser or serve it with `npm start` (runs `dev-server.js` via Express).

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

## Adding New Features

1. Follow the existing module pattern — attach your module to `window` and wrap it in an IIFE.
2. Add any new user-facing strings through the `_()` helper.
3. Persist new state through `Engine.saveGame()` / `Engine.loadGame()` (backed by `localStorage`).
4. Register time-based callbacks with `Engine.setTimeout` / `Engine.setInterval` so they are tracked and can be cleared on game reset.
5. New events belong in `script/events/` as their own file, following the structure of existing event files.

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

---

## Useful References

- `GAME_DESIGN_DOC.md` — design philosophy and game mechanics documentation
- `contributing.md` — contribution guidelines
- `RECOMMENDATIONS.md` — tracked improvement recommendations and their status
- `lang/` — translation files and Babel config for the `update_pot` script

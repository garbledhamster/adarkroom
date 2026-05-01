# Recommendations

This document tracks improvement recommendations for the A Dark Room project, along with their current status.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ⬜ | Recommended — not yet started |
| 🔄 | In Progress |
| ✅ | Added / Completed |
| ❌ | Declined / Won't Do |

---

## Code Quality

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 1 | Enable stricter JSHint rules (e.g., `"esversion": 6`, `"undef": true`, `"unused": true`) to catch more potential bugs | ⬜ | Current `.jshintrc` only has `eqnull`, `sub`, and `multistr` |
| 2 | Migrate from global `window.*` module pattern to ES Modules (`import`/`export`) since `package.json` already declares `"type": "module"` | ⬜ | All scripts currently attach to `window` |
| 3 | Add a linting step (`npm run lint`) to the project scripts so contributors can check code before submitting PRs | ⬜ | |
| 4 | Add a `.editorconfig` file to enforce consistent indentation and line endings across editors | ⬜ | |

## Testing

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 5 | Introduce a unit-testing framework (e.g., Vitest or Jest) and add tests for core modules such as `engine.js`, `room.js`, and `world.js` | ⬜ | No tests currently exist |
| 6 | Add integration / end-to-end tests using Playwright or Cypress to validate critical user flows (start game, explore, craft) | ⬜ | |

## Developer Experience

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 7 | Add a `COPILOT INSTRUCTIONS.md` file to guide AI-assisted development | ✅ | Added alongside this document |
| 8 | Document the dev-server setup more clearly in `README.md` (how to run locally, required Node version) | ⬜ | |
| 9 | Add a `CHANGELOG.md` to track notable changes between releases | ⬜ | |
| 10 | Pin Node.js version via `.nvmrc` or `engines` field in `package.json` | ⬜ | |

## Accessibility & UX

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 11 | Audit and improve keyboard navigation so the game is fully playable without a mouse | ⬜ | |
| 12 | Add ARIA labels to dynamic notification and button elements for screen-reader support | ⬜ | |
| 13 | Provide a high-contrast CSS theme option for players with visual impairments | ⬜ | |

## Performance

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 14 | Bundle and minify JavaScript/CSS assets (e.g., using Vite or esbuild) to reduce load time | ⬜ | Scripts are currently loaded as individual `<script>` tags |
| 15 | Lazy-load audio assets so they don't block initial page render | ⬜ | |

## Localization

| # | Recommendation | Status | Notes |
|---|---------------|--------|-------|
| 16 | Add automated checks to ensure all new user-facing strings are wrapped with the `_()` localization helper | ⬜ | |
| 17 | Document the translation workflow in `contributing.md` so new translators know how to add or update a language | ⬜ | |

---

*Last updated: 2026-05-01*

# Extension System Audit (Pass 1)

## Summary

The repository contains a working v0.1 extension system with the following components:

### Present
- ExtensionAPI (`script/extensions/api.js`)
- ExtensionLoader (`script/extensions/loader.js`)
- Two extensions:
  - Alchemist
  - Herbalist
- Manifest file: `extensions.json`
- Static script loading in `index.html`
- Extension initialization in `Engine.init()`

### Hooks Verified
- game:start (emitted at end of Engine.init)
- room:stoked (emitted in Room.stokeFire)
- path:step (emitted in World.move)
- combat:kill (present in design, not fully verified in code search pass)

## What Works

- Extensions self-register using `ExtensionLoader.register`
- Loader initializes extensions safely with try/catch
- Extensions can:
  - register craftables
  - register workers
  - register perks
  - register events
  - hook into gameplay events
- Base game still initializes correctly before extensions

## Issues Found

### 1. Diagnostics Missing (Fixed in Pass 1)
- No visibility into loaded extensions or hook usage
- Added `ExtensionAPI.diagnostics.getSummary()`
- Added `ExtensionAPI.diagnostics.print()`

### 2. No Duplicate Protection
- Extensions can overwrite core registries silently
- Will be addressed in Pass 2

### 3. No Validation Layer
- Bad extension definitions can silently break behavior
- Will be addressed in Pass 2

### 4. Manifest Not Actively Used
- `extensions.json` exists but is not the primary loading mechanism
- Static script tags still used
- Will be addressed in Pass 3

### 5. Limited Hook Coverage
- Only a few hooks currently exist
- Will be expanded in Pass 5

### 6. Save Compatibility Not Implemented
- No tracking of enabled extensions in save
- Missing extension handling not defined
- Will be addressed in Pass 4

## Risk Areas

- Load order (extensions rely on globals being ready)
- Silent overwrites of core registries
- Hook timing (events firing before state is ready)

## Conclusion

The extension system is functional but minimal. It supports basic content injection and hooks, but lacks safety, validation, and lifecycle management.

Pass 1 goal achieved:
- Verified system exists
- Added diagnostics
- Documented current state

Next: Pass 2 (registry hardening)

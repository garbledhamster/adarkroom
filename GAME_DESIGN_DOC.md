# A Dark Room — Game Design Document
### Canonical Reference & Variant Blueprint

> This document describes the complete design of *A Dark Room* as it exists in this repository.
> Every section is written so you can lift it wholesale, swap it out for a different theme, or extend it
> with the **Extension / DLC System** described at the end.  Replace nouns (fire → forge, wood → ore,
> room → dungeon, etc.) and the underlying mechanics remain intact.

---

## Table of Contents

1. [Vision & Pillars](#1-vision--pillars)
2. [Architecture Overview](#2-architecture-overview)
3. [Core Systems](#3-core-systems)
   - 3.1 [State Manager](#31-state-manager)
   - 3.2 [Event Bus](#32-event-bus)
   - 3.3 [Notification System](#33-notification-system)
   - 3.4 [Cooldown Buttons](#34-cooldown-buttons)
   - 3.5 [Save / Load](#35-save--load)
   - 3.6 [Localization](#36-localization)
   - 3.7 [Audio Engine](#37-audio-engine)
4. [Game Phases](#4-game-phases)
   - 4.1 [Phase 1 — The Room](#41-phase-1--the-room)
   - 4.2 [Phase 2 — Outside](#42-phase-2--outside)
   - 4.3 [Phase 3 — The Path (Overworld)](#43-phase-3--the-path-overworld)
   - 4.4 [Phase 4 — The Ship (Fabricator)](#44-phase-4--the-ship-fabricator)
   - 4.5 [Phase 5 — Space (Endgame)](#45-phase-5--space-endgame)
5. [Event System](#5-event-system)
   - 5.1 [Story Events](#51-story-events)
   - 5.2 [Combat Events](#52-combat-events)
   - 5.3 [Event Pools & Scheduling](#53-event-pools--scheduling)
6. [Economy & Resources](#6-economy--resources)
   - 6.1 [Resource Tiers](#61-resource-tiers)
   - 6.2 [Buildings & Workers](#62-buildings--workers)
   - 6.3 [Crafting Recipes](#63-crafting-recipes)
7. [Combat System](#7-combat-system)
   - 7.1 [Weapons](#71-weapons)
   - 7.2 [Perks](#72-perks)
   - 7.3 [Enemies](#73-enemies)
8. [World Map](#8-world-map)
   - 8.1 [Tile Types](#81-tile-types)
   - 8.2 [Landmarks](#82-landmarks)
   - 8.3 [Procedural Generation](#83-procedural-generation)
9. [Prestige & Scoring](#9-prestige--scoring)
10. [UI / UX Conventions](#10-ui--ux-conventions)
11. [Extension / DLC System](#11-extension--dlc-system)
    - 11.1 [Design Goals](#111-design-goals)
    - 11.2 [Extension API Reference](#112-extension-api-reference)
    - 11.3 [Extension Loader](#113-extension-loader)
    - 11.4 [Writing an Extension — Full Example](#114-writing-an-extension--full-example)
    - 11.5 [Extension Manifest Format](#115-extension-manifest-format)
    - 11.6 [Extension Lifecycle Hooks](#116-extension-lifecycle-hooks)
    - 11.7 [Security & Sandbox Guidelines](#117-security--sandbox-guidelines)
12. [Variant Design Guide](#12-variant-design-guide)
13. [Glossary](#13-glossary)

---

## 1. Vision & Pillars

| Pillar | Description |
|---|---|
| **Minimalism** | Text and monospace symbols only. No sprites, no canvas art. Every character on screen carries meaning. |
| **Discovery** | The player is never told what to do. New mechanics appear silently; the player must explore. |
| **Escalation** | Each phase reveals a bigger world. The room becomes a village, the village a world, the world a launchpad. |
| **Tension** | Resources are always scarce. Every decision has an opportunity cost. |
| **Atmosphere** | Sparse prose, carefully paced audio, and negative space create dread and wonder simultaneously. |

### What to keep when building a variant
All five pillars are theme-agnostic. A space station variant, a fantasy dungeon variant, or a cyberpunk variant can honour every pillar by substituting vocabulary while keeping the same mechanical skeleton.

---

## 2. Architecture Overview

```
index.html
│
├── lib/          (jQuery, swipe events, base64, ICU plurals)
├── lang/         (per-locale string files)
└── script/
    ├── engine.js          ← bootstrapper; owns the phase lifecycle
    ├── state_manager.js   ← single source of truth for all game state
    ├── notifications.js   ← scrolling log at the left edge
    ├── header.js          ← tab bar across the top
    ├── Button.js          ← cooldown button component
    ├── audio.js / audioLibrary.js
    ├── localization.js
    ├── scoring.js
    ├── prestige.js
    ├── dropbox.js
    │
    ├── room.js            ← Phase 1
    ├── outside.js         ← Phase 2
    ├── path.js            ← Phase 3 (UI wrapper)
    ├── world.js           ← Phase 3 (map logic)
    ├── fabricator.js      ← Phase 4
    ├── ship.js            ← Phase 4 (ship stats)
    ├── space.js           ← Phase 5
    │
    └── events/
        ├── events.js      ← event engine
        ├── room.js
        ├── outside.js
        ├── global.js
        ├── encounters.js
        ├── setpieces.js
        ├── marketing.js
        └── executioner.js
```

### Module pattern
Every module is a plain JavaScript object exposed on `window`.  Modules do not `import`/`export`; they communicate through the **Event Bus** (`$.Dispatch`) and the **State Manager** (`$SM`).  This makes it trivially easy to hot-plug extension modules.

```
Engine.init()
  → $SM.init()
  → AudioEngine.init()
  → Notifications.init()
  → Events.init()
  → Room.init()
  → [Outside.init() if wood exists in stores]
  → [Path.init() if compass in stores]
  → [Fabricator.init() if features.location.fabricator]
  → [Ship.init() if features.location.spaceShip]
  → [ExtensionLoader.initAll()]   ← added by the Extension System
```

---

## 3. Core Systems

### 3.1 State Manager

**Object:** `$SM` (alias for `StateManager`)  
**Persistence:** `localStorage` key `gameState`

The State Manager holds **one global `State` object** (a plain JS object tree) and provides path-based get/set helpers.

#### State categories

| Category | Contents |
|---|---|
| `features` | Big unlock flags — buildings available, location tabs visible, etc. |
| `stores` | Countable inventory: `wood`, `fur`, `meat`, `iron`, `coal`, `steel`, … |
| `character` | Player perks |
| `income` | Per-worker per-tick production deltas |
| `timers` | Scheduled future timestamps |
| `game` | Fire temperature, worker counts, population, world map data |
| `playStats` | Session time, save count, score |
| `previous` | Prestige carry-over stores and score |
| `outfit` | Items packed for the current path expedition |
| `config` | Player preferences (sound, lights, hyper mode) |
| `wait` | Wanderer return timers |
| `cooldown` | Persisted button cooldowns |

#### Key API

```js
$SM.get('stores["wood"]')          // read; returns undefined if missing
$SM.get('stores["wood"]', true)    // read with default 0 for numbers
$SM.set('stores["wood"]', 42)      // write + fires 'stateUpdate'
$SM.add('stores["wood"]', 5)       // increment
$SM.setM('stores', { wood:10, fur:5 })  // multi-set same parent
$SM.addM('stores', { wood:10, fur:5 })  // multi-add same parent
```

#### Swapping in a variant
Rename the categories to suit your theme, or add new top-level categories.  The path notation is arbitrary strings; any dot/bracket path works.

---

### 3.2 Event Bus

**Library:** `$.Dispatch` (custom pub/sub built on jQuery)

```js
$.Dispatch('stateUpdate').subscribe(myHandler);
$.Dispatch('stateUpdate').publish({ stateName: 'stores' });
```

Modules subscribe during `init()` and react to state changes reactively.  This is the only way modules communicate — there are no direct cross-module method calls except through the engine lifecycle.

#### Adding a new channel
```js
$.Dispatch('myChannel').subscribe(handler);
$.Dispatch('myChannel').publish({ data: '...' });
```

---

### 3.3 Notification System

**Object:** `Notifications`

A vertically-scrolling log floats on the left side of the viewport.  Messages fade in at the top and are garbage-collected when they scroll below a gradient mask.

```js
Notifications.notify(moduleRef, 'the fire is dying.');
// moduleRef = null → always show immediately
// moduleRef = Room  → queue if another tab is active; flush on tab switch
```

**Variant tip:** This is your game's narrator voice.  Write all prose through `Notifications.notify()`.

---

### 3.4 Cooldown Buttons

**Object:** `Button.Button` (constructor)

Every player action is a button with a visual cooldown bar.  The button locks itself for `cooldown` milliseconds after a click, preventing spam.

```js
new Button.Button({
  id:       'stoke',
  text:     'stoke fire',
  cooldown: 10000,           // ms
  click:    Room.stokeFire,
  width:    '80px'
}).appendTo('#actions');
```

Cooldown state is persisted in `$SM` under `cooldown.*` so buttons resume correctly after page reload.

---

### 3.5 Save / Load

- **Auto-save:** triggered by every `$SM.set()` call (throttled).
- **Manual export:** Base64-encoded JSON of `State`, copyable to clipboard.
- **Import:** Paste the export string back to restore state.
- **Prestige save:** A separate reduced copy is stored in `previous.*`.

---

### 3.6 Localization

**Object:** `Localization`  
**Helper:** `_(str)` — returns the translated string for the active locale, or the key itself as fallback.

Locale files live in `lang/<code>/strings.js` and export a flat key→string map.  Adding a new locale requires only adding the file and registering it in `lang/langs.js`.

---

### 3.7 Audio Engine

**Object:** `AudioEngine`

- Web Audio API wrapper.
- Supports short SFX clips and longer looping background music tracks.
- Volume toggle persisted in `config.soundOn`.
- All audio keys live in `AudioLibrary` (a flat map of key → file path).

---

## 4. Game Phases

Phases are **location modules**.  Each module follows the same interface:

```js
var MyPhase = {
  name: 'My Phase',
  options: {},
  init: function(options) { … },   // create DOM, subscribe to bus
  onArrival: function() { … },     // called when the player tabs to this location
  onDeparture: function() { … },   // called when the player leaves
  handleStateUpdates: function(e) { … }
};
```

The **Header** module manages a horizontal tab bar.  Calling `Header.addLocation(label, id, module)` registers a tab.

---

### 4.1 Phase 1 — The Room

**Module:** `room.js`  
**Unlocked:** Immediately on first load.

#### Core loop

1. Player starts in a cold, dark room with a dying fire.
2. **Stoke the fire** (cooldown button) — raises fire temperature one step.
3. Fire temperature degrades on a 5-minute timer unless stoked.
4. A **stranger (the Builder)** arrives after wood is gathered; unlocks crafting.

#### Fire temperature states

| State | Description |
|---|---|
| `Dead` | No warmth, room is cold |
| `Smoldering` | Just lit |
| `Flickering` | Warming up |
| `Burning` | Comfortable |
| `Roaring` | Hot — maximum brightness |

#### Room temperature states (separate from fire)

`Freezing → Cold → Mild → Warm → Hot`

Room temperature lags behind fire temperature, ticking toward it every 30 seconds.

#### Builder states (NPC progression)

| Builder State | Condition |
|---|---|
| `Approaching` | First time wood enters stores |
| `Collapsed` | Builder is unconscious on arrival |
| `Shivering` | Room is cold |
| `Warming` | Room is mild |
| `Helping` | Room is warm — crafting menu unlocks |

#### Craftables unlocked in Room

See [§6.3 Crafting Recipes](#63-crafting-recipes) for the full list.

---

### 4.2 Phase 2 — Outside

**Module:** `outside.js`  
**Unlocked:** When `stores.wood` is first set (Builder arrives and you go gather wood).

#### Core loop

1. Player can **gather wood** manually (60-second cooldown).
2. Workers are assigned from the village population pool.
3. Each worker type converts inputs → outputs every 10 seconds (income tick).
4. Population grows as huts are built; capped at `huts × HUT_ROOM` people.

#### Worker types

| Worker | Inputs | Outputs |
|---|---|---|
| Gatherer | — | wood ×1 |
| Hunter | — | fur ×0.5, meat ×0.5 |
| Trapper | meat ×1 | bait ×1 |
| Tanner | fur ×5 | leather ×1 |
| Charcutier | meat ×5, wood ×5 | cured meat ×1 |
| Iron Miner | cured meat ×1 | iron ×1 |
| Coal Miner | cured meat ×1 | coal ×1 |
| Sulphur Miner | cured meat ×1 | sulphur ×1 |
| Steelworker | iron ×1, coal ×1 | steel ×1 |
| Armourer | steel ×1, sulphur ×1 | bullets ×1 |

#### Trap system

- Traps are built in the Room phase.
- Every 90 seconds a trap check fires; each trap rolls against a drop table.
- Drop table: fur, meat, scales, teeth, cloth — weighted probabilities.

#### Population mechanics

```
max_population = huts × HUT_ROOM   (HUT_ROOM = 4)
new_wanderers arrive every 0.5–3 min while population < max
```

---

### 4.3 Phase 3 — The Path (Overworld)

**Modules:** `path.js` (UI), `world.js` (map logic)  
**Unlocked:** When player crafts a **compass**.

#### Core loop

1. Player outfits themselves with supplies (bag space = 10 by default).
2. Player **embarks** and navigates a tile-based grid using arrow keys.
3. Each step costs water (1 move/water) and food (2 moves/food).
4. Tiles are revealed as the player enters their light radius (2 tiles).
5. Random combat encounters fire when `FIGHT_CHANCE` (20%) is met, with a minimum gap of `FIGHT_DELAY` (3 steps) between fights.
6. Landmarks offer loot, story scenes, or hazards.
7. Dying on the path triggers a 120-second `DEATH_COOLDOWN` before the player can re-embark.

#### Map constants (easily tweaked per variant)

| Constant | Default | Meaning |
|---|---|---|
| `RADIUS` | 30 | Half-width/height of the map in tiles |
| `VILLAGE_POS` | [30,30] | Tile coordinates of home village |
| `FIGHT_CHANCE` | 0.20 | Per-step probability of a combat encounter |
| `BASE_WATER` | 10 | Starting water |
| `MOVES_PER_FOOD` | 2 | Steps per food unit |
| `MOVES_PER_WATER` | 1 | Steps per water unit |
| `BASE_HEALTH` | 10 | Starting HP |
| `LIGHT_RADIUS` | 2 | Fog-of-war reveal radius |
| `STICKINESS` | 0.5 | Terrain type persistence (higher = bigger biome blobs) |

---

### 4.4 Phase 4 — The Ship (Fabricator)

**Modules:** `ship.js`, `fabricator.js`  
**Unlocked:** Ship tile found on the world map.

#### Ship

The crashed alien ship provides:
- A **Fabricator** panel for crafting advanced items with **alien alloy**.
- **Hull upgrades** that determine survivability in the Space phase.
- `features.location.fabricator` / `features.location.spaceShip` flags gate the tabs.

#### Fabricator craftables

| Item | Type | Cost |
|---|---|---|
| Energy Blade | Weapon | 1 alien alloy |
| Fluid Recycler | Upgrade | 2 alien alloy |
| Cargo Drone | Upgrade | 2 alien alloy |
| Kinetic Armour | Upgrade | 2 alien alloy |
| Disruptor | Weapon | 1 alien alloy |
| Hypo | Tool | 1 alien alloy |
| Plasma Rifle | Weapon | 2 alien alloy |

Some items require a **blueprint** (`blueprintRequired: true`) dropped from specific encounters.

---

### 4.5 Phase 5 — Space (Endgame)

**Module:** `space.js`  
**Unlocked:** When the ship is fully repaired.

#### Core loop

1. The player's `@` character flies upward through an asteroid field.
2. Movement: arrow keys; the ship moves 3px per frame.
3. Asteroids spawn at intervals, accelerating over time.
4. Hull absorbs hits; reaching 0 hull ends the run.
5. Surviving to altitude 10000 triggers the win screen.

#### Constants

| Constant | Default |
|---|---|
| `SHIP_SPEED` | 3 px/frame |
| `BASE_ASTEROID_DELAY` | 500 ms |
| `BASE_ASTEROID_SPEED` | 1500 ms |
| `FTB_SPEED` | 60000 ms (fade-to-black on win) |

---

## 5. Event System

**Module:** `events.js` + files in `script/events/`

### 5.1 Story Events

A story event is a **scene graph**.  Each event object has:

```js
{
  title: 'Event Title',
  isAvailable: function() { return true/false; },
  scenes: {
    'start': {
      text: ['line 1', 'line 2'],
      notification: 'shown in the log',
      reward: { wood: 10 },           // optional immediate reward
      onLoad: function() { … },       // optional side-effect
      buttons: {
        'option a': {
          text: 'Do thing A',
          nextScene: 'sceneB',
          cost: { wood: 5 },
          available: function() { return true; },
          reward: { fur: 3 }
        },
        'leave': { text: 'leave.', nextScene: 'end' }
      }
    },
    'sceneB': { … },
    'end': { text: ['goodbye.'] }
  }
}
```

`nextScene: 'end'` closes the event panel.

### 5.2 Combat Events

A combat scene is a scene with `combat: true`:

```js
'start': {
  combat: true,
  enemy: 'thug',
  enemyName: 'a thug',
  deathMessage: 'the thug is dead',
  chara: 'T',          // ASCII character for the enemy
  damage: 3,
  hit: 0.8,            // enemy hit chance 0–1
  attackDelay: 2,      // seconds between enemy attacks
  health: 15,
  loot: {
    'cloth': { min:1, max:3, chance:0.8 }
  }
}
```

Combat is **real-time**:
- The enemy attacks on its `attackDelay` timer.
- The player selects a weapon and clicks its button when the cooldown allows.
- Both sides miss based on `hit` / `BASE_HIT_CHANCE` / evasive perk.
- HP bars animate; on enemy death, loot is rolled and added to `stores`.

#### Special combat effects

| Effect | Trigger | Duration |
|---|---|---|
| Stun | stun grenade / enemy ability | 4 s |
| Energise | stimulant | 4× attack speed for 4 s |
| Enrage | enemy ability | increases enemy damage |
| Bleed (DoT) | enemy slashing attack | 1 s tick |
| Boost | player item | +10 damage for 3 s |
| Meditate | player ability | heal over time |

### 5.3 Event Pools & Scheduling

On `Events.init()`, the global event pool is assembled:

```js
Events.EventPool = [].concat(
  Events.Global,
  Events.Room,
  Events.Outside,
  Events.Marketing,
  /* extensions can push here */
);
```

A new event is scheduled every **3–6 minutes** (randomised).  When the timer fires, the engine picks the first event from the pool whose `isAvailable()` returns `true`.

Events that have fired are tracked; `isAvailable()` can reference `$SM` flags to prevent re-triggering.

---

## 6. Economy & Resources

### 6.1 Resource Tiers

| Tier | Resources | Source |
|---|---|---|
| Raw | wood, fur, meat | gathering / hunting / trapping |
| Processed | leather, cured meat, iron, coal, sulphur | workers |
| Refined | steel, bullets | steelworker / armourer |
| Alien | alien alloy, energy cell, fleet beacon | exploration / combat loot |
| Crafted | torches, bone spear, iron/steel sword, rifle, grenade, bolas | crafting benches |

### 6.2 Buildings & Workers

Buildings are crafted in the Room panel.  They gate worker types.

| Building | Prereq | Worker Unlocked | Max |
|---|---|---|---|
| Trap | — | Trapper | 10 |
| Cart | — | (increases wood/gather) | 1 |
| Hut | Builder helping | Population capacity +4 | 20 |
| Lodge | Hut | Hunter | 1 |
| Trading Post | Lodge | Commerce events | 1 |
| Tannery | Trading Post | Tanner | 1 |
| Smokehouse | Tannery | Charcutier | 1 |
| Workshop | Smokehouse | crafting tier 2 | 1 |
| Steelworks | Workshop | Steelworker | 1 |
| Armory | Steelworks | Armourer | 1 |
| Barracks | Armory | Soldiers | 1 |
| Clinic | Barracks | Medics | 1 |
| Hospital | Clinic | (heal wanderers) | 1 |

### 6.3 Crafting Recipes

#### Room craftables (require Workshop or higher)

| Item | Cost | Type |
|---|---|---|
| Bone Spear | 8 wood, 5 teeth | weapon |
| Iron Sword | 1 iron, 5 wood | weapon |
| Steel Sword | 1 steel, 5 wood | weapon |
| Bayonet | 1 rifle, 1 steel, 1 sulphur | weapon |
| Rifle | 1 steel, 3 sulphur, 5 coal, 5 iron | weapon |
| Grenade | 5 sulphur, 3 steel, 2 coal | weapon |
| Bolas | 6 fur, 5 teeth | weapon |
| Laser Rifle | 1 steel, 5 alien alloy | weapon |
| Torch | 1 cloth, 1 wood | tool |
| Waterskin | 50 leather | tool |
| Cask | 100 leather, 20 iron | tool |
| Compass | 1 iron, 1 scales | tool |
| Leather Armour | 200 leather, 50 fur | armour |
| Iron Armour | 100 iron, 50 fur | armour |
| Steel Armour | 100 steel, 50 fur | armour |

---

## 7. Combat System

### 7.1 Weapons

```js
Weapons[name] = {
  verb: 'slash',       // shown in combat log
  type: 'melee',       // 'unarmed' | 'melee' | 'ranged'
  damage: 6,
  cooldown: 2,         // seconds
  cost: { bullets: 1 } // optional per-use cost
}
```

Weapons are stored in `stores.*` and equipped via the **outfit** screen before embarking.

### 7.2 Perks

Perks are stored in `character.perks.*` and applied as multipliers/modifiers.

| Perk | Effect |
|---|---|
| Boxer | +unarmed damage |
| Martial Artist | +unarmed damage (tier 2) |
| Unarmed Master | 2× attack speed, +unarmed damage (tier 3) |
| Barbarian | +melee damage |
| Slow Metabolism | 2× food range |
| Desert Rat | 2× water range |
| Evasive | better dodge chance |
| Precise | higher hit chance |
| Scout | increased light radius |
| Stealthy | lower random encounter chance |
| Gastronome | +healing from food |

Perks are awarded by event outcomes or milestone conditions.

### 7.3 Enemies

Each encounter defines its own enemy stats inline (see §5.2).  Tiers expand with map distance:

| Distance tier | Example enemies |
|---|---|
| 0–10 tiles | snarling beast, gaunt man, shivering man |
| 10–20 tiles | disease-riddled dog, huge beastly thing, old man |
| 20–30 tiles | soldiers, lizards, snakes |
| Setpieces | executioner (special boss with unique mechanics) |

---

## 8. World Map

### 8.1 Tile Types

| Symbol | Tile | Terrain Weight |
|---|---|---|
| `A` | Village (home) | fixed |
| `;` | Forest | high |
| `,` | Field | medium |
| `.` | Barrens | medium |
| `#` | Road | low |
| `H` | House | rare |
| `V` | Cave | rare |
| `O` | Town | rare |
| `Y` | City | very rare |
| `P` | Outpost | rare |
| `W` | Ship (alien) | unique |
| `I` | Iron Mine | rare |
| `C` | Coal Mine | rare |
| `S` | Sulphur Mine | rare |
| `B` | Borehole | rare |
| `F` | Battlefield | rare |
| `M` | Swamp | rare |
| `U` | Cache | rare |
| `X` | Executioner | unique |

### 8.2 Landmarks

Landmark tiles trigger scripted event scenes when entered.  They are one-shot: the tile is cleared after the scene plays.  Rewards include loot, HP, water, or permanent unlocks.

### 8.3 Procedural Generation

1. Start with the village tile at `[RADIUS, RADIUS]`.
2. For each empty tile, inherit the adjacent tile type with probability `STICKINESS`; otherwise roll a new tile from the weighted probability table.
3. Scatter specific unique tiles (Ship, Executioner) at predetermined distances from the village.
4. Roads connect landmarks to the village.
5. The generated map is serialised into `game.world` at embark time and persisted across sessions.

---

## 9. Prestige & Scoring

When the player wins (escapes in the Space phase), the run ends and a score is calculated:

```
score = Σ(resource_count × resource_weight) + alien_alloys×10 + fleet_beacons×500 + hull×50
```

Scoring weights:

| Resource | Weight |
|---|---|
| wood, fur, meat | 1 |
| iron, coal | 2 |
| sulphur, steel | 3 |
| cured meat, leather | 2 |
| scales, teeth | 2 |
| cloth | 1.5 |
| bait, torch | 1 |
| bone spear | 10 |
| iron sword | 30 |
| steel sword | 50 |
| bayonet | 100 |
| rifle, laser rifle | 150 |
| bullets, energy cell | 3 |
| grenade | 5 |
| bolas | 4 |

The score and a reduced snapshot of stores are written to `previous.*`.  On a new run, `previous.stores` seeds the player's starting inventory (soft carry-over).

---

## 10. UI / UX Conventions

| Convention | Detail |
|---|---|
| **All lowercase** | Every piece of text is lowercase, including proper nouns. Reinforces minimalism. |
| **Sentences end with a period** | Notification strings are auto-terminated if missing a period. |
| **Horizontal tabs** | Each phase is a tab in the Header bar. Tabs slide in from the right as they unlock. |
| **Stores panel** | A fixed sidebar listing all non-zero inventory counts. Updates reactively. |
| **Cooldown visualisation** | A CSS-animated bar grows across the button face during cooldown. |
| **Lights Off mode** | Inverts the palette to near-black. Stored in `config.lightsOff`. |
| **Hyper mode** | 10× speed for all timers. For impatient replays. Stored in `config.hyperMode`. |
| **No modals** | All interactions happen inline in the location panel. Events overlay the panel. |

---

## 11. Extension / DLC System

This section describes a **custom addon architecture** that does not exist in the vanilla game but is designed to slot cleanly into the existing module pattern.  Copy and implement this system to enable AI-assisted content creation.

### 11.1 Design Goals

- Extensions are **plain JavaScript files** — no build step, no bundler required.
- An extension can add: new events, new craftables, new workers, new tiles, new phases, new perks, new weapons, new UI panels.
- Extensions are **isolated by convention** — they interact with the game only through the public Extension API.
- Extensions can be loaded at startup from a **manifest file** or injected at runtime.
- Copilot / Codex can generate a working extension from a short natural-language description.

### 11.2 Extension API Reference

The `ExtensionAPI` object (to be implemented in `script/extensions/api.js`) exposes:

#### State

```js
ExtensionAPI.state.get(path)           // $SM.get wrapper
ExtensionAPI.state.set(path, value)    // $SM.set wrapper
ExtensionAPI.state.add(path, amount)   // $SM.add wrapper
ExtensionAPI.state.addM(parent, map)   // $SM.addM wrapper
```

#### Notifications

```js
ExtensionAPI.notify(text)              // Notifications.notify(null, text)
```

#### Events

```js
// Add events to the pool at any time
ExtensionAPI.events.register(eventObj)

// Remove an event (by title string)
ExtensionAPI.events.unregister(title)
```

#### Craftables

```js
// Add a new craftable to the Room panel
ExtensionAPI.craftables.register('myItem', {
  name: 'my item',
  type: 'weapon',          // 'weapon'|'tool'|'building'|'upgrade'
  maximum: 1,              // optional cap
  cost: () => ({ wood: 5 }),
  buildMsg: 'you made the thing.'
})

// Add a craftable to the Fabricator panel
ExtensionAPI.craftables.registerFab('myAlienItem', { … })
```

#### Workers / Income

```js
ExtensionAPI.workers.register('my worker', {
  name: 'my worker',
  delay: 10,
  stores: { 'my resource': 1, wood: -1 }
})
```

#### Tiles / Landmarks

```js
ExtensionAPI.world.registerTile('Z', {
  name: 'Zigzag Tower',
  weight: 0.02,
  unique: false,
  event: myLandmarkEvent    // standard event object
})
```

#### Perks

```js
ExtensionAPI.perks.register('nimble', {
  name: 'nimble',
  desc: 'move faster on roads',
  notify: 'learned to move quickly.'
})
```

#### Weapons

```js
ExtensionAPI.weapons.register('shock baton', {
  verb: 'shock',
  type: 'melee',
  damage: 7,
  cooldown: 1.5
})
```

#### Phases (full custom panel)

```js
ExtensionAPI.phases.register({
  id:     'myPhase',
  label:  'The Vault',
  module: MyVaultModule,   // standard phase module object (§4)
  unlockCondition: function() {
    return ExtensionAPI.state.get('features.location.vault');
  }
})
```

#### Hooks (see §11.6)

```js
ExtensionAPI.hooks.on('room:stoked',   handler)
ExtensionAPI.hooks.on('combat:kill',   handler)
ExtensionAPI.hooks.on('path:step',     handler)
ExtensionAPI.hooks.on('game:start',    handler)
ExtensionAPI.hooks.on('game:win',      handler)
```

---

### 11.3 Extension Loader

**File:** `script/extensions/loader.js`

```js
var ExtensionLoader = {

  _registry: [],

  // Register a loaded extension object
  register: function(ext) {
    if (!ext || !ext.id) { console.warn('[ExtensionLoader] Extension missing id'); return; }
    this._registry.push(ext);
    console.log('[ExtensionLoader] registered: ' + ext.id);
  },

  // Call after Engine core systems are ready
  initAll: function() {
    this._registry.forEach(function(ext) {
      try {
        if (typeof ext.init === 'function') ext.init(ExtensionAPI);
      } catch(e) {
        console.error('[ExtensionLoader] init failed for ' + ext.id, e);
      }
    });
  },

  // Load a script tag at runtime (for dynamic install)
  load: function(url, callback) {
    var s = document.createElement('script');
    s.src = url;
    s.onload = callback || function(){};
    s.onerror = function() { console.error('[ExtensionLoader] failed to load: ' + url); };
    document.head.appendChild(s);
  },

  // Load from a manifest JSON file
  loadManifest: function(manifestUrl) {
    var self = this;
    fetch(manifestUrl)
      .then(function(r) { return r.json(); })
      .then(function(manifest) {
        (manifest.extensions || []).forEach(function(entry) {
          if (entry.enabled !== false) {
            self.load(entry.src);
          }
        });
      })
      .catch(function(e) { console.warn('[ExtensionLoader] manifest load failed', e); });
  }
};
```

**Wire into engine.js** — add at the bottom of `Engine.init()`:

```js
// Load extensions
if (window.ExtensionLoader) {
  ExtensionLoader.initAll();
}
```

---

### 11.4 Writing an Extension — Full Example

The following is a **complete, self-contained DLC** called *"The Alchemist"*.  Drop it in `script/extensions/alchemist.js` and register it.

```js
/**
 * Extension: The Alchemist
 * Adds an alchemist NPC, a new resource (essence), a new craftable,
 * a new worker, and a random event.
 */
(function() {

  var Alchemist = {
    id: 'alchemist',
    name: 'The Alchemist',
    version: '1.0.0',

    init: function(API) {

      // 1. New resource: "essence" — appears in the stores panel automatically

      // 2. New worker
      API.workers.register('alchemist', {
        name: 'alchemist',
        delay: 15,
        stores: {
          'herbs':   -3,
          'essence':  1
        }
      });

      // 3. New craftable (requires Workshop)
      API.craftables.register('elixir', {
        name: 'elixir',
        type: 'tool',
        maximum: 5,
        cost: function() {
          return { essence: 2, water: 1 };
        },
        buildMsg: 'the elixir shimmers with faint light.',
        availableMsg: 'the alchemist says she can brew something special.'
      });

      // 4. New perk unlocked by drinking an elixir
      API.perks.register('vitality', {
        name: 'vitality',
        desc: 'maximum health increased by 5',
        notify: 'a warmth spreads through the body.'
      });

      // 5. New random event
      API.events.register({
        title: 'A Wandering Alchemist',
        isAvailable: function() {
          return API.state.get('game.buildings["hut"]', true) >= 3
              && !API.state.get('game.alchemistMet');
        },
        scenes: {
          'start': {
            text: [
              'an old woman shuffles into the firelight.',
              'she smells of sulfur and something sweeter.'
            ],
            notification: 'a wandering alchemist arrives.',
            buttons: {
              'welcome': {
                text: 'welcome her.',
                nextScene: 'settle',
                reward: { herbs: 5 }
              },
              'ignore': {
                text: 'ignore her.',
                nextScene: 'end'
              }
            }
          },
          'settle': {
            text: [ 'she nods and sets up a small corner for her work.' ],
            onLoad: function() {
              API.state.set('game.alchemistMet', true);
              API.notify('the alchemist has joined the village.');
            },
            buttons: {
              'leave': { text: 'leave.', nextScene: 'end' }
            }
          }
        }
      });

      // 6. Hook: on combat kill, small chance to drop herbs
      API.hooks.on('combat:kill', function(data) {
        if (Math.random() < 0.15) {
          API.state.add('stores["herbs"]', 1);
          API.notify('found some herbs on the body.');
        }
      });
    }
  };

  // Self-register
  if (window.ExtensionLoader) {
    ExtensionLoader.register(Alchemist);
  }

})();
```

**To install:** add a `<script>` tag in `index.html` after the main scripts, or add to the manifest:

```json
{
  "extensions": [
    { "id": "alchemist", "src": "script/extensions/alchemist.js", "enabled": true }
  ]
}
```

---

### 11.5 Extension Manifest Format

**File:** `extensions.json` (root of repository)

```jsonc
{
  "version": "1",
  "extensions": [
    {
      "id":      "alchemist",          // unique snake_case string
      "name":    "The Alchemist",      // display name
      "author":  "your name",
      "version": "1.0.0",
      "src":     "script/extensions/alchemist.js",
      "enabled": true                  // set false to disable without removing
    },
    {
      "id":      "frost_zone",
      "name":    "Frost Zone DLC",
      "author":  "your name",
      "version": "0.9.0",
      "src":     "script/extensions/frost_zone.js",
      "enabled": false
    }
  ]
}
```

---

### 11.6 Extension Lifecycle Hooks

Hooks are fired by the core engine.  Extensions subscribe via `ExtensionAPI.hooks.on(event, fn)`.

| Hook | Fired when | Payload |
|---|---|---|
| `game:start` | Engine finishes `init()` | `{}` |
| `game:win` | Space phase escape complete | `{ score }` |
| `game:restart` | Player confirms restart | `{}` |
| `room:stoked` | Player clicks stoke fire | `{ fireTempBefore, fireTempAfter }` |
| `room:built` | Player crafts any item | `{ item, count }` |
| `outside:worker_tick` | Income tick fires | `{ worker, delta }` |
| `outside:trap_drop` | Trap produces loot | `{ item, amount }` |
| `path:embark` | Player embarks on the path | `{ outfit }` |
| `path:step` | Player moves one tile | `{ tile, position }` |
| `path:return` | Player returns to village | `{ survived }` |
| `combat:start` | Combat scene begins | `{ enemy }` |
| `combat:hit` | Either side lands a hit | `{ actor, damage }` |
| `combat:kill` | Enemy dies | `{ enemy, loot }` |
| `combat:death` | Player dies | `{ location }` |
| `event:load` | Any event scene loads | `{ event, scene }` |
| `prestige:saved` | Prestige snapshot saved | `{ stores, score }` |

**Implement the hook emitter** in `script/extensions/api.js`:

```js
var ExtensionAPI = (function() {
  var _hooks = {};

  return {
    hooks: {
      on: function(event, fn) {
        if (!_hooks[event]) _hooks[event] = [];
        _hooks[event].push(fn);
      },
      emit: function(event, payload) {
        (_hooks[event] || []).forEach(function(fn) {
          try { fn(payload); } catch(e) { console.error('[hook:' + event + ']', e); }
        });
      }
    },
    // … other API methods
  };
})();
```

Call `ExtensionAPI.hooks.emit('room:stoked', { … })` from the appropriate place in `room.js` to fire the hook.

---

### 11.7 Security & Sandbox Guidelines

Because extensions are JavaScript, they have full page access.  Follow these conventions to keep extensions safe and well-behaved:

1. **Use only the ExtensionAPI** — do not directly mutate `State`, `Room`, `Outside`, etc.
2. **No network requests** — extensions must not `fetch()` or `XMLHttpRequest` to external servers.
3. **No `localStorage` writes outside `$SM`** — all persistence must go through the State Manager.
4. **No DOM manipulation outside your own registered panel** — use `ExtensionAPI.phases.register` for UI.
5. **Prefix your state keys** — e.g. `game.alchemist_*` or `stores["myExtension_gold"]` to avoid conflicts.
6. **Test with `Engine.options.debug = true`** — this enables verbose logging.
7. **Version your extension** — bump the version when breaking state-schema changes are made.

---

## 12. Variant Design Guide

Use this checklist to systematically reskin the game for a different theme.

### Step 1 — Rename resources and buildings

Replace `wood`, `fur`, `meat` and the building chain with your theme's vocabulary.  The mechanical relationships stay identical.

| Vanilla | Fantasy example | Sci-Fi example |
|---|---|---|
| wood | stone | ore |
| fur | hides | titanium plating |
| meat | provisions | rations |
| Workshop | Forge | Fabrication Bay |
| Tannery | Curing Room | Refinery |

### Step 2 — Rewrite event prose

All event text is in `script/events/`.  Keep the scene graph structure; only change `title`, `text[]`, and `notification` strings.

### Step 3 — Swap tile symbols and names

Edit `World.TILE` and `World.TILE_PROBS` for your world.  Add new tile handlers via `ExtensionAPI.world.registerTile`.

### Step 4 — Design your enemy roster

Copy the encounter template from §5.2.  Scale `health` and `damage` to your desired difficulty curve.

### Step 5 — Choose your endgame

The Space phase can be swapped for:
- A dungeon descent phase.
- A naval escape phase.
- A portal-opening ritual sequence.

Implement it as a new phase module and register it with `ExtensionAPI.phases.register`.

### Step 6 — Set atmosphere

- Write a custom audio manifest.
- Choose a CSS colour palette (only 4–6 colours are used in the base game).
- Pick a monospace font.

### Step 7 — Wire extensions for unique features

Any mechanic that doesn't fit the base game belongs in an extension.  Describe it to Copilot/Codex using the template from §11.4.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **Phase** | A major game stage (Room, Outside, Path, Ship, Space), each with its own panel/tab. |
| **Module** | A plain JS object that encapsulates one game system. |
| **StateManager / $SM** | The singleton that owns all mutable game data. |
| **Event Bus** | The `$.Dispatch` pub/sub channel used for inter-module communication. |
| **Cooldown Button** | A button that locks itself for N ms after a click. |
| **Craftable** | A recipe that consumes stored resources to produce an item or building. |
| **Landmark** | A unique world-map tile that triggers a one-shot scripted event. |
| **Encounter** | A random combat event that fires during path exploration. |
| **Prestige** | End-of-run carry-over mechanic; stores and score persist across playthroughs. |
| **Extension** | A third-party JS file that uses the ExtensionAPI to add content without forking core files. |
| **Manifest** | `extensions.json` — the list of extensions to load on startup. |
| **Hook** | A named event fired by the core engine that extensions can subscribe to. |
| **DLC** | Downloadable content; in this context, a self-contained extension module. |

---

*End of document. Add sections freely — the markdown heading hierarchy is intentionally shallow so new `##` sections can be appended anywhere without breaking the Table of Contents structure.*

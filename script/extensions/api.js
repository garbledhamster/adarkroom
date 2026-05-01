/**
 * ExtensionAPI
 *
 * Public surface that all extensions must use to interact with the game.
 * Extensions should never reach directly into game modules; everything goes
 * through this object so the core game can evolve without breaking add-ons.
 *
 * Implemented per §11.2 and §11.6 of the Game Design Document.
 */
var ExtensionAPI = (function() {

  var _hooks = {};

  // Track extension-registered IDs per namespace to detect duplicates.
  var _registered = {};

  // Log of duplicate attempts for diagnostics.
  var _duplicateAttempts = [];

  // Set by ExtensionLoader.initAll() so error messages include the caller.
  var _currentExtensionId = null;

  function _tag() {
    return _currentExtensionId ? '[' + _currentExtensionId + ']' : '[extension]';
  }

  /**
   * Returns true (and warns) if this namespace+id pair was already registered
   * by a previous extension call.  Does NOT guard against overwriting core
   * game objects — intentional patching is allowed.
   */
  function _checkDuplicate(namespace, id) {
    var key = namespace + ':' + id;
    if (_registered[key]) {
      var msg = _tag() + ' duplicate ' + namespace + ' "' + id + '" — skipping';
      console.warn('[ExtensionAPI] ' + msg);
      _duplicateAttempts.push(msg);
      return true;
    }
    _registered[key] = true;
    return false;
  }

  var api = {

    // -----------------------------------------------------------------------
    // Internal — called by ExtensionLoader so error messages carry an ID
    // -----------------------------------------------------------------------
    _setCurrentExtension: function(id) {
      _currentExtensionId = id;
    },

    // -----------------------------------------------------------------------
    // State — thin wrappers around $SM so extensions never call $SM directly
    // -----------------------------------------------------------------------
    state: {
      get: function(path, coerce) {
        return $SM.get(path, coerce);
      },
      set: function(path, value) {
        return $SM.set(path, value);
      },
      add: function(path, amount) {
        return $SM.add(path, amount);
      },
      addM: function(parent, map) {
        return $SM.addM(parent, map);
      }
    },

    // -----------------------------------------------------------------------
    // Notifications
    // -----------------------------------------------------------------------
    notify: function(text) {
      Notifications.notify(null, text);
    },

    // -----------------------------------------------------------------------
    // Resources — declare a new resource/store type
    // -----------------------------------------------------------------------
    resources: {
      _registry: {},
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' resources.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' resources.register: def must be an object for "' + id + '"');
          return;
        }
        if (_checkDuplicate('resource', id)) return;
        api.resources._registry[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Craftables — Room.Craftables or Fabricator.Craftables
    // -----------------------------------------------------------------------
    craftables: {
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.register: def must be an object for "' + id + '"');
          return;
        }
        if (typeof def.cost !== 'function') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.register: def.cost must be a function for "' + id + '"');
          return;
        }
        if (_checkDuplicate('craftable', id)) return;
        Room.Craftables[id] = def;
      },
      registerFab: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.registerFab: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.registerFab: def must be an object for "' + id + '"');
          return;
        }
        if (typeof def.cost !== 'function') {
          console.warn('[ExtensionAPI] ' + _tag() + ' craftables.registerFab: def.cost must be a function for "' + id + '"');
          return;
        }
        if (_checkDuplicate('craftable:fab', id)) return;
        if (window.Fabricator) {
          Fabricator.Craftables[id] = def;
        }
      }
    },

    // -----------------------------------------------------------------------
    // Trade Goods — Room.TradeGoods
    // -----------------------------------------------------------------------
    tradeGoods: {
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' tradeGoods.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' tradeGoods.register: def must be an object for "' + id + '"');
          return;
        }
        if (typeof def.cost !== 'function') {
          console.warn('[ExtensionAPI] ' + _tag() + ' tradeGoods.register: def.cost must be a function for "' + id + '"');
          return;
        }
        if (_checkDuplicate('tradeGood', id)) return;
        Room.TradeGoods[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Workers / Income — entries in Outside._INCOME
    // -----------------------------------------------------------------------
    workers: {
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' workers.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' workers.register: def must be an object for "' + id + '"');
          return;
        }
        if (!def.name) {
          console.warn('[ExtensionAPI] ' + _tag() + ' workers.register: def.name required for "' + id + '"');
          return;
        }
        if (!def.stores || typeof def.stores !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' workers.register: def.stores (object) required for "' + id + '"');
          return;
        }
        if (_checkDuplicate('worker', id)) return;
        Outside._INCOME[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Perks — entries in Engine.Perks
    // -----------------------------------------------------------------------
    perks: {
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' perks.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' perks.register: def must be an object for "' + id + '"');
          return;
        }
        if (!def.name) {
          console.warn('[ExtensionAPI] ' + _tag() + ' perks.register: def.name required for "' + id + '"');
          return;
        }
        if (_checkDuplicate('perk', id)) return;
        Engine.Perks[id] = def;
      },
      /** Returns true if the player currently holds the named perk. */
      has: function(id) {
        return typeof $SM !== 'undefined' && $SM.hasPerk && $SM.hasPerk(id);
      },
      /** Grants the named perk if the player does not already have it. */
      grant: function(id) {
        if (typeof $SM !== 'undefined' && $SM.hasPerk && !$SM.hasPerk(id)) {
          $SM.addPerk(id);
        }
      }
    },

    // -----------------------------------------------------------------------
    // Weapons — entries in World.Weapons
    // -----------------------------------------------------------------------
    weapons: {
      register: function(id, def) {
        if (!id || typeof id !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' weapons.register: id must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' weapons.register: def must be an object for "' + id + '"');
          return;
        }
        if (typeof def.damage !== 'number') {
          console.warn('[ExtensionAPI] ' + _tag() + ' weapons.register: def.damage (number) required for "' + id + '"');
          return;
        }
        if (_checkDuplicate('weapon', id)) return;
        World.Weapons[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // World Tiles — World.TILE + World.TILE_PROBS + optional landmark/setpiece
    // -----------------------------------------------------------------------
    worldTiles: {
      register: function(char, def) {
        if (!char || typeof char !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' worldTiles.register: char must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object' || !def.name) {
          console.warn('[ExtensionAPI] ' + _tag() + ' worldTiles.register: def must be an object with a name for char "' + char + '"');
          return;
        }
        if (_checkDuplicate('worldTile', char)) return;
        World.TILE[def.name] = char;
        if (typeof def.weight === 'number') {
          World.TILE_PROBS[char] = def.weight;
        }
        if (def.event) {
          World.LANDMARKS[char] = { scene: def.event.title, name: def.name };
          Events.Setpieces[def.event.title] = def.event;
        }
      }
    },

    // -----------------------------------------------------------------------
    // Landmarks — World.LANDMARKS (for tiles already defined in World.TILE)
    // -----------------------------------------------------------------------
    landmarks: {
      register: function(char, def) {
        if (!char || typeof char !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' landmarks.register: char must be a non-empty string');
          return;
        }
        if (!def || typeof def !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' landmarks.register: def must be an object for char "' + char + '"');
          return;
        }
        if (!def.scene) {
          console.warn('[ExtensionAPI] ' + _tag() + ' landmarks.register: def.scene required for char "' + char + '"');
          return;
        }
        if (_checkDuplicate('landmark', char)) return;
        World.LANDMARKS[char] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Events — add / remove entries in the event pool
    // -----------------------------------------------------------------------
    events: {
      register: function(eventObj) {
        if (!eventObj || typeof eventObj !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' events.register: eventObj must be an object');
          return;
        }
        if (!eventObj.title || typeof eventObj.title !== 'string') {
          console.warn('[ExtensionAPI] ' + _tag() + ' events.register: eventObj.title must be a non-empty string');
          return;
        }
        if (!eventObj.scenes || typeof eventObj.scenes !== 'object') {
          console.warn('[ExtensionAPI] ' + _tag() + ' events.register: eventObj.scenes must be an object for "' + eventObj.title + '"');
          return;
        }
        if (!eventObj.scenes['start']) {
          console.warn('[ExtensionAPI] ' + _tag() + ' events.register: eventObj.scenes.start required for "' + eventObj.title + '"');
          return;
        }
        if (_checkDuplicate('event', eventObj.title)) return;
        Events.EventPool.push(eventObj);
      },
      unregister: function(title) {
        Events.EventPool = Events.EventPool.filter(function(e) {
          return e.title !== title;
        });
      }
    },

    // -----------------------------------------------------------------------
    // World (legacy alias — kept for backward compatibility)
    // -----------------------------------------------------------------------
    world: {
      registerTile: function(char, def) {
        api.worldTiles.register(char, def);
      }
    },

    // -----------------------------------------------------------------------
    // Phases — register a new top-level panel / location tab
    // -----------------------------------------------------------------------
    phases: {
      register: function(def) {
        if (!def || !def.id || !def.label || !def.module) {
          console.warn('[ExtensionAPI] ' + _tag() + ' phases.register: def must have id, label, and module');
          return;
        }
        if (typeof def.unlockCondition === 'function' && !def.unlockCondition()) {
          return;
        }
        Header.addLocation(def.label, def.id, def.module);
        if (typeof def.module.init === 'function') {
          def.module.init();
        }
      }
    },

    // -----------------------------------------------------------------------
    // Hooks — pub/sub event bus for core engine events (§11.6)
    // -----------------------------------------------------------------------
    hooks: {
      on: function(event, fn) {
        if (typeof event !== 'string' || !event) {
          console.warn('[ExtensionAPI] ' + _tag() + ' hooks.on: event must be a non-empty string');
          return;
        }
        if (typeof fn !== 'function') {
          console.warn('[ExtensionAPI] ' + _tag() + ' hooks.on: handler must be a function for event "' + event + '"');
          return;
        }
        if (!_hooks[event]) _hooks[event] = [];
        _hooks[event].push(fn);
      },
      off: function(event, fn) {
        if (!_hooks[event]) return;
        if (fn === undefined) {
          _hooks[event] = [];
        } else if (typeof fn === 'function') {
          _hooks[event] = _hooks[event].filter(function(h) { return h !== fn; });
        } else {
          console.warn('[ExtensionAPI] ' + _tag() + ' hooks.off: handler must be a function for event "' + event + '"');
        }
      },
      emit: function(event, payload) {
        var handlers = _hooks[event];
        if (!handlers) return;
        for (var i = 0; i < handlers.length; i++) {
          try {
            handlers[i](payload || {});
          } catch(e) {
            console.error('[ExtensionAPI hook:' + event + ']', e);
          }
        }
      }
    },

    // -----------------------------------------------------------------------
    // Diagnostics — small read-only summary for verification
    // -----------------------------------------------------------------------
    diagnostics: {
      getSummary: function() {
        var hookCounts = {};
        for (var event in _hooks) {
          if (_hooks.hasOwnProperty(event)) {
            hookCounts[event] = _hooks[event].length;
          }
        }

        return {
          apiPresent: true,
          loaderPresent: !!window.ExtensionLoader,
          registeredExtensions: window.ExtensionLoader && ExtensionLoader._registry ? ExtensionLoader._registry.map(function(ext) {
            return {
              id: ext.id,
              name: ext.name || null,
              version: ext.version || null
            };
          }) : [],
          hookCounts: hookCounts,
          duplicateAttempts: _duplicateAttempts.slice(),
          extensionRegisteredIds: Object.keys(_registered),
          eventPoolSize: window.Events && Events.EventPool ? Events.EventPool.length : null,
          craftableCount: window.Room && Room.Craftables ? Object.keys(Room.Craftables).length : null,
          tradeGoodCount: window.Room && Room.TradeGoods ? Object.keys(Room.TradeGoods).length : null,
          workerCount: window.Outside && Outside._INCOME ? Object.keys(Outside._INCOME).length : null,
          weaponCount: window.World && World.Weapons ? Object.keys(World.Weapons).length : null,
          perkCount: window.Engine && Engine.Perks ? Object.keys(Engine.Perks).length : null
        };
      },
      print: function() {
        var summary = api.diagnostics.getSummary();
        console.log('[ExtensionAPI diagnostics]', summary);
        return summary;
      }
    }

  };

  return api;
})();

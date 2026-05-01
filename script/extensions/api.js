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

  var api = {

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
    // Events — add / remove entries in the event pool
    // -----------------------------------------------------------------------
    events: {
      register: function(eventObj) {
        if (!eventObj || !eventObj.title) {
          console.warn('[ExtensionAPI] events.register: eventObj must have a title');
          return;
        }
        Events.EventPool.push(eventObj);
      },
      unregister: function(title) {
        Events.EventPool = Events.EventPool.filter(function(e) {
          return e.title !== title;
        });
      }
    },

    // -----------------------------------------------------------------------
    // Craftables — Room.Craftables or Fabricator.Craftables
    // -----------------------------------------------------------------------
    craftables: {
      register: function(id, def) {
        if (!id || !def) return;
        Room.Craftables[id] = def;
      },
      registerFab: function(id, def) {
        if (!id || !def) return;
        if (window.Fabricator) {
          Fabricator.Craftables[id] = def;
        }
      }
    },

    // -----------------------------------------------------------------------
    // Workers / Income — entries in Outside._INCOME
    // -----------------------------------------------------------------------
    workers: {
      register: function(id, def) {
        if (!id || !def) return;
        Outside._INCOME[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // World — custom map tiles and landmark events
    // -----------------------------------------------------------------------
    world: {
      registerTile: function(char, def) {
        if (!char || !def || !def.name) return;
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
    // Perks — entries in Engine.Perks
    // -----------------------------------------------------------------------
    perks: {
      register: function(id, def) {
        if (!id || !def) return;
        Engine.Perks[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Weapons — entries in World.Weapons
    // -----------------------------------------------------------------------
    weapons: {
      register: function(id, def) {
        if (!id || !def) return;
        World.Weapons[id] = def;
      }
    },

    // -----------------------------------------------------------------------
    // Phases — register a new top-level panel / location tab
    // -----------------------------------------------------------------------
    phases: {
      register: function(def) {
        if (!def || !def.id || !def.label || !def.module) {
          console.warn('[ExtensionAPI] phases.register: def must have id, label, and module');
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
        if (typeof fn !== 'function') return;
        if (!_hooks[event]) _hooks[event] = [];
        _hooks[event].push(fn);
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
    // Diagnostics — small read-only summary for Pass 1 verification
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
          eventPoolSize: window.Events && Events.EventPool ? Events.EventPool.length : null,
          craftableCount: window.Room && Room.Craftables ? Object.keys(Room.Craftables).length : null,
          workerCount: window.Outside && Outside._INCOME ? Object.keys(Outside._INCOME).length : null,
          weaponCount: window.World && World.Weapons ? Object.keys(World.Weapons).length : null
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

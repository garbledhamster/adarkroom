/**
 * Extension: The Mayor  (v1.1.0)
 *
 * Adds a visible, assignable village mayor once 6 huts are built.
 *
 * Design:
 *   - Mayor is a real village role in the worker list.
 *   - Assigning a mayor consumes 1 population slot, like other workers.
 *   - Mayor automation only runs when at least 1 mayor is assigned.
 *   - Mayor automates chores: gathers wood, stokes fire, checks traps.
 */
(function() {

  var Mayor = {
    id: 'mayor',
    name: 'The Mayor',
    version: '1.1.0',

    _BASE_TICK: 10000,
    _tickCount: 0,
    _woodGathered: 0,
    _trapCheckCounter: 0,
    _TRAP_CHECK_EVERY: 9,
    _intervalId: null,
    _API: null,
    _lastError: null,

    init: function(API) {
      Mayor._API = API;

      if (typeof API.state.get('game.mayor') === 'undefined') {
        API.state.set('game.mayor', {});
      }
      if (typeof API.state.get('game.mayor.unlocked') === 'undefined') {
        API.state.set('game.mayor.unlocked', false);
      }

      // Register as a real assignable worker/role. The stores object is empty
      // because the mayor's value comes from automation logic, not normal income.
      API.workers.register('mayor', {
        name: 'mayor',
        delay: 10,
        stores: {}
      });

      Mayor._exposeDebug();
      Mayor._restartInterval();

      if (API.hooks) {
        API.hooks.on('morale:changed', function() {
          Mayor._restartInterval();
        });
        API.hooks.on('build:after', function(payload) {
          if (payload && payload.id === 'hut') {
            Mayor._checkUnlock(true);
          }
        });
      }

      Mayor._checkUnlock(false);
    },

    _exposeDebug: function() {
      window.MayorDebug = {
        status: function() {
          return Mayor._status();
        },
        tick: function() {
          Mayor._tick();
          return Mayor._status();
        },
        restart: function() {
          Mayor._restartInterval();
          return Mayor._status();
        },
        unlock: function() {
          Mayor._unlock(true);
          return Mayor._status();
        }
      };
    },

    _status: function() {
      var API = Mayor._API;
      return {
        apiReady: !!API,
        intervalId: Mayor._intervalId,
        huts: API ? API.state.get('game.buildings["hut"]', true) : null,
        unlocked: API ? API.state.get('game.mayor.unlocked') : null,
        assignedMayors: Mayor._assignedCount(),
        mayorState: API ? API.state.get('game.mayor') : null,
        workerState: API ? API.state.get('game.workers["mayor"]') : null,
        wood: API ? API.state.get('stores.wood', true) : null,
        fireValue: (window.$SM ? $SM.get('game.fire.value', true) : null),
        traps: API ? API.state.get('game.buildings["trap"]', true) : null,
        tickCount: Mayor._tickCount,
        woodGathered: Mayor._woodGathered,
        trapCheckCounter: Mayor._trapCheckCounter,
        baseTickMs: Mayor._BASE_TICK,
        moraleMultiplier: (window.ExtensionAPI && ExtensionAPI.morale)
          ? ExtensionAPI.morale.getDelayMultiplier()
          : 1.0,
        lastError: Mayor._lastError
      };
    },

    _checkUnlock: function(notify) {
      var API = Mayor._API;
      if (!API) { return false; }
      if (API.state.get('game.mayor.unlocked')) { return true; }
      var huts = API.state.get('game.buildings["hut"]', true);
      if (huts >= 6) {
        Mayor._unlock(notify);
        return true;
      }
      return false;
    },

    _unlock: function(notify) {
      var API = Mayor._API;
      if (!API) { return; }
      API.state.set('game.mayor.unlocked', true);
      if (typeof API.state.get('game.workers["mayor"]') !== 'number') {
        API.state.set('game.workers["mayor"]', 0);
      }
      if (window.Outside && typeof Outside.updateWorkersView === 'function') {
        Outside.updateWorkersView();
      }
      if (window.Room && typeof Room.updateIncomeView === 'function') {
        Room.updateIncomeView();
      }
      if (notify) {
        API.notify(_('the villagers can now appoint a mayor.'));
      }
    },

    _assignedCount: function() {
      var API = Mayor._API;
      if (!API) { return 0; }
      return API.state.get('game.workers["mayor"]', true) || 0;
    },

    _restartInterval: function() {
      if (Mayor._intervalId !== null) {
        clearInterval(Mayor._intervalId);
        Mayor._intervalId = null;
      }
      var multiplier = (window.ExtensionAPI && ExtensionAPI.morale)
        ? ExtensionAPI.morale.getDelayMultiplier()
        : 1.0;
      var delay = Mayor._BASE_TICK * multiplier;
      Mayor._intervalId = Engine.setInterval(function() {
        Mayor._tick();
      }, delay);
      console.log('[Mayor] interval started: base=' + Mayor._BASE_TICK +
        ' ms morale\u00d7' + multiplier + ' = ' + delay + 'ms (before hyper)');
    },

    _tick: function() {
      try {
        var API = Mayor._API;
        if (!API) { return; }

        Mayor._checkUnlock(false);

        if (!API.state.get('game.mayor.unlocked')) { return; }
        if (Mayor._assignedCount() < 1) { return; }

        Mayor._tickCount++;

        var wood = API.state.get('stores.wood', true);
        if (wood < Engine.MAX_STORE) {
          API.state.add('stores.wood', 1);
          Mayor._woodGathered++;
        }

        Mayor._stokeFire();
        Mayor._checkTraps();

        if (Mayor._tickCount % 10 === 0) {
          console.log('[Mayor] tick ' + Mayor._tickCount +
            ' | wood gathered: ' + Mayor._woodGathered);
        }
      } catch (e) {
        Mayor._lastError = e && e.message ? e.message : String(e);
        console.error('[Mayor] tick failed', e);
      }
    },

    _stokeFire: function() {
      if (!window.Room || !Room.FireEnum) { return; }
      var fireValue = $SM.get('game.fire.value', true);
      if (fireValue >= Room.FireEnum.Burning.value) { return; }
      var wood = $SM.get('stores.wood', true);
      if (wood <= 0) { return; }
      $SM.set('stores.wood', wood - 1);
      $SM.set('game.fire', Room.FireEnum.fromInt(fireValue + 1));
      Room.onFireChange();
    },

    _checkTraps: function() {
      Mayor._trapCheckCounter++;
      if (Mayor._trapCheckCounter < Mayor._TRAP_CHECK_EVERY) { return; }
      Mayor._trapCheckCounter = 0;

      var API = Mayor._API;
      var numTraps = API.state.get('game.buildings["trap"]', true);
      if (numTraps <= 0) { return; }
      if (!window.Outside || !Outside.TrapDrops) { return; }

      var drops = {};
      var numBait = API.state.get('stores.bait', true);
      var numDrops = numTraps + Math.min(numBait, numTraps);
      for (var i = 0; i < numDrops; i++) {
        var roll = Math.random();
        for (var j in Outside.TrapDrops) {
          var drop = Outside.TrapDrops[j];
          if (roll < drop.rollUnder) {
            drops[drop.name] = (drops[drop.name] || 0) + 1;
            break;
          }
        }
      }
      var baitUsed = Math.min(numBait, numTraps);
      drops.bait = -baitUsed;

      API.state.addM('stores', drops);
      console.log('[Mayor] checked traps. drops: ' + JSON.stringify(drops));
    }
  };

  if (window.ExtensionLoader) {
    ExtensionLoader.register(Mayor);
  }

})();

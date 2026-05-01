/**
 * Extension: The Mayor  (v1.0.0)
 *
 * Adds a village mayor who automates day-to-day chores once the village
 * grows large enough (6 huts).  The mayor's tick timing is driven by
 * Engine.setInterval so it automatically benefits from Hyper Mode
 * (doubleTime) when enabled.
 *
 * Pass 5 — Mayor skeleton: unlock detection, repeating tick, diagnostics.
 * Pass 6 — Mayor automation: gather wood (+1 per tick after unlock).
 * Pass 7 — Mayor automation: stoke fire (safe state changes, no UI button).
 * Pass 8 — Mayor automation: check traps quietly every 9 ticks (~90 s).
 * Pass 9 — Mayor tick timing linked to village morale via morale:changed hook.
 */
(function() {

  var Mayor = {
    id: 'mayor',
    name: 'The Mayor',
    version: '1.0.0',

    // Base tick delay in ms.  Morale multiplier and Hyper Mode both modify
    // the final interval: effectiveDelay = BASE_TICK * moraleMultiplier,
    // then Engine.setInterval halves that when Hyper Mode is active.
    _BASE_TICK: 10000,

    // Internal counters (reset on page load; not persisted).
    _tickCount: 0,
    _woodGathered: 0,
    // Check traps every 9 mayor ticks at neutral morale (~90 s), matching
    // the vanilla _TRAPS_DELAY cooldown.
    _trapCheckCounter: 0,
    _TRAP_CHECK_EVERY: 9,

    // Native interval ID returned by Engine.setInterval; kept so we can
    // clear it before restarting with a new morale-adjusted delay.
    _intervalId: null,

    // Stored reference to the ExtensionAPI passed during init.
    _API: null,

    init: function(API) {
      Mayor._API = API;

      // Initialise mayor state so existing saves are not disturbed.
      if (typeof API.state.get('game.mayor') === 'undefined') {
        API.state.set('game.mayor', {});
      }
      if (typeof API.state.get('game.mayor.unlocked') === 'undefined') {
        API.state.set('game.mayor.unlocked', false);
      }

      // Start the repeating mayor tick (uses morale multiplier if available).
      Mayor._restartInterval();

      // When morale changes, restart the interval with the updated delay.
      if (API.hooks) {
        API.hooks.on('morale:changed', function() {
          Mayor._restartInterval();
        });
      }
    },

    /**
     * (Re-)start the mayor tick interval using the current morale delay.
     * Clears any existing interval first so we never have duplicates.
     * Engine.setInterval halves the delay when Hyper Mode is active.
     */
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
      Engine.log('[Mayor] interval started: base=' + Mayor._BASE_TICK +
        ' ms morale\u00d7' + multiplier + ' = ' + delay + 'ms (before hyper)');
    },

    _tick: function() {
      var API = Mayor._API;
      if (!API) { return; }

      // Check unlock condition: mayor becomes active once 6 huts exist.
      if (!API.state.get('game.mayor.unlocked')) {
        var huts = API.state.get('game.buildings["hut"]', true);
        if (huts >= 6) {
          API.state.set('game.mayor.unlocked', true);
          // Notify once.
          API.notify(_('the villagers elect a mayor to manage the day-to-day chores.'));
        } else {
          return;
        }
      }

      // Mayor is unlocked — run automations.
      Mayor._tickCount++;

      // Pass 6: gather wood.
      // Add +1 wood per tick.  Engine.MAX_STORE is the hard cap; $SM.add
      // handles an uninitialised path safely (treats undefined as 0).
      var wood = API.state.get('stores.wood', true);
      if (wood < Engine.MAX_STORE) {
        API.state.add('stores.wood', 1);
        Mayor._woodGathered++;
      }

      // Pass 7: stoke fire when it is below Burning.
      Mayor._stokeFire();

      // Pass 8: check traps every _TRAP_CHECK_EVERY ticks.
      Mayor._checkTraps();

      // Debug diagnostics logged every 10 ticks to avoid console noise.
      if (Mayor._tickCount % 10 === 0) {
        Engine.log(
          '[Mayor] tick ' + Mayor._tickCount +
          ' | wood gathered: ' + Mayor._woodGathered
        );
      }
    },

    /**
     * Stoke the fire by one level if it is below Burning and wood is available.
     *
     * Room.stokeFire() is intentionally avoided because it calls
     * Button.clearCooldown() which depends on live DOM button elements.
     * Instead we mirror the safe state changes used in Room.coolFire():
     *   spend 1 wood, raise fire value by 1, call Room.onFireChange().
     */
    _stokeFire: function() {
      if (!window.Room || !Room.FireEnum) { return; }
      var fireValue = $SM.get('game.fire.value', true);
      // Only stoke when fire is below Burning (value 3); Burning/Roaring is fine.
      if (fireValue >= Room.FireEnum.Burning.value) { return; }
      var wood = $SM.get('stores.wood', true);
      if (wood <= 0) { return; }
      $SM.set('stores.wood', wood - 1);
      $SM.set('game.fire', Room.FireEnum.fromInt(fireValue + 1));
      Room.onFireChange();
    },

    /**
     * Check traps quietly every _TRAP_CHECK_EVERY ticks.
     *
     * Mirrors the drop logic from Outside.checkTraps() without firing a
     * per-check notification, avoiding spam when the mayor runs frequently.
     * Bait is consumed exactly as in the vanilla implementation.
     */
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
      Engine.log('[Mayor] checked traps. drops: ' + JSON.stringify(drops));
    }
  };

  // Self-register so the loader can call init() at the right time.
  if (window.ExtensionLoader) {
    ExtensionLoader.register(Mayor);
  }

})();

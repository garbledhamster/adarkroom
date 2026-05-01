/**
 * Extension: Village Morale  (v1.0.0)
 *
 * Adds a simple village-wide morale state that modifies worker production speed
 * by patching Outside._INCOME delay values before the standard income pipeline
 * picks them up.
 *
 * Morale states and multipliers:
 *   bad     -> 1.2  (workers 20% slower)
 *   neutral -> 1.0  (default speed)
 *   good    -> 0.8  (workers 20% faster)
 *
 * Timing chain for a base 10 s worker:
 *   bad morale     ->  12 s base  ->  6 s with Hyper Mode
 *   neutral morale ->  10 s base  ->  5 s with Hyper Mode
 *   good morale    ->   8 s base  ->  4 s with Hyper Mode
 *
 * Pass 2 — Village morale state (game.village.morale + helpers).
 * Pass 3 — Apply morale multiplier to Outside._INCOME worker delays.
 * Pass 4 — ExtensionAPI.morale namespace, morale:changed hook, console access.
 */
(function() {

  var VALID_VALUES = ['bad', 'neutral', 'good'];
  var MULTIPLIERS  = {
    bad:     1.2,
    neutral: 1.0,
    good:    0.8
  };

  var Morale = {
    id:      'morale',
    name:    'Village Morale',
    version: '1.0.0',

    _API: null,

    // Original Outside._INCOME[worker].delay values cached before any patching.
    _baseDelays: {},

    init: function(API) {
      Morale._API = API;

      // Initialise morale state for new and existing saves without disturbing
      // any pre-existing saved state.
      if (typeof API.state.get('game.village') === 'undefined') {
        API.state.set('game.village', {});
      }
      if (typeof API.state.get('game.village.morale') === 'undefined') {
        API.state.set('game.village.morale', 'neutral');
      }

      // Cache base delays before modifying them.
      Morale._cacheBaseDelays();

      // Apply current morale to the income pipeline.
      Morale._applyMoraleToIncome();

      // Expose the morale API on the shared ExtensionAPI object so other
      // extensions (e.g. mayor) and the browser console can access it.
      API.morale = {
        get:               Morale.getMorale,
        set:               Morale.setMorale,
        getDelayMultiplier: Morale.getDelayMultiplier
      };

      // Also expose on window for direct browser-console debugging.
      window.MoraleDebug = {
        get:               Morale.getMorale,
        set:               Morale.setMorale,
        getDelayMultiplier: Morale.getDelayMultiplier
      };

      Engine.log('[Morale] initialised. morale=' + Morale.getMorale() +
        ' multiplier=' + Morale.getDelayMultiplier());
    },

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    getMorale: function() {
      var API = Morale._API;
      if (!API) { return 'neutral'; }
      var val = API.state.get('game.village.morale');
      return (val && VALID_VALUES.indexOf(val) !== -1) ? val : 'neutral';
    },

    setMorale: function(value) {
      if (VALID_VALUES.indexOf(value) === -1) {
        console.warn('[Morale] invalid value "' + value +
          '". Accepted: bad, neutral, good');
        return;
      }
      var API = Morale._API;
      if (!API) { return; }
      var previous = Morale.getMorale();
      if (previous === value) { return; }
      API.state.set('game.village.morale', value);
      var multiplier = MULTIPLIERS[value];
      Engine.log('[Morale] ' + previous + ' -> ' + value +
        ' (multiplier=' + multiplier + ')');
      Morale._applyMoraleToIncome();
      API.hooks.emit('morale:changed', { morale: value, multiplier: multiplier });
    },

    getDelayMultiplier: function() {
      var m = Morale.getMorale();
      return (MULTIPLIERS[m] !== undefined) ? MULTIPLIERS[m] : 1.0;
    },

    // -----------------------------------------------------------------------
    // Internal — income delay patching
    // -----------------------------------------------------------------------

    /**
     * Store the original delay values from Outside._INCOME so we can
     * always compute effectiveDelay = baseDelay * multiplier cleanly.
     * Safe to call multiple times; only stores on first non-zero read.
     */
    _cacheBaseDelays: function() {
      if (!window.Outside || !Outside._INCOME) { return; }
      for (var worker in Outside._INCOME) {
        var income = Outside._INCOME[worker];
        if (typeof income.delay === 'number' &&
            typeof Morale._baseDelays[worker] === 'undefined') {
          Morale._baseDelays[worker] = income.delay;
        }
      }
    },

    /**
     * Patch Outside._INCOME[worker].delay with the morale-adjusted value so
     * the next call to Outside.updateVillageIncome() propagates the adjusted
     * delay into $SM.income automatically.
     *
     * This is safe because:
     *   - We always restore from _baseDelays, never compound multipliers.
     *   - Outside.updateVillageIncome() already handles undefined worker counts
     *     gracefully (it skips the setIncome call when count is not a number).
     */
    _applyMoraleToIncome: function() {
      Morale._cacheBaseDelays();
      if (!window.Outside || !Outside._INCOME) { return; }
      var multiplier = Morale.getDelayMultiplier();
      for (var worker in Morale._baseDelays) {
        if (!Outside._INCOME[worker]) { continue; }
        Outside._INCOME[worker].delay = Morale._baseDelays[worker] * multiplier;
      }
      if (typeof Outside.updateVillageIncome === 'function') {
        Outside.updateVillageIncome();
      }
    }
  };

  if (window.ExtensionLoader) {
    ExtensionLoader.register(Morale);
  }

})();

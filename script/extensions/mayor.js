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
 */
(function() {

  var Mayor = {
    id: 'mayor',
    name: 'The Mayor',
    version: '1.0.0',

    // Internal counters (reset on page load; not persisted).
    _tickCount: 0,
    _woodGathered: 0,

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

      // Start the repeating mayor tick.
      // Base interval: 10 seconds.  Engine.setInterval halves this when
      // Hyper Mode (doubleTime) is active, so the effective delays are:
      //   normal: 10s    Hyper Mode: 5s
      Engine.setInterval(function() {
        Mayor._tick();
      }, 10000);
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

      // Debug diagnostics logged every 10 ticks to avoid console noise.
      if (Mayor._tickCount % 10 === 0) {
        Engine.log(
          '[Mayor] tick ' + Mayor._tickCount +
          ' | wood gathered: ' + Mayor._woodGathered
        );
      }
    }
  };

  // Self-register so the loader can call init() at the right time.
  if (window.ExtensionLoader) {
    ExtensionLoader.register(Mayor);
  }

})();

/**
 * Extension: The Alchemist  (v1.1.0)
 *
 * Adds a visible, assignable village alchemist role.
 *
 * Design:
 *   - Alchemist appears after the wandering alchemist is welcomed.
 *   - Assigning alchemists consumes population, like other village roles.
 *   - Alchemists gather teeth as their primary worker output.
 *   - Essence/elixir/vitality remain as advanced alchemy content.
 */
(function() {

  var Alchemist = {
    id: 'alchemist',
    name: 'The Alchemist',
    version: '1.1.0',

    init: function(API) {

      API.perks.register('vitality', {
        name: 'vitality',
        desc: 'maximum health increased by 5',
        notify: 'a warmth spreads through the body.'
      });

      // Visible assignable worker role.  Each assigned alchemist consumes one
      // villager slot and gathers teeth through the normal village income loop.
      API.workers.register('alchemist', {
        name: 'alchemist',
        delay: 10,
        stores: {
          'teeth': 1
        }
      });

      API.craftables.register('elixir', {
        name: 'elixir',
        button: null,
        type: 'tool',
        maximum: 5,
        cost: function() {
          return { 'essence': 2, 'water': 1 };
        },
        buildMsg: 'the elixir shimmers with faint light.',
        availableMsg: 'the alchemist says she can brew something special.',
        onBuild: function() {
          if (!API.perks.has('vitality')) {
            API.perks.grant('vitality');
          }
        }
      });

      API.events.register({
        title: 'A Wandering Alchemist',
        isAvailable: function() {
          return API.state.get('game.buildings["hut"]', true) >= 3 &&
              !API.state.get('game.alchemistMet');
        },
        scenes: {
          'start': {
            text: [
              'an old woman shuffles into the firelight.',
              'she smells of sulphur and something sweeter.'
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
            text: [ 'she nods and teaches a few villagers what to look for.' ],
            onLoad: function() {
              API.state.set('game.alchemistMet', true);
              if (typeof API.state.get('game.workers["alchemist"]') !== 'number') {
                API.state.set('game.workers["alchemist"]', 0);
              }
              if (window.Outside && typeof Outside.updateWorkersView === 'function') {
                Outside.updateWorkersView();
              }
              if (window.Room && typeof Room.updateIncomeView === 'function') {
                Room.updateIncomeView();
              }
              API.notify('alchemists can now be assigned in the village.');
            },
            buttons: {
              'leave': { text: 'leave.', nextScene: 'end' }
            }
          }
        }
      });

      // Keep the light combat-herb bonus as flavor, but the actual village role
      // is now population-based and visible through the worker list.
      API.hooks.on('combat:kill', function(data) {
        if (Math.random() < 0.15) {
          API.state.add('stores["herbs"]', 1);
          API.notify('found some herbs on the body.');
        }
      });

    }
  };

  if (window.ExtensionLoader) {
    ExtensionLoader.register(Alchemist);
  }

})();

/**
 * Extension: The Alchemist  (v1.0.0)
 *
 * Adds a wandering alchemist NPC to the village.  Once she settles she
 * converts herbs into a rare resource called "essence".  Essence can be
 * brewed into elixirs that grant the "vitality" perk.  Killing enemies
 * sometimes yields herbs.
 *
 * Described as the full example in §11.4 of the Game Design Document.
 *
 * To enable: ensure this file is loaded before Engine.init() completes.
 */
(function() {

  var Alchemist = {
    id: 'alchemist',
    name: 'The Alchemist',
    version: '1.0.0',

    init: function(API) {

      // ------------------------------------------------------------------
      // 1. Register the "vitality" perk (unlocked when an elixir is drunk)
      // ------------------------------------------------------------------
      API.perks.register('vitality', {
        name: 'vitality',
        desc: 'maximum health increased by 5',
        notify: 'a warmth spreads through the body.'
      });

      // ------------------------------------------------------------------
      // 2. New worker: alchemist
      //    Appears in the workers panel once game.workers["alchemist"] is set.
      //    Converts herbs into essence.
      // ------------------------------------------------------------------
      API.workers.register('alchemist', {
        name: 'alchemist',
        delay: 15,
        stores: {
          'herbs':   -3,
          'essence':  1
        }
      });

      // ------------------------------------------------------------------
      // 3. New craftable: elixir  (requires Workshop)
      //    Brewed from essence and water; gives the vitality perk on use.
      // ------------------------------------------------------------------
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
        // When an elixir is built / consumed, grant the perk once.
        onBuild: function() {
          if (!$SM.hasPerk('vitality')) {
            $SM.addPerk('vitality');
          }
        }
      });

      // ------------------------------------------------------------------
      // 4. Random event: A Wandering Alchemist
      //    Available once 3 huts are built and the alchemist has not yet
      //    visited.
      // ------------------------------------------------------------------
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
            text: [ 'she nods and sets up a small corner for her work.' ],
            onLoad: function() {
              API.state.set('game.alchemistMet', true);
              // Add the alchemist to the available workers pool.
              if (typeof API.state.get('game.workers["alchemist"]') !== 'number') {
                API.state.set('game.workers["alchemist"]', 0);
              }
              API.notify('the alchemist has joined the village.');
            },
            buttons: {
              'leave': { text: 'leave.', nextScene: 'end' }
            }
          }
        }
      });

      // ------------------------------------------------------------------
      // 5. Hook: on combat kill, 15% chance the body yields herbs
      // ------------------------------------------------------------------
      API.hooks.on('combat:kill', function(data) {
        if (Math.random() < 0.15) {
          API.state.add('stores["herbs"]', 1);
          API.notify('found some herbs on the body.');
        }
      });

    }
  };

  // Self-register so the loader can call init() at the right time.
  if (window.ExtensionLoader) {
    ExtensionLoader.register(Alchemist);
  }

})();

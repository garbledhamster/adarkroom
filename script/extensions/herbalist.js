/**
 * Extension: The Herbalist  (v1.1.0)
 *
 * Adds a visible, assignable herbalist role to the village.
 *
 * Design:
 *   - Herbalist appears after the wandering herbalist event.
 *   - Assigning herbalists consumes population.
 *   - Herbalists gather herbs through the village worker system.
 *   - Travel-based herb discovery remains as a bonus mechanic.
 */
(function() {

  var Herbalist = {
    id: 'herbalist',
    name: 'The Herbalist',
    version: '1.1.0',

    init: function(API) {

      API.perks.register('herbalism', {
        name: 'herbalism',
        desc: 'find herbs while travelling',
        notify: 'learned to spot wild herbs along the path.'
      });

      // Visible assignable worker role
      API.workers.register('herbalist', {
        name: 'herbalist',
        delay: 10,
        stores: {
          'herbs': 1
        }
      });

      API.craftables.register('healing salve', {
        name: 'healing salve',
        button: null,
        type: 'tool',
        maximum: 10,
        cost: function() {
          return { 'herbs': 5, 'cloth': 2 };
        },
        buildMsg: 'a pungent salve packed into a small clay pot.',
        availableMsg: 'with enough herbs, a healing salve could be prepared.',
        onBuild: function() {
          if (!API.perks.has('herbalism')) {
            API.perks.grant('herbalism');
          }
        }
      });

      API.events.register({
        title: 'A Wandering Herbalist',
        isAvailable: function() {
          return API.state.get('game.buildings["hut"]', true) >= 1 &&
              !API.state.get('game.herbalistMet');
        },
        scenes: {
          'start': {
            text: [
              'a slight figure stops at the edge of camp.',
              'her pack is heavy with bundled plants.'
            ],
            notification: 'a wandering herbalist passes through.',
            buttons: {
              'invite': {
                text: 'invite her in.',
                nextScene: 'teach',
                reward: { herbs: 8 }
              },
              'trade': {
                text: 'trade for supplies.',
                nextScene: 'trade'
              },
              'sendAway': {
                text: 'send her away.',
                nextScene: 'end'
              }
            }
          },
          'teach': {
            text: [
              'she shows the villagers which plants are useful and which are not.'
            ],
            onLoad: function() {
              API.state.set('game.herbalistMet', true);
              if (!API.perks.has('herbalism')) {
                API.perks.grant('herbalism');
              }
              if (typeof API.state.get('game.workers["herbalist"]') !== 'number') {
                API.state.set('game.workers["herbalist"]', 0);
              }
              if (window.Outside && typeof Outside.updateWorkersView === 'function') {
                Outside.updateWorkersView();
              }
              if (window.Room && typeof Room.updateIncomeView === 'function') {
                Room.updateIncomeView();
              }
              API.notify('herbalists can now be assigned in the village.');
            },
            buttons: {
              'leave': { text: 'thank her.', nextScene: 'end' }
            }
          },
          'trade': {
            text: [
              'she exchanges herbs for meat and disappears into the trees.'
            ],
            onLoad: function() {
              API.state.set('game.herbalistMet', true);
              var meat = API.state.get('stores["cured meat"]', true);
              if (meat > 0) {
                API.state.add('stores["cured meat"]', -1);
                API.state.add('stores["herbs"]', 5);
              } else {
                API.notify('not enough cured meat to trade.');
              }
            },
            buttons: {
              'leave': { text: 'leave.', nextScene: 'end' }
            }
          }
        }
      });

      // Keep travel herb discovery as bonus flavor
      API.hooks.on('path:step', function(data) {
        if (API.perks.has('herbalism') && Math.random() < 0.08) {
          API.state.add('stores["herbs"]', 1);
          API.notify('spotted some useful plants by the trail.');
        }
      });

    }
  };

  if (window.ExtensionLoader) {
    ExtensionLoader.register(Herbalist);
  }

})();

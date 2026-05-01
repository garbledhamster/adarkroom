/**
 * Extension: The Herbalist  (v1.0.0)
 *
 * A wandering herbalist occasionally passes through the village.  She teaches
 * the survivor how to spot wild herbs, leaving behind knowledge of a crude
 * remedy called a "healing salve".  Walking through the wilderness sometimes
 * turns up useful plants.
 *
 * What this extension adds
 * ─────────────────────────
 *  • Random event  – "A Wandering Herbalist"
 *      Available after 1 hut is built and the herbalist has not yet visited.
 *      Welcoming her grants herbs and unlocks the "herbalism" perk.
 *
 *  • Craftable     – "healing salve"  (type: tool, requires workshop)
 *      Costs herbs + cloth.  Building one grants the "herbalism" perk if not
 *      already held, reflecting hard-won botanical knowledge.
 *
 *  • Hook          – path:step
 *      While travelling, 8% chance per step to find wild herbs (requires the
 *      "herbalism" perk so the character knows what to look for).
 */
(function() {

  var Herbalist = {
    id: 'herbalist',
    name: 'The Herbalist',
    version: '1.0.0',

    init: function(API) {

      // ------------------------------------------------------------------
      // 1. Register the "herbalism" perk
      // ------------------------------------------------------------------
      API.perks.register('herbalism', {
        name: 'herbalism',
        desc: 'find herbs while travelling',
        notify: 'learned to spot wild herbs along the path.'
      });

      // ------------------------------------------------------------------
      // 2. New craftable: healing salve  (requires Workshop)
      //    Costs: 5 herbs + 2 cloth.
      //    Grants the herbalism perk on first craft.
      // ------------------------------------------------------------------
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

      // ------------------------------------------------------------------
      // 3. Random event: A Wandering Herbalist
      //    Available once 1 hut is built and she has not yet visited.
      // ------------------------------------------------------------------
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
              'she spreads a handful of leaves on the ground and names them one by one.',
              'the lessons are brief but useful.'
            ],
            onLoad: function() {
              API.state.set('game.herbalistMet', true);
              if (!API.perks.has('herbalism')) {
                API.perks.grant('herbalism');
              }
            },
            buttons: {
              'leave': { text: 'thank her.', nextScene: 'end' }
            }
          },
          'trade': {
            text: [
              'she exchanges a pouch of dried herbs for a small portion of cured meat.',
              'she waves and disappears into the trees.'
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

      // ------------------------------------------------------------------
      // 4. Hook: path:step
      //    Characters with the herbalism perk have an 8% chance per step
      //    to discover wild herbs in the undergrowth.
      // ------------------------------------------------------------------
      API.hooks.on('path:step', function(data) {
        if (API.perks.has('herbalism') && Math.random() < 0.08) {
          API.state.add('stores["herbs"]', 1);
          API.notify('spotted some useful plants by the trail.');
        }
      });

    }
  };

  // Self-register so ExtensionLoader can call init() at the right time.
  if (window.ExtensionLoader) {
    ExtensionLoader.register(Herbalist);
  }

})();

/**
 * ExtensionLoader
 *
 * Discovers, registers, and initialises extension modules.
 * Extensions self-register by calling ExtensionLoader.register(ext) at the
 * bottom of their script file.  The core engine calls initAll() once all core
 * modules are ready (end of Engine.init).
 *
 * Implemented per §11.3 of the Game Design Document.
 */
var ExtensionLoader = {

  _registry: [],

  /**
   * Register a loaded extension object.
   * @param {Object} ext  Must have at least an `id` string and an `init` function.
   */
  register: function(ext) {
    if (!ext || !ext.id) {
      console.warn('[ExtensionLoader] extension missing id — not registered');
      return;
    }
    this._registry.push(ext);
    console.log('[ExtensionLoader] registered: ' + ext.id);
  },

  /**
   * Call each registered extension's init(ExtensionAPI) function.
   * Invoked by Engine.init() after all core systems are ready.
   */
  initAll: function() {
    var api = window.ExtensionAPI;
    if (!api) {
      console.error('[ExtensionLoader] ExtensionAPI not found — extensions not initialised');
      return;
    }
    this._registry.forEach(function(ext) {
      try {
        if (typeof ext.init === 'function') {
          ext.init(api);
          console.log('[ExtensionLoader] initialised: ' + ext.id);
        }
      } catch(e) {
        console.error('[ExtensionLoader] init failed for ' + ext.id, e);
      }
    });
  },

  /**
   * Dynamically inject a script tag to load an extension at runtime.
   * @param {string}   url       URL of the extension script.
   * @param {Function} callback  Optional callback fired after load.
   */
  load: function(url, callback) {
    var s = document.createElement('script');
    s.src = url;
    if (callback) s.onload = callback;
    s.onerror = function() {
      console.error('[ExtensionLoader] failed to load script: ' + url);
    };
    document.head.appendChild(s);
  },

  /**
   * Load extensions listed in a JSON manifest file.
   * @param {string} manifestUrl  URL of the manifest JSON (see extensions.json).
   */
  loadManifest: function(manifestUrl) {
    var self = this;
    fetch(manifestUrl)
      .then(function(r) { return r.json(); })
      .then(function(manifest) {
        (manifest.extensions || []).forEach(function(entry) {
          if (entry.enabled !== false) {
            self.load(entry.src);
          }
        });
      })
      .catch(function(e) {
        console.warn('[ExtensionLoader] manifest load failed', e);
      });
  }

};

/**
 * ExtensionLoader
 *
 * Discovers, registers, and initialises extension modules.
 * Extensions self-register by calling ExtensionLoader.register(ext) at the
 * bottom of their script file.  The core engine calls loadFromManifest() once
 * all core modules are ready (end of Engine.init).
 *
 * Implemented per §11.3 of the Game Design Document.
 */
var ExtensionLoader = {

  _registry: [],

  // Tracking arrays populated during loadFromManifest() and initAll().
  _loaded: [],
  _failed: [],
  _disabled: [],
  _missingDeps: [],

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
   * Populates _loaded and _failed.  Called internally by loadFromManifest()
   * after all scripts have been injected.
   */
  initAll: function() {
    var self = this;
    var api = window.ExtensionAPI;
    if (!api) {
      console.error('[ExtensionLoader] ExtensionAPI not found — extensions not initialised');
      return;
    }
    self._registry.forEach(function(ext) {
      try {
        if (typeof ext.init === 'function') {
          if (typeof api._setCurrentExtension === 'function') {
            api._setCurrentExtension(ext.id);
          }
          ext.init(api);
          console.log('[ExtensionLoader] initialised: ' + ext.id);
          if (self._loaded.indexOf(ext.id) === -1) {
            self._loaded.push(ext.id);
          }
        }
      } catch(e) {
        console.error('[ExtensionLoader] init failed for ' + ext.id, e);
        var idx = self._loaded.indexOf(ext.id);
        if (idx !== -1) self._loaded.splice(idx, 1);
        if (self._failed.indexOf(ext.id) === -1) {
          self._failed.push(ext.id);
        }
      } finally {
        if (typeof api._setCurrentExtension === 'function') {
          api._setCurrentExtension(null);
        }
      }
    });
  },

  /**
   * Dynamically inject a script tag to load an extension at runtime.
   * @param {string}   url      URL of the extension script.
   * @param {Function} onload   Optional callback fired after successful load.
   * @param {Function} onerror  Optional callback fired on load failure.
   */
  load: function(url, onload, onerror) {
    var s = document.createElement('script');
    s.src = url;
    s.onload = onload || null;
    s.onerror = function() {
      console.error('[ExtensionLoader] failed to load script: ' + url);
      if (typeof onerror === 'function') onerror();
    };
    document.head.appendChild(s);
  },

  /**
   * Load extensions from a JSON manifest, respecting enabled/disabled flags
   * and optional dependency order, then call initAll() and an optional callback.
   *
   * Extensions already registered via static <script> tags are not reloaded
   * (double-load protection).  Disabled extensions are tracked in _disabled.
   * Extensions with unmet requires are tracked in _missingDeps.
   *
   * NOTE: Requires fetch() to be available.  When running from a file:// origin
   * fetch() is blocked by the browser; the loader falls back to any extensions
   * already registered via static script tags.  See docs/EXTENSIONS.md.
   *
   * @param {string}   manifestUrl  URL or relative path to extensions.json.
   * @param {Function} callback     Optional function called after initAll().
   */
  loadFromManifest: function(manifestUrl, callback) {
    var self = this;

    function finish() {
      self.initAll();
      if (typeof callback === 'function') callback();
    }

    if (typeof fetch !== 'function') {
      console.warn('[ExtensionLoader] fetch not available — using statically loaded extensions only');
      finish();
      return;
    }

    fetch(manifestUrl)
      .then(function(r) { return r.json(); })
      .then(function(manifest) {
        var entries = manifest.extensions || [];

        // Build set of IDs already present from static <script> tags.
        var staticIds = {};
        self._registry.forEach(function(e) { staticIds[e.id] = true; });

        var toLoad = [];
        entries.forEach(function(entry) {
          if (!entry.id) {
            console.warn('[ExtensionLoader] manifest entry missing id — skipping', entry);
            return;
          }
          if (entry.enabled === false) {
            self._disabled.push(entry.id);
            console.log('[ExtensionLoader] disabled: ' + entry.id);
            return;
          }
          if (staticIds[entry.id]) {
            // Already present via static script tag — do not reload.
            console.log('[ExtensionLoader] already loaded (static): ' + entry.id);
            return;
          }
          if (!entry.src) {
            console.warn('[ExtensionLoader] manifest entry "' + entry.id + '" missing src — skipping');
            self._failed.push(entry.id);
            return;
          }
          toLoad.push(entry);
        });

        if (toLoad.length === 0) {
          finish();
          return;
        }

        // IDs available for dependency resolution: statically loaded + successfully
        // script-loaded manifest entries so far.  A failed script load does NOT
        // add to knownIds (only the onload callback does), so broken dependencies
        // are correctly excluded.
        var knownIds = {};
        Object.keys(staticIds).forEach(function(id) { knownIds[id] = true; });

        // Load scripts sequentially so that dependency checks work correctly.
        function loadNext(index) {
          if (index >= toLoad.length) {
            finish();
            return;
          }

          var entry = toLoad[index];

          // Dependency check.
          if (Array.isArray(entry.requires) && entry.requires.length > 0) {
            var missing = entry.requires.filter(function(dep) { return !knownIds[dep]; });
            if (missing.length > 0) {
              console.warn('[ExtensionLoader] "' + entry.id + '" missing dependencies: ' + missing.join(', ') + ' — skipping');
              self._missingDeps.push({ id: entry.id, missing: missing });
              loadNext(index + 1);
              return;
            }
          }

          self.load(
            entry.src,
            function() {
              knownIds[entry.id] = true;
              loadNext(index + 1);
            },
            function() {
              self._failed.push(entry.id);
              loadNext(index + 1);
            }
          );
        }

        loadNext(0);
      })
      .catch(function(e) {
        console.warn('[ExtensionLoader] manifest load failed — using statically loaded extensions only', e);
        finish();
      });
  },

  // ---------------------------------------------------------------------------
  // Query methods
  // ---------------------------------------------------------------------------

  /** Returns IDs of extensions that successfully initialised. */
  getLoaded: function() {
    return this._loaded.slice();
  },

  /** Returns IDs of extensions that failed to load or threw during init. */
  getFailed: function() {
    return this._failed.slice();
  },

  /** Returns IDs of extensions that were explicitly disabled in the manifest. */
  getDisabled: function() {
    return this._disabled.slice();
  },

  /** Returns a full diagnostic snapshot for console inspection. */
  getDiagnostics: function() {
    return {
      loaded: this._loaded.slice(),
      failed: this._failed.slice(),
      disabled: this._disabled.slice(),
      missingDeps: this._missingDeps.slice(),
      registered: this._registry.map(function(e) { return e.id; })
    };
  },

  /**
   * @deprecated Use loadFromManifest() instead.
   * Loads scripts listed in a manifest without tracking or dependency support.
   * Kept for backward compatibility.
   * @param {string} manifestUrl  URL of the manifest JSON.
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

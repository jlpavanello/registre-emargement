import { IDBAdapter, initIDB } from './idb-adapter.js';
import { LocalStorageAdapter } from './local-storage.js';
import { syncPush } from '../supabase/data-sync.js';

// Phase 2: IndexedDB with in-memory cache for sync reads.
// Phase 4+: Every set() also pushes to Supabase for multi-device sync.
// Falls back to localStorage if IndexedDB is not available.

let _storage = null;
let _initialized = false;
let _fallback = null; // Lazy singleton fallback — avoid creating new LocalStorageAdapter on every call
let _warnedOnce = false;

/**
 * Get the localStorage fallback (lazy singleton).
 * Avoids creating a new instance on every proxy call.
 */
function getFallback() {
  if (!_fallback) _fallback = new LocalStorageAdapter();
  if (!_warnedOnce) {
    console.warn('⚠️ storage used before initStorage() — using localStorage fallback');
    _warnedOnce = true;
  }
  return _fallback;
}

/**
 * Initialize the storage backend.
 * Must be called (and awaited) before the app uses storage.
 * After initialization, the proxy switches from fallback to the real adapter.
 */
export async function initStorage() {
  if (_initialized) return;
  try {
    await initIDB();
    _storage = new IDBAdapter();
    _initialized = true;
    console.log('✅ Storage: IndexedDB active');
  } catch (e) {
    console.warn('⚠️ IndexedDB unavailable, falling back to localStorage:', e);
    _storage = new LocalStorageAdapter();
    _initialized = true;
  }

  // Migrate any data written to fallback during early access
  if (_fallback && _storage !== _fallback) {
    try {
      const keys = _fallback.keys ? _fallback.keys() : [];
      for (const key of keys) {
        const val = _fallback.get(key);
        if (val !== undefined && val !== null) {
          _storage.set(key, val);
        }
      }
    } catch (e) {
      // Non-critical — fallback data may not support keys()
    }
  }
}

/**
 * Get the raw storage adapter (for sync operations that need direct access)
 */
export function getRawStorage() {
  return _storage || getFallback();
}

/**
 * The storage instance with automatic Supabase sync.
 * Every set() writes locally AND pushes to Supabase.
 * get() reads from local cache (fast, synchronous).
 */
export const storage = new Proxy({}, {
  get(_target, prop) {
    // Before init, use localStorage fallback (singleton, warns once)
    if (!_storage) {
      const fb = getFallback();
      if (prop === 'set') {
        return (key, value) => {
          fb.set(key, value);
          syncPush(key, value);
        };
      }
      const val = fb[prop];
      return typeof val === 'function' ? val.bind(fb) : val;
    }

    // Intercept set() to also sync to Supabase
    if (prop === 'set') {
      return (key, value) => {
        _storage.set(key, value);
        syncPush(key, value);
      };
    }

    const val = _storage[prop];
    return typeof val === 'function' ? val.bind(_storage) : val;
  },
});

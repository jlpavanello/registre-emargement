import { IDBAdapter, initIDB } from './idb-adapter.js';
import { LocalStorageAdapter } from './local-storage.js';
import { syncPush } from '../supabase/data-sync.js';

// Phase 2: IndexedDB with in-memory cache for sync reads.
// Phase 4+: Every set() also pushes to Supabase for multi-device sync.
// Falls back to localStorage if IndexedDB is not available.

let _storage = null;
let _initialized = false;

/**
 * Initialize the storage backend.
 * Must be called (and awaited) before the app uses storage.
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
}

/**
 * Get the raw storage adapter (for sync operations that need direct access)
 */
export function getRawStorage() {
  return _storage || new LocalStorageAdapter();
}

/**
 * The storage instance with automatic Supabase sync.
 * Every set() writes locally AND pushes to Supabase.
 * get() reads from local cache (fast, synchronous).
 */
export const storage = new Proxy({}, {
  get(_target, prop) {
    // Before init, use localStorage as fallback
    if (!_storage) {
      if (!_initialized) {
        console.warn('⚠️ storage used before initStorage() — using localStorage fallback');
      }
      const fallback = new LocalStorageAdapter();
      if (prop === 'set') {
        return (key, value) => {
          fallback.set(key, value);
          syncPush(key, value);
        };
      }
      return fallback[prop].bind(fallback);
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

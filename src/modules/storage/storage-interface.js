import { IDBAdapter, initIDB } from './idb-adapter.js';
import { LocalStorageAdapter } from './local-storage.js';

// Phase 2: IndexedDB with in-memory cache for sync reads.
// Falls back to localStorage if IndexedDB is not available.

let _storage = null;
let _initialized = false;

/**
 * Initialize the storage backend.
 * Must be called (and awaited) before the app uses storage.
 * - Tries IndexedDB first (larger capacity, better for base64 signatures)
 * - Falls back to localStorage if IDB fails
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
 * The storage instance.
 * Before initStorage() is called, falls back to localStorage.
 */
export const storage = new Proxy({}, {
  get(_target, prop) {
    // Before init, use localStorage as fallback
    if (!_storage) {
      if (!_initialized) {
        console.warn('⚠️ storage used before initStorage() — using localStorage fallback');
      }
      const fallback = new LocalStorageAdapter();
      return fallback[prop].bind(fallback);
    }
    const val = _storage[prop];
    return typeof val === 'function' ? val.bind(_storage) : val;
  },
});

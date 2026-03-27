// IndexedDB adapter using 'idb' library
// Provides async storage with a sync in-memory cache for backward compatibility
// Phase 2: replaces localStorage for larger capacity (base64 signatures)

import { openDB } from 'idb';

const DB_NAME = 'registre-emargement';
const DB_VERSION = 1;
const STORE_CONFIG = 'config';       // team, machines, categories, responsables, info-fields, page-number
const STORE_DAY_DATA = 'day_data';   // daily signatures, visa, presence
const STORE_SYNC_QUEUE = 'sync_queue'; // future Supabase sync queue

let db = null;

// In-memory cache — keeps data available synchronously after init
const cache = new Map();

/**
 * Open (or create) the IndexedDB database
 */
async function getDB() {
  if (db) return db;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // First install: create all object stores
      if (oldVersion < 1) {
        database.createObjectStore(STORE_CONFIG);
        database.createObjectStore(STORE_DAY_DATA);
        const syncStore = database.createObjectStore(STORE_SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('by_table', 'table');
        syncStore.createIndex('by_status', 'status');
      }
    },
  });
  return db;
}

/**
 * Determine which object store a key belongs to
 */
function storeForKey(key) {
  if (key === 'reg_day') return STORE_DAY_DATA;
  return STORE_CONFIG;
}

/**
 * Initialize: open DB, migrate from localStorage if needed, load cache
 */
export async function initIDB() {
  const database = await getDB();

  // Check if migration from localStorage is needed
  const migrationDone = await database.get(STORE_CONFIG, '_migration_done');
  if (!migrationDone) {
    await migrateFromLocalStorage(database);
  }

  // Load all data into memory cache
  await loadAllToCache(database);
}

/**
 * Migrate all reg_* keys from localStorage to IndexedDB
 */
async function migrateFromLocalStorage(database) {
  const keysToMigrate = [
    'reg_team', 'reg_machines', 'reg_categories', 'reg_resp',
    'reg_info', 'reg_page', 'reg_day', 'reg_vocal',
  ];

  const tx = database.transaction([STORE_CONFIG, STORE_DAY_DATA], 'readwrite');

  for (const key of keysToMigrate) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw);
        const store = storeForKey(key);
        await tx.objectStore(store).put(value, key);
      }
    } catch (e) {
      console.warn(`Migration failed for key "${key}":`, e);
    }
  }

  // Mark migration as done
  await tx.objectStore(STORE_CONFIG).put(true, '_migration_done');
  await tx.done;

  console.log('✅ Migration localStorage → IndexedDB terminée');
}

/**
 * Load all stored data into memory cache for sync access
 */
async function loadAllToCache(database) {
  // Load config store
  const configKeys = await database.getAllKeys(STORE_CONFIG);
  for (const key of configKeys) {
    if (key === '_migration_done') continue;
    cache.set(key, await database.get(STORE_CONFIG, key));
  }

  // Load day_data store
  const dayKeys = await database.getAllKeys(STORE_DAY_DATA);
  for (const key of dayKeys) {
    cache.set(key, await database.get(STORE_DAY_DATA, key));
  }
}

/**
 * IndexedDB Adapter — same interface as LocalStorageAdapter
 * get() is synchronous (reads from cache)
 * set() updates cache immediately + writes to IDB in background
 */
export class IDBAdapter {
  /**
   * Synchronous get from memory cache
   */
  get(key) {
    return cache.get(key) || null;
  }

  /**
   * Sync cache update + async IDB write
   */
  set(key, value) {
    cache.set(key, value);
    // Write to IndexedDB — store promise for flush
    this._lastWrite = this._writeToIDB(key, value);
  }

  /**
   * Wait for the last IDB write to complete
   */
  async flush() {
    if (this._lastWrite) await this._lastWrite;
  }

  /**
   * Remove from cache + IDB
   */
  remove(key) {
    cache.delete(key);
    this._removeFromIDB(key);
  }

  /** @private */
  async _writeToIDB(key, value) {
    try {
      const database = await getDB();
      const store = storeForKey(key);
      await database.put(store, value, key);
    } catch (e) {
      console.warn('IDB write failed for', key, e);
    }
  }

  /** @private */
  async _removeFromIDB(key) {
    try {
      const database = await getDB();
      const store = storeForKey(key);
      await database.delete(store, key);
    } catch (e) {
      console.warn('IDB delete failed for', key, e);
    }
  }
}

// Phase 4: Bidirectional Supabase Sync Engine
// Offline-first: queue writes when offline, drain when online
// Architecture: UI ↔ State Store ↔ IndexedDB ↔ Sync Engine ↔ Supabase

import { getSupabase, isSupabaseEnabled } from './client.js';
import {
  getPendingOperations,
  markSynced,
  markFailed,
  clearSynced,
  getPendingCount,
  enqueue,
} from '../storage/sync-queue.js';

let _isSyncing = false;
let _syncInterval = null;
let _onStatusChange = null;

/**
 * Register a callback for sync status changes
 * @param {function} fn - (status: 'idle'|'syncing'|'error'|'offline', pending: number) => void
 */
export function onSyncStatusChange(fn) {
  _onStatusChange = fn;
}

function emitStatus(status, pending) {
  if (_onStatusChange) _onStatusChange(status, pending);
}

/**
 * Initialize the sync engine
 * - Starts listening for online/offline events
 * - Begins periodic sync if Supabase is configured
 */
export function initSyncEngine() {
  if (!isSupabaseEnabled()) {
    console.log('ℹ️ Sync engine: Supabase non configuré — sync désactivé');
    emitStatus('offline', 0);
    return;
  }

  // Listen for connectivity changes
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Initial sync attempt
  if (navigator.onLine) {
    drainQueue();
  }

  // Periodic sync every 30 seconds
  _syncInterval = setInterval(() => {
    if (navigator.onLine && !_isSyncing) {
      drainQueue();
    }
  }, 30000);

  console.log('✅ Sync engine initialisé');
}

/**
 * Stop the sync engine
 */
export function stopSyncEngine() {
  window.removeEventListener('online', onOnline);
  window.removeEventListener('offline', onOffline);
  if (_syncInterval) {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
}

function onOnline() {
  console.log('🌐 Connexion rétablie — lancement de la synchronisation');
  drainQueue();
}

function onOffline() {
  console.log('📴 Hors-ligne — les modifications seront synchronisées au retour');
  emitStatus('offline', 0);
}

/**
 * Drain the sync queue: process all pending operations
 */
export async function drainQueue() {
  if (_isSyncing) return;
  if (!navigator.onLine) {
    emitStatus('offline', await getPendingCount());
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  _isSyncing = true;
  const pending = await getPendingOperations();

  if (pending.length === 0) {
    _isSyncing = false;
    emitStatus('idle', 0);
    return;
  }

  emitStatus('syncing', pending.length);
  let successCount = 0;
  let errorCount = 0;

  for (const op of pending) {
    try {
      await processOperation(supabase, op);
      await markSynced(op.id);
      successCount++;
    } catch (err) {
      console.warn(`Sync failed for op ${op.id}:`, err.message);
      await markFailed(op.id, err.message);
      errorCount++;
    }
  }

  // Cleanup completed operations
  await clearSynced();

  _isSyncing = false;
  const remaining = await getPendingCount();

  if (errorCount > 0) {
    emitStatus('error', remaining);
  } else {
    emitStatus('idle', remaining);
  }

  console.log(`🔄 Sync terminé: ${successCount} réussis, ${errorCount} échoués, ${remaining} restants`);
}

/**
 * Process a single sync operation
 */
async function processOperation(supabase, op) {
  const { table, operation, payload } = op;

  switch (operation) {
    case 'INSERT': {
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw new Error(error.message);
      break;
    }
    case 'UPDATE': {
      const { id, ...fields } = payload;
      const { error } = await supabase.from(table).update(fields).eq('id', id);
      if (error) throw new Error(error.message);
      break;
    }
    case 'DELETE': {
      const { error } = await supabase.from(table).delete().eq('id', payload.id);
      if (error) throw new Error(error.message);
      break;
    }
    case 'UPSERT': {
      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw new Error(error.message);
      break;
    }
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Pull remote data for a given table (download from Supabase)
 * @param {string} table - Table name
 * @param {object} [filters] - Optional filters {column: value}
 * @returns {Promise<Array|null>} data or null on failure
 */
export async function pullFromRemote(table, filters = {}) {
  if (!navigator.onLine || !isSupabaseEnabled()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase.from(table).select('*');
    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn(`Pull from ${table} failed:`, err.message);
    return null;
  }
}

/**
 * Push a mutation and enqueue for offline resilience
 * If online: tries immediate push. If fails or offline: enqueues.
 */
export async function pushToRemote(table, operation, payload) {
  if (!isSupabaseEnabled()) {
    // No Supabase — just enqueue silently for when it's configured
    return;
  }

  if (navigator.onLine) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await processOperation(supabase, { table, operation, payload });
        return; // Success — no need to queue
      } catch (err) {
        console.warn(`Immediate push failed, enqueueing:`, err.message);
      }
    }
  }

  // Offline or push failed — enqueue for later
  await enqueue(table, operation, payload);
  const count = await getPendingCount();
  emitStatus(navigator.onLine ? 'error' : 'offline', count);
}

/**
 * Force a full sync (pull + push)
 */
export async function fullSync() {
  await drainQueue();
}

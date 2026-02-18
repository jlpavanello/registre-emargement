// Sync Queue for future Supabase integration
// Phase 2: stores pending mutations for later sync
// Phase 4 will drain this queue when online

import { openDB } from 'idb';

const DB_NAME = 'registre-emargement';
const STORE_SYNC_QUEUE = 'sync_queue';

/**
 * Get the existing DB connection
 * (DB should already be opened by idb-adapter.js initIDB)
 */
async function getDB() {
  return openDB(DB_NAME, 1);
}

/**
 * Enqueue a mutation for future Supabase sync
 * @param {string} table - Supabase table name (e.g. 'emargements', 'daily_registers')
 * @param {'INSERT'|'UPDATE'|'DELETE'} operation - SQL operation type
 * @param {object} payload - The data to sync
 */
export async function enqueue(table, operation, payload) {
  try {
    const db = await getDB();
    await db.add(STORE_SYNC_QUEUE, {
      table,
      operation,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
  } catch (e) {
    console.warn('Failed to enqueue sync operation:', e);
  }
}

/**
 * Get all pending operations (for future sync drain)
 * @returns {Promise<Array>} pending operations sorted by creation time
 */
export async function getPendingOperations() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
    const index = tx.store.index('by_status');
    return await index.getAll('pending');
  } catch (e) {
    console.warn('Failed to get pending operations:', e);
    return [];
  }
}

/**
 * Mark an operation as synced (completed)
 * @param {number} id - Operation ID
 */
export async function markSynced(id) {
  try {
    const db = await getDB();
    const op = await db.get(STORE_SYNC_QUEUE, id);
    if (op) {
      op.status = 'synced';
      op.syncedAt = new Date().toISOString();
      await db.put(STORE_SYNC_QUEUE, op);
    }
  } catch (e) {
    console.warn('Failed to mark operation as synced:', e);
  }
}

/**
 * Mark an operation as failed and increment retry count
 * @param {number} id - Operation ID
 * @param {string} error - Error message
 */
export async function markFailed(id, error) {
  try {
    const db = await getDB();
    const op = await db.get(STORE_SYNC_QUEUE, id);
    if (op) {
      op.status = op.retryCount >= 5 ? 'dead' : 'pending';
      op.retryCount = (op.retryCount || 0) + 1;
      op.lastError = error;
      op.lastAttempt = new Date().toISOString();
      await db.put(STORE_SYNC_QUEUE, op);
    }
  } catch (e) {
    console.warn('Failed to mark operation as failed:', e);
  }
}

/**
 * Clear all synced operations (cleanup)
 */
export async function clearSynced() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
    const index = tx.store.index('by_status');
    let cursor = await index.openCursor('synced');
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch (e) {
    console.warn('Failed to clear synced operations:', e);
  }
}

/**
 * Get count of pending operations (for UI badge)
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
    const index = tx.store.index('by_status');
    return await index.count('pending');
  } catch (e) {
    return 0;
  }
}

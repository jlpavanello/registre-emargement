// Phase 4+: Data synchronization layer
// Bridges local storage ↔ Supabase for real multi-device sync
//
// Strategy:
// - On save: write locally + push to Supabase table 'shared_data'
// - On init: pull from Supabase and merge with local data
// - Uses a simple key-value approach via 'shared_data' table
// - Conflict resolution: last-write-wins (most recent updated_at)

import { getSupabase, isSupabaseEnabled } from './client.js';

const TABLE = 'shared_data';

/**
 * Push a key-value pair to Supabase (fire-and-forget)
 * Called automatically by storage.set() via the sync proxy
 */
export function syncPush(key, value) {
  if (!isSupabaseEnabled() || !navigator.onLine) return;

  // Safety: never push empty team/machines scaffold to Supabase
  if ((key === 'reg_team' || key === 'reg_machines') && Array.isArray(value)) {
    const hasReal = value.some(item => item.nom);
    if (!hasReal) return; // Skip — empty scaffold, don't overwrite remote data
  }

  const supabase = getSupabase();
  if (!supabase) return;

  // Fire-and-forget — don't block the UI
  supabase
    .from(TABLE)
    .upsert(
      {
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .then(({ error }) => {
      if (error) {
        console.warn(`Sync push failed for "${key}":`, error.message);
      }
    });
}

/**
 * Pull all shared data from Supabase
 * Called once at startup to merge remote data with local
 * @param {object} localStorage - The storage adapter to merge into
 * @returns {Promise<object>} Map of keys that were updated from remote
 */
export async function syncPullAll(storageAdapter) {
  if (!isSupabaseEnabled() || !navigator.onLine) return {};

  const supabase = getSupabase();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) {
      console.warn('Sync pull failed:', error.message);
      return {};
    }

    if (!data || data.length === 0) return {};

    const updated = {};
    for (const row of data) {
      try {
        const remoteValue = JSON.parse(row.value);
        const localValue = storageAdapter.get(row.key);

        // If no local data, use remote
        // If both exist, compare — remote wins (it's the shared source of truth)
        if (!localValue || shouldUseRemote(row.key, localValue, remoteValue)) {
          storageAdapter.set(row.key, remoteValue);
          updated[row.key] = remoteValue;
        }
      } catch (e) {
        console.warn(`Failed to merge key "${row.key}":`, e);
      }
    }

    const count = Object.keys(updated).length;
    if (count > 0) {
      console.log(`🔄 Sync pull: ${count} clé(s) mises à jour depuis le serveur`);
    }
    return updated;
  } catch (e) {
    console.warn('Sync pull error:', e);
    return {};
  }
}

/**
 * Decide whether remote data should overwrite local data
 * For day data: only if same date and remote is newer
 * For config data: remote always wins (shared config)
 */
function shouldUseRemote(key, localValue, remoteValue) {
  // Day data: only overwrite if same date AND remote is newer
  if (key === 'reg_day') {
    if (localValue?.date && remoteValue?.date) {
      if (localValue.date !== remoteValue.date) return false;
      // If both have timestamps, only use remote if it's more recent
      if (localValue.updatedAt && remoteValue.updatedAt) {
        return remoteValue.updatedAt > localValue.updatedAt;
      }
      // Local has timestamp but remote doesn't → local is newer
      if (localValue.updatedAt) return false;
      // Neither has timestamp → remote wins (legacy)
      return true;
    }
    return false;
  }
  // Config data: remote wins (team, machines, categories, etc.)
  return true;
}

/**
 * Push ALL local data to Supabase (initial upload)
 * Used when syncing for the first time
 */
export async function syncPushAll(storageAdapter) {
  if (!isSupabaseEnabled() || !navigator.onLine) return;

  const supabase = getSupabase();
  if (!supabase) return;

  // Safety: don't push if local data is empty (new device with no real data)
  const team = storageAdapter.get('reg_team');
  const hasRealData = team && Array.isArray(team) && team.some(t => t.nom);
  if (!hasRealData) {
    console.log('ℹ️ syncPushAll ignoré — pas de données réelles à pousser');
    return;
  }

  const keys = [
    'reg_team', 'reg_machines', 'reg_categories', 'reg_resp',
    'reg_info', 'reg_page', 'reg_day', 'reg_vocal',
    'reg_stock_munitions', 'reg_stock_armes', 'reg_stock_mouvements',
    'reg_previsions_tir', 'reg_fournisseurs', 'reg_commandes',
    'reg_pv_templates', 'reg_pv_documents',
    'reg_chat_messages',
    'reg_planning_entries', 'reg_planning_shifts', 'reg_planning_cycles', 'reg_planning_leaves',
  ];

  const rows = [];
  for (const key of keys) {
    const value = storageAdapter.get(key);
    if (value) {
      rows.push({
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) return;

  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'key' });

  if (error) {
    console.warn('Sync push all failed:', error.message);
  } else {
    console.log(`📤 Sync push: ${rows.length} clé(s) envoyées au serveur`);
  }
}

/**
 * Subscribe to real-time changes from other devices
 * When another device pushes a change, we receive it here
 */
export function subscribeToChanges(storageAdapter, onDataChanged) {
  if (!isSupabaseEnabled()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const channel = supabase
    .channel('shared_data_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          try {
            const value = JSON.parse(row.value);
            // For day data: skip if local is more recent (avoid overwriting own changes)
            if (row.key === 'reg_day') {
              const localValue = storageAdapter.get(row.key);
              if (localValue?.updatedAt && (!value.updatedAt || localValue.updatedAt >= value.updatedAt)) {
                return;
              }
            }
            storageAdapter.set(row.key, value);
            console.log(`📥 Données reçues d'un autre appareil: ${row.key}`);
            if (onDataChanged) onDataChanged(row.key, value);
          } catch (e) {
            console.warn('Failed to process realtime change:', e);
          }
        }
      }
    )
    .subscribe();

  console.log('📡 Écoute en temps réel activée');
  return channel;
}

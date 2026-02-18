// Supabase client configuration
// Phase 3: Sets up the Supabase connection (used in Phase 4 for sync)
//
// Environment variables needed (set in Vercel dashboard):
//   VITE_SUPABASE_URL     — Your Supabase project URL
//   VITE_SUPABASE_ANON_KEY — Your Supabase anon/public key

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _client = null;

/**
 * Get the Supabase client instance (singleton).
 * Returns null if Supabase is not configured (offline-only mode).
 */
export function getSupabase() {
  if (_client) return _client;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('ℹ️ Supabase non configuré — mode hors-ligne uniquement');
    return null;
  }

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    // Retry config for unreliable connections
    global: {
      headers: {
        'x-app-version': '2.0.0',
      },
    },
  });

  console.log('✅ Supabase client initialisé');
  return _client;
}

/**
 * Check if Supabase is available and configured
 */
export function isSupabaseEnabled() {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Check if we're currently online and Supabase is reachable
 */
export async function isSupabaseReachable() {
  if (!isSupabaseEnabled()) return false;
  if (!navigator.onLine) return false;

  try {
    const client = getSupabase();
    if (!client) return false;
    // Simple health check — query a small table
    const { error } = await client.from('organizations').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

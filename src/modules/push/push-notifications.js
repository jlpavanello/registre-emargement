// Module: Push Notifications (Web Push API)
// Gère l'abonnement aux notifications push et l'envoi via Edge Function Supabase

import { getSupabase, isSupabaseEnabled } from '../supabase/client.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/push-notify` : '';

// ── Support Detection ────────────────────────────────────

export function isPushSupported() {
  return 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// ── Permission Request ───────────────────────────────────

export async function requestPushPermission() {
  if (!isPushSupported()) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Subscribe to Push ────────────────────────────────────

/**
 * S'abonne aux notifications push.
 * - Demande la permission si nécessaire
 * - Crée un PushSubscription via le Service Worker
 * - Sauvegarde l'abonnement dans Supabase (push_subscriptions)
 * @returns {PushSubscription|null}
 */
export async function subscribeToPush() {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
    console.log('ℹ️ Push non supporté ou clé VAPID manquante');
    return null;
  }

  // Request permission if not already granted
  if (Notification.permission === 'default') {
    const granted = await requestPushPermission();
    if (!granted) {
      console.log('ℹ️ Permission de notification refusée');
      return null;
    }
  } else if (Notification.permission === 'denied') {
    console.log('ℹ️ Notifications bloquées par l\'utilisateur');
    return null;
  }

  try {
    // Timeout de 5s pour éviter de bloquer si le SW n'est pas prêt
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service Worker non prêt (timeout 5s)')), 5000)
      ),
    ]);

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('✅ Abonnement push créé');
    } else {
      console.log('ℹ️ Abonnement push existant réutilisé');
    }

    // Save to Supabase
    await _saveSubscription(subscription);
    return subscription;
  } catch (err) {
    console.warn('❌ Erreur abonnement push:', err.message);
    return null;
  }
}

// ── Unsubscribe ──────────────────────────────────────────

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await _removeSubscription();
      console.log('✅ Désabonnement push effectué');
    }
  } catch (err) {
    console.warn('❌ Erreur désabonnement push:', err.message);
  }
}

// ── Trigger Push Notification (called after sending a chat message) ──

/**
 * Appelle l'Edge Function Supabase pour notifier les autres appareils.
 * Fire-and-forget: les erreurs sont silencieuses pour ne pas bloquer le chat.
 * @param {string} senderName - Nom de l'expéditeur
 * @param {string} messageText - Texte du message
 */
export async function triggerPushNotification(senderName, messageText) {
  if (!EDGE_FUNCTION_URL || !isSupabaseEnabled()) return;

  const deviceId = localStorage.getItem('sync_device_id');
  if (!deviceId) return;

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        senderDeviceId: deviceId,
        senderName: senderName,
        messagePreview: messageText,
      }),
    });

    if (!response.ok) {
      console.warn('Push notify HTTP', response.status);
    }
  } catch (err) {
    // Silencieux — ne pas bloquer le chat
    console.warn('Push notify erreur:', err.message);
  }
}

// ── Internal: Save subscription to Supabase ──────────────

async function _saveSubscription(subscription) {
  const supabase = getSupabase();
  if (!supabase) return;

  const deviceId = localStorage.getItem('sync_device_id');
  if (!deviceId) return;

  const subJSON = subscription.toJSON();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      device_id: deviceId,
      endpoint: subJSON.endpoint,
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'device_id' }
  );

  if (error) {
    console.warn('Erreur sauvegarde abonnement push:', error.message);
  } else {
    console.log('✅ Abonnement push sauvegardé dans Supabase');
  }
}

// ── Internal: Remove subscription from Supabase ──────────

async function _removeSubscription() {
  const supabase = getSupabase();
  if (!supabase) return;

  const deviceId = localStorage.getItem('sync_device_id');
  if (!deviceId) return;

  await supabase.from('push_subscriptions').delete().eq('device_id', deviceId);
}

// ── Internal: Convert VAPID public key ───────────────────

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

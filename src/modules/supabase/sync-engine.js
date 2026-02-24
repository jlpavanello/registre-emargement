// Phase 4: Full-State Supabase Sync Engine
// Strategy: push/pull entire app state as a single JSONB row
// Last-write-wins with device_id tracking
// Debounced push (3s), periodic pull (30s)

import { getSupabase, isSupabaseEnabled } from './client.js';
import { getState, setState } from '../state.js';

// Domain save functions (same pattern as export-import.js)
import { saveTeam } from '../domains/team.js';
import { saveMachines } from '../domains/machines.js';
import { saveCategories } from '../domains/categories.js';
import { saveResponsables } from '../domains/responsables.js';
import { syncDayData, saveDayData } from '../domains/day-data.js';
import { saveInfoFields } from '../domains/info-fields.js';
import { saveVehicles } from '../domains/crews.js';
import { saveMunitionRefs } from '../domains/stock-munitions.js';
import { saveStockArmes } from '../domains/stock-armes.js';
import { saveStockMouvements } from '../domains/stock-mouvements.js';
import { savePrevisionsTir } from '../domains/previsions-tir.js';
import { saveFournisseurs } from '../domains/fournisseurs.js';
import { saveCommandes } from '../domains/commandes.js';
import { savePvTemplates } from '../domains/pv-templates.js';
import { savePvDocuments } from '../domains/pv-documents.js';
import { saveChatMessages } from '../domains/chat-data.js';
import { saveAuditLog } from '../domains/audit-log.js';
import { saveIncidents } from '../domains/incidents.js';
import { saveVocalReports } from '../domains/vocal-data.js';
import { savePageNumber } from '../domains/page-number.js';

// ── Status callback ────────────────────────────────────────
let _onStatusChange = null;
let _isSyncing = false;
let _pullInterval = null;
let _pushTimer = null;
let _lastPushTime = 0;

/**
 * Register a callback for sync status changes
 * @param {function} fn - (status: 'idle'|'syncing'|'error'|'offline', pending: number) => void
 */
export function onSyncStatusChange(fn) {
  _onStatusChange = fn;
}

function emitStatus(status, pending = 0) {
  if (_onStatusChange) _onStatusChange(status, pending);
}

// ── Device ID ──────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('sync_device_id');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('sync_device_id', id);
  }
  return id;
}

// ── Build state snapshot ───────────────────────────────────
function buildStateSnapshot() {
  const state = getState();
  return {
    // Config
    team: state.team,
    machines: state.machines,
    categories: state.categories,
    responsables: state.responsables,
    vehicles: state.vehicles,
    pageNumber: state.pageNumber,
    infoFields: {
      entreprise: document.getElementById('entreprise')?.value || '',
      refChantier: document.getElementById('refChantier')?.value || '',
      responsable: document.getElementById('responsable')?.value || '',
      adresseChantier: document.getElementById('adresseChantier')?.value || '',
    },
    // Données du jour
    dayData: state.dayData,
    presentToday: state.presentToday,
    visaMatin: state.visaMatin,
    visaSoir: state.visaSoir,
    visaMatinSigner: state.visaMatinSigner,
    visaSoirSigner: state.visaSoirSigner,
    lockedMatinPresents: state.lockedMatinPresents,
    lockedSoirPresents: state.lockedSoirPresents,
    crewAssignments: state.crewAssignments,
    crewDrivers: state.crewDrivers,
    // Stock & Logistique
    munitionRefs: state.munitionRefs,
    stockArmes: state.stockArmes,
    stockMouvements: state.stockMouvements,
    previsionsTir: state.previsionsTir,
    fournisseurs: state.fournisseurs,
    commandes: state.commandes,
    // PV
    pvTemplates: state.pvTemplates,
    pvDocuments: state.pvDocuments,
    // Autres
    vocalReports: state.vocalReports,
    chatMessages: state.chatMessages,
    auditLog: state.auditLog,
    incidents: state.incidents,
  };
}

// ── Apply remote state to local app ────────────────────────
function applyRemoteState(data) {
  if (!data || typeof data !== 'object') return;

  // Config
  if (data.team) { setState('team', data.team); saveTeam(); }
  if (data.machines) { setState('machines', data.machines); saveMachines(); }
  if (data.categories) { setState('categories', data.categories); saveCategories(); }
  if (data.responsables) { setState('responsables', data.responsables); saveResponsables(); }
  if (data.vehicles) { setState('vehicles', data.vehicles); saveVehicles(); }
  if (data.pageNumber !== undefined) { setState('pageNumber', data.pageNumber); savePageNumber(); }
  if (data.infoFields) {
    const inf = data.infoFields;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    setVal('entreprise', inf.entreprise);
    setVal('refChantier', inf.refChantier);
    setVal('responsable', inf.responsable);
    setVal('adresseChantier', inf.adresseChantier);
    saveInfoFields();
  }

  // Données du jour
  if (data.dayData) setState('dayData', data.dayData);
  if (data.presentToday) setState('presentToday', data.presentToday);
  if (data.visaMatin !== undefined) setState('visaMatin', data.visaMatin);
  if (data.visaSoir !== undefined) setState('visaSoir', data.visaSoir);
  if (data.visaMatinSigner !== undefined) setState('visaMatinSigner', data.visaMatinSigner);
  if (data.visaSoirSigner !== undefined) setState('visaSoirSigner', data.visaSoirSigner);
  if (data.lockedMatinPresents) setState('lockedMatinPresents', data.lockedMatinPresents);
  if (data.lockedSoirPresents) setState('lockedSoirPresents', data.lockedSoirPresents);
  if (data.crewAssignments) setState('crewAssignments', data.crewAssignments);
  if (data.crewDrivers) setState('crewDrivers', data.crewDrivers);
  syncDayData();
  saveDayData();

  // Stock & Logistique
  if (data.munitionRefs) { setState('munitionRefs', data.munitionRefs); saveMunitionRefs(); }
  if (data.stockArmes) { setState('stockArmes', data.stockArmes); saveStockArmes(); }
  if (data.stockMouvements) { setState('stockMouvements', data.stockMouvements); saveStockMouvements(); }
  if (data.previsionsTir) { setState('previsionsTir', data.previsionsTir); savePrevisionsTir(); }
  if (data.fournisseurs) { setState('fournisseurs', data.fournisseurs); saveFournisseurs(); }
  if (data.commandes) { setState('commandes', data.commandes); saveCommandes(); }

  // PV
  if (data.pvTemplates) { setState('pvTemplates', data.pvTemplates); savePvTemplates(); }
  if (data.pvDocuments) { setState('pvDocuments', data.pvDocuments); savePvDocuments(); }

  // Autres
  if (data.vocalReports) { setState('vocalReports', data.vocalReports); saveVocalReports(); }
  if (data.chatMessages) { setState('chatMessages', data.chatMessages); saveChatMessages(); }
  if (data.auditLog) { setState('auditLog', data.auditLog); saveAuditLog(); }
  if (data.incidents) { setState('incidents', data.incidents); saveIncidents(); }

  console.log('✅ État distant appliqué localement');
}

// ── Push state to Supabase ─────────────────────────────────
async function pushState() {
  const supabase = getSupabase();
  if (!supabase || !navigator.onLine) return false;

  try {
    const snapshot = buildStateSnapshot();
    const deviceId = getDeviceId();

    const { error } = await supabase.from('app_data').upsert({
      id: 'main',
      device_id: deviceId,
      data: snapshot,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    _lastPushTime = Date.now();
    console.log('⬆️ État poussé vers Supabase');
    return true;
  } catch (err) {
    console.warn('Push échoué:', err.message);
    return false;
  }
}

// ── Pull state from Supabase ───────────────────────────────
async function pullState() {
  const supabase = getSupabase();
  if (!supabase || !navigator.onLine) return false;

  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      // PGRST116 = no rows found — first sync, just push our state
      if (error.code === 'PGRST116') {
        console.log('📦 Aucune donnée distante — premier push');
        return await pushState();
      }
      throw error;
    }

    if (!data) return false;

    // Only apply if remote is from a different device or is newer
    const remoteDevice = data.device_id;
    const localDevice = getDeviceId();
    const remoteTime = new Date(data.updated_at).getTime();

    // Skip if this is our own last push (avoid loop)
    if (remoteDevice === localDevice && remoteTime <= _lastPushTime) {
      return false;
    }

    // Apply remote state if it's from another device
    // or if it's newer than our last push (someone else pushed after us)
    if (remoteDevice !== localDevice || remoteTime > _lastPushTime + 5000) {
      console.log(`⬇️ État distant détecté (device: ${remoteDevice.slice(0, 12)}..., date: ${data.updated_at})`);
      applyRemoteState(data.data);
      _lastPushTime = remoteTime; // avoid re-pushing what we just pulled
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Pull échoué:', err.message);
    return false;
  }
}

// ── Full sync (pull then push) ─────────────────────────────
export async function fullSync() {
  if (_isSyncing) return;
  if (!isSupabaseEnabled() || !navigator.onLine) {
    emitStatus('offline', 0);
    return;
  }

  _isSyncing = true;
  emitStatus('syncing', 0);

  try {
    await pullState();
    await pushState();
    emitStatus('idle', 0);
  } catch (err) {
    console.warn('Sync complète échouée:', err.message);
    emitStatus('error', 1);
  } finally {
    _isSyncing = false;
  }
}

// ── Schedule a debounced push (call after any local save) ──
export function schedulePush() {
  if (!isSupabaseEnabled()) return;

  // Clear existing timer
  if (_pushTimer) clearTimeout(_pushTimer);

  // Debounce: push 3 seconds after last change
  _pushTimer = setTimeout(async () => {
    if (!navigator.onLine) {
      emitStatus('offline', 1);
      return;
    }
    emitStatus('syncing', 0);
    const ok = await pushState();
    emitStatus(ok ? 'idle' : 'error', ok ? 0 : 1);
  }, 3000);
}

// ── Initialize ─────────────────────────────────────────────
export function initSyncEngine() {
  if (!isSupabaseEnabled()) {
    console.log('ℹ️ Sync engine: Supabase non configuré — sync désactivé');
    emitStatus('offline', 0);
    return;
  }

  // Online/offline listeners
  window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie — synchronisation');
    fullSync();
  });
  window.addEventListener('offline', () => {
    console.log('📴 Hors-ligne');
    emitStatus('offline', 0);
  });

  // Initial sync after app load
  if (navigator.onLine) {
    setTimeout(() => fullSync(), 2000); // Wait for app to finish loading
  }

  // Periodic pull every 30 seconds (to get changes from other devices)
  _pullInterval = setInterval(async () => {
    if (navigator.onLine && !_isSyncing) {
      try {
        const pulled = await pullState();
        if (pulled) {
          console.log('🔄 Données mises à jour depuis un autre appareil');
        }
      } catch (err) {
        // Silent fail for periodic pulls
      }
    }
  }, 30000);

  console.log('✅ Sync engine initialisé (full-state mode)');
}

// ── Stop engine ────────────────────────────────────────────
export function stopSyncEngine() {
  if (_pullInterval) {
    clearInterval(_pullInterval);
    _pullInterval = null;
  }
  if (_pushTimer) {
    clearTimeout(_pushTimer);
    _pushTimer = null;
  }
}

// ── Legacy exports (compatibility) ─────────────────────────
export async function drainQueue() { return fullSync(); }
export async function pushToRemote() { return schedulePush(); }
export async function pullFromRemote() { return pullState(); }

// Domain module: Munition references management
// localStorage key: 'reg_munition_refs'
// munitionRefs is array of { id, nom, calibre, unite, armeIdxList, stockActuel, seuilAlerte, seuilCritique }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_munition_refs';
const OLD_STORAGE_KEY = 'reg_stock_munitions';

// --- Load / Save ---

export function loadMunitionRefs() {
  try {
    let data = storage.get(STORAGE_KEY);
    if (data && Array.isArray(data)) {
      setState('munitionRefs', data);
      return;
    }
    // Try migration from old format
    const oldData = storage.get(OLD_STORAGE_KEY);
    if (oldData && typeof oldData === 'object' && !Array.isArray(oldData)) {
      const migrated = migrateFromOldFormat(oldData);
      setState('munitionRefs', migrated);
      saveMunitionRefs();
    }
  } catch (e) {
    console.warn('⚠️ Erreur chargement munitionRefs:', e);
    setState('munitionRefs', []);
  }
}

export function saveMunitionRefs() {
  const { munitionRefs } = getState();
  storage.set(STORAGE_KEY, munitionRefs);
}

// --- Migration ---

function migrateFromOldFormat(oldStockMunitions) {
  const { machines } = getState();
  const refs = [];
  for (const [idxStr, stock] of Object.entries(oldStockMunitions)) {
    const idx = +idxStr;
    const machine = machines[idx];
    if (!machine || !machine.nom) continue;
    refs.push({
      id: 'mref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      nom: machine.nom + ' - Munitions',
      calibre: '',
      unite: stock.unite || 'cartouche',
      conditionnement: 1,
      armeIdxList: [idx],
      stockActuel: stock.stockActuel || 0,
      seuilAlerte: stock.seuilAlerte || 100,
      seuilCritique: stock.seuilCritique || 30,
    });
  }
  return refs;
}

// --- CRUD ---

export function addMunitionRef({ nom, calibre = '', unite = 'cartouche', conditionnement = 1, armeIdxList = [], stockActuel = 0, seuilAlerte = 100, seuilCritique = 30 }) {
  const { munitionRefs } = getState();
  const ref = {
    id: 'mref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    nom,
    calibre,
    unite,
    conditionnement: conditionnement || 1,
    armeIdxList,
    stockActuel,
    seuilAlerte,
    seuilCritique,
  };
  munitionRefs.push(ref);
  setState('munitionRefs', munitionRefs);
  saveMunitionRefs();
  return ref;
}

export function updateMunitionRef(id, updates) {
  const { munitionRefs } = getState();
  const ref = munitionRefs.find(r => r.id === id);
  if (!ref) return null;
  Object.assign(ref, updates);
  setState('munitionRefs', munitionRefs);
  saveMunitionRefs();
  return ref;
}

export function deleteMunitionRef(id) {
  const { munitionRefs } = getState();
  const idx = munitionRefs.findIndex(r => r.id === id);
  if (idx === -1) return false;
  munitionRefs.splice(idx, 1);
  setState('munitionRefs', munitionRefs);
  saveMunitionRefs();
  return true;
}

export function getMunRefById(id) {
  const { munitionRefs } = getState();
  return munitionRefs.find(r => r.id === id) || null;
}

// --- Lookup ---

/**
 * Find the munition reference that covers a given weapon index
 */
export function findMunRefForWeapon(machineIdx) {
  const { munitionRefs } = getState();
  return munitionRefs.find(r => r.armeIdxList.includes(machineIdx)) || null;
}

// --- Stock operations ---

export function adjustMunRefStock(munRefId, delta) {
  const ref = getMunRefById(munRefId);
  if (!ref) return 0;
  ref.stockActuel = Math.max(0, ref.stockActuel + delta);
  saveMunitionRefs();
  return ref.stockActuel;
}

export function updateSeuils(munRefId, seuilAlerte, seuilCritique) {
  const ref = getMunRefById(munRefId);
  if (!ref) return;
  ref.seuilAlerte = seuilAlerte;
  ref.seuilCritique = seuilCritique;
  saveMunitionRefs();
}

// --- Alert system ---

export function getMunRefAlertLevel(munRefId) {
  const ref = getMunRefById(munRefId);
  if (!ref) return 'ok';
  if (ref.stockActuel <= ref.seuilCritique) return 'critique';
  if (ref.stockActuel <= ref.seuilAlerte) return 'alerte';
  return 'ok';
}

export function getAlertLevelForRef(ref) {
  if (!ref) return 'ok';
  if (ref.stockActuel <= ref.seuilCritique) return 'critique';
  if (ref.stockActuel <= ref.seuilAlerte) return 'alerte';
  return 'ok';
}

export function getMunRefsWithAlerts() {
  const { munitionRefs } = getState();
  const alerts = [];
  munitionRefs.forEach(ref => {
    const level = getAlertLevelForRef(ref);
    if (level !== 'ok') {
      alerts.push({ ...ref, level });
    }
  });
  return alerts.sort((a, b) => a.stockActuel - b.stockActuel);
}

// --- Backward compatibility wrappers ---

/**
 * Get stock info for a weapon index (backward compat)
 * Returns { stockActuel, seuilAlerte, seuilCritique, unite } or null
 */
export function getStockForWeapon(machineIdx) {
  const ref = findMunRefForWeapon(machineIdx);
  if (!ref) return null;
  return {
    stockActuel: ref.stockActuel,
    seuilAlerte: ref.seuilAlerte,
    seuilCritique: ref.seuilCritique,
    unite: ref.unite,
  };
}

/**
 * Ensure stock exists for a weapon (backward compat)
 * If no munRef covers this weapon, does nothing and returns null
 */
export function ensureStockForWeapon(machineIdx) {
  return findMunRefForWeapon(machineIdx);
}

/**
 * Get alert level for a weapon (backward compat)
 */
export function getAlertLevel(machineIdx) {
  const ref = findMunRefForWeapon(machineIdx);
  return ref ? getAlertLevelForRef(ref) : 'ok';
}

/**
 * Get all munition refs with alerts (replaces getWeaponsWithAlerts)
 */
export function getWeaponsWithAlerts() {
  return getMunRefsWithAlerts();
}

/**
 * Calculate purchase needs
 */
export function calculatePurchaseNeeds(targetLevel) {
  const { munitionRefs } = getState();
  const needs = [];
  munitionRefs.forEach(ref => {
    const target = targetLevel || ref.seuilAlerte * 2;
    if (ref.stockActuel < target) {
      needs.push({
        munRefId: ref.id,
        nom: ref.nom,
        calibre: ref.calibre,
        stockActuel: ref.stockActuel,
        quantiteBesoin: target - ref.stockActuel,
        unite: ref.unite,
      });
    }
  });
  return needs;
}

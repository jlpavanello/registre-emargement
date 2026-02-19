// Domain module: Weapon status/condition tracking
// localStorage key: 'reg_stock_armes'
// Object keyed by machineIdx: { etat, dateRevision, notes }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_stock_armes';

export const ETATS_ARME = {
  operationnelle: { label: 'Opérationnelle', color: '#16a34a', bg: '#dcfce7' },
  en_revision: { label: 'En révision', color: '#d97706', bg: '#fef3c7' },
  hors_service: { label: 'Hors service', color: '#dc2626', bg: '#fef2f2' },
};

export function loadStockArmes() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('stockArmes', data);
}

export function saveStockArmes() {
  const { stockArmes } = getState();
  storage.set(STORAGE_KEY, stockArmes);
}

/**
 * Get status info for a specific weapon index
 */
export function getWeaponStatus(machineIdx) {
  const { stockArmes } = getState();
  return stockArmes[machineIdx] || null;
}

/**
 * Ensure status entry exists for a weapon
 */
export function ensureWeaponStatus(machineIdx) {
  const { stockArmes } = getState();
  if (!stockArmes[machineIdx]) {
    stockArmes[machineIdx] = {
      etat: 'operationnelle',
      dateRevision: '',
      notes: '',
    };
  }
  return stockArmes[machineIdx];
}

/**
 * Update weapon status
 */
export function updateWeaponStatus(machineIdx, etat, dateRevision, notes) {
  const status = ensureWeaponStatus(machineIdx);
  if (etat !== undefined) status.etat = etat;
  if (dateRevision !== undefined) status.dateRevision = dateRevision;
  if (notes !== undefined) status.notes = notes;
  saveStockArmes();
}

/**
 * Get all weapons needing attention (en_revision or hors_service)
 */
export function getWeaponsNeedingAttention() {
  const { stockArmes, machines } = getState();
  const result = [];
  for (const [idx, status] of Object.entries(stockArmes)) {
    const i = +idx;
    if (!machines[i] || !machines[i].nom) continue;
    if (status.etat !== 'operationnelle') {
      result.push({ machineIdx: i, nom: machines[i].nom, ref: machines[i].ref, ...status });
    }
  }
  return result;
}

/**
 * Count weapons by status
 */
export function countByStatus() {
  const { stockArmes, machines } = getState();
  const counts = { operationnelle: 0, en_revision: 0, hors_service: 0 };
  for (const [idx, status] of Object.entries(stockArmes)) {
    const i = +idx;
    if (!machines[i] || !machines[i].nom) continue;
    counts[status.etat] = (counts[status.etat] || 0) + 1;
  }
  return counts;
}

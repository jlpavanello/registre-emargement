// Domain module: Shooting exercise planning
// localStorage key: 'reg_previsions_tir'
// Array of { id, date, lieu, participants, munitionsParAgent, armeIdx, totalPrevu, statut, realise }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { getStockForWeapon } from './stock-munitions.js';

const STORAGE_KEY = 'reg_previsions_tir';

export function loadPrevisionsTir() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('previsionsTir', data);
}

export function savePrevisionsTir() {
  const { previsionsTir } = getState();
  storage.set(STORAGE_KEY, previsionsTir);
}

/**
 * Add a new shooting exercise plan
 */
export function addPrevision({ date, lieu, participants, munitionsParAgent, armeIdx }) {
  const { previsionsTir } = getState();
  const totalPrevu = participants.length * munitionsParAgent;
  const prevision = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    date,
    lieu,
    participants, // array of empIdx
    munitionsParAgent,
    armeIdx,
    totalPrevu,
    statut: 'planifie',
    realise: null,
  };
  previsionsTir.push(prevision);
  savePrevisionsTir();
  return prevision;
}

/**
 * Update an existing prevision
 */
export function updatePrevision(id, updates) {
  const { previsionsTir } = getState();
  const prev = previsionsTir.find(p => p.id === id);
  if (!prev) return null;
  Object.assign(prev, updates);
  if (updates.participants || updates.munitionsParAgent) {
    prev.totalPrevu = (updates.participants || prev.participants).length *
      (updates.munitionsParAgent !== undefined ? updates.munitionsParAgent : prev.munitionsParAgent);
  }
  savePrevisionsTir();
  return prev;
}

/**
 * Mark a prevision as realised
 */
export function markRealise(id, munitionsConsommees) {
  const { previsionsTir } = getState();
  const prev = previsionsTir.find(p => p.id === id);
  if (!prev) return null;
  prev.statut = 'realise';
  prev.realise = {
    munitionsConsommees,
    dateRealisation: new Date().toISOString().split('T')[0],
  };
  savePrevisionsTir();
  return prev;
}

/**
 * Cancel a prevision
 */
export function cancelPrevision(id) {
  const { previsionsTir } = getState();
  const prev = previsionsTir.find(p => p.id === id);
  if (!prev) return null;
  prev.statut = 'annule';
  savePrevisionsTir();
  return prev;
}

/**
 * Delete a prevision
 */
export function deletePrevision(id) {
  const { previsionsTir } = getState();
  const idx = previsionsTir.findIndex(p => p.id === id);
  if (idx === -1) return false;
  previsionsTir.splice(idx, 1);
  savePrevisionsTir();
  return true;
}

/**
 * Get upcoming planned exercises (sorted by date)
 */
export function getUpcomingPrevisions() {
  const { previsionsTir } = getState();
  const today = new Date().toISOString().split('T')[0];
  return previsionsTir
    .filter(p => p.statut === 'planifie' && p.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check stock impact for a prevision
 * Returns { stockActuel, stockApres, deficit }
 */
export function checkStockImpact(armeIdx, totalPrevu) {
  const stock = getStockForWeapon(armeIdx);
  const stockActuel = stock ? stock.stockActuel : 0;
  const stockApres = stockActuel - totalPrevu;
  return {
    stockActuel,
    stockApres,
    deficit: stockApres < 0 ? Math.abs(stockApres) : 0,
  };
}

/**
 * Get next planned exercise
 */
export function getNextPrevision() {
  const upcoming = getUpcomingPrevisions();
  return upcoming.length > 0 ? upcoming[0] : null;
}

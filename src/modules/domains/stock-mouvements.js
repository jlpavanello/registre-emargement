// Domain module: Stock movements tracking
// localStorage key: 'reg_stock_mouvements'
// Array of { id, date, heure, type, munRefId, armeIdx, quantite, agentIdx, motif, source }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { adjustMunRefStock, findMunRefForWeapon, saveMunitionRefs } from './stock-munitions.js';

const STORAGE_KEY = 'reg_stock_mouvements';

export const MOUVEMENT_TYPES = {
  sortie: { label: 'Sortie', icon: '📤', color: '#dc2626' },
  retour: { label: 'Retour', icon: '📥', color: '#16a34a' },
  ajustement: { label: 'Ajustement', icon: '🔧', color: '#2563eb' },
  perte: { label: 'Perte', icon: '⚠️', color: '#d97706' },
  approvisionnement: { label: 'Approvisionnement', icon: '📦', color: '#7c3aed' },
};

export function loadStockMouvements() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('stockMouvements', data);
}

export function saveStockMouvements() {
  const { stockMouvements } = getState();
  storage.set(STORAGE_KEY, stockMouvements);
}

/**
 * Log a stock movement and auto-update munition ref stock
 * @param {object} params - { type, munRefId?, armeIdx, quantite, agentIdx?, motif?, source? }
 * @returns {object} The created mouvement
 */
export function logMouvement({ type, munRefId = null, armeIdx, quantite, agentIdx = null, motif = '', source = 'manuel' }) {
  const { stockMouvements } = getState();
  const now = new Date();

  // Resolve munRefId if not provided (backward compat)
  let resolvedMunRefId = munRefId;
  if (!resolvedMunRefId && armeIdx !== undefined && armeIdx !== null) {
    const ref = findMunRefForWeapon(armeIdx);
    if (ref) resolvedMunRefId = ref.id;
  }

  const mouvement = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    date: now.toISOString().split('T')[0],
    heure: now.toTimeString().slice(0, 5),
    type,
    munRefId: resolvedMunRefId,
    armeIdx,
    quantite,
    agentIdx,
    motif,
    source,
  };
  stockMouvements.unshift(mouvement);

  // Keep max 500 mouvements
  if (stockMouvements.length > 500) {
    stockMouvements.length = 500;
  }

  saveStockMouvements();

  // Auto-update stock based on movement type
  let delta = 0;
  switch (type) {
    case 'sortie':
      delta = -Math.abs(quantite);
      break;
    case 'retour':
    case 'approvisionnement':
      delta = Math.abs(quantite);
      break;
    case 'perte':
      delta = -Math.abs(quantite);
      break;
    case 'ajustement':
      delta = quantite; // Can be + or -
      break;
  }
  if (delta !== 0 && resolvedMunRefId) {
    adjustMunRefStock(resolvedMunRefId, delta);
  }

  return mouvement;
}

/**
 * Get recent movements (last N)
 */
export function getRecentMouvements(limit = 10) {
  const { stockMouvements } = getState();
  return stockMouvements.slice(0, limit);
}

/**
 * Get movements for a specific weapon
 */
export function getMouvementsForWeapon(armeIdx, limit = 50) {
  const { stockMouvements } = getState();
  return stockMouvements.filter(m => m.armeIdx === armeIdx).slice(0, limit);
}

/**
 * Get movements for a specific munition ref
 */
export function getMouvementsForMunRef(munRefId, limit = 50) {
  const { stockMouvements } = getState();
  return stockMouvements.filter(m => m.munRefId === munRefId).slice(0, limit);
}

/**
 * Get movements for a specific date
 */
export function getMouvementsForDate(date) {
  const { stockMouvements } = getState();
  return stockMouvements.filter(m => m.date === date);
}

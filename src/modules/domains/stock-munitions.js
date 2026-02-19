// Domain module: Stock munitions management
// localStorage key: 'reg_stock_munitions'
// Object keyed by machineIdx: { stockActuel, seuilAlerte, seuilCritique, unite }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_stock_munitions';

export function loadStockMunitions() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('stockMunitions', data);
}

export function saveStockMunitions() {
  const { stockMunitions } = getState();
  storage.set(STORAGE_KEY, stockMunitions);
}

/**
 * Get stock info for a specific weapon index
 * Returns { stockActuel, seuilAlerte, seuilCritique, unite } or default
 */
export function getStockForWeapon(machineIdx) {
  const { stockMunitions } = getState();
  return stockMunitions[machineIdx] || null;
}

/**
 * Init stock for a weapon if not exists
 */
export function ensureStockForWeapon(machineIdx) {
  const { stockMunitions } = getState();
  if (!stockMunitions[machineIdx]) {
    stockMunitions[machineIdx] = {
      stockActuel: 0,
      seuilAlerte: 100,
      seuilCritique: 30,
      unite: 'cartouche',
    };
  }
  return stockMunitions[machineIdx];
}

/**
 * Adjust stock for a weapon (+ or -)
 * Returns updated stock value
 */
export function adjustStock(machineIdx, delta) {
  const stock = ensureStockForWeapon(machineIdx);
  stock.stockActuel = Math.max(0, stock.stockActuel + delta);
  saveStockMunitions();
  return stock.stockActuel;
}

/**
 * Update seuils (thresholds) for a weapon
 */
export function updateSeuils(machineIdx, seuilAlerte, seuilCritique) {
  const stock = ensureStockForWeapon(machineIdx);
  stock.seuilAlerte = seuilAlerte;
  stock.seuilCritique = seuilCritique;
  saveStockMunitions();
}

/**
 * Get alert level for a weapon: 'ok' | 'alerte' | 'critique'
 */
export function getAlertLevel(machineIdx) {
  const stock = getStockForWeapon(machineIdx);
  if (!stock) return 'ok';
  if (stock.stockActuel <= stock.seuilCritique) return 'critique';
  if (stock.stockActuel <= stock.seuilAlerte) return 'alerte';
  return 'ok';
}

/**
 * Get all weapons with alerts (stock below seuilAlerte)
 */
export function getWeaponsWithAlerts() {
  const { stockMunitions, machines } = getState();
  const alerts = [];
  for (const [idx, stock] of Object.entries(stockMunitions)) {
    const i = +idx;
    if (!machines[i] || !machines[i].nom) continue;
    const level = getAlertLevel(i);
    if (level !== 'ok') {
      alerts.push({ machineIdx: i, nom: machines[i].nom, ref: machines[i].ref, ...stock, level });
    }
  }
  return alerts.sort((a, b) => a.stockActuel - b.stockActuel);
}

/**
 * Calculate purchase needs based on desired stock level and current stock
 */
export function calculatePurchaseNeeds(targetLevel) {
  const { stockMunitions, machines } = getState();
  const needs = [];
  for (const [idx, stock] of Object.entries(stockMunitions)) {
    const i = +idx;
    if (!machines[i] || !machines[i].nom) continue;
    const target = targetLevel || stock.seuilAlerte * 2;
    if (stock.stockActuel < target) {
      needs.push({
        machineIdx: i,
        nom: machines[i].nom,
        ref: machines[i].ref,
        stockActuel: stock.stockActuel,
        quantiteBesoin: target - stock.stockActuel,
        unite: stock.unite,
      });
    }
  }
  return needs;
}

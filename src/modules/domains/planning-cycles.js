// Domain module: Planning Cycles — Roulements / rotations
import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_planning_cycles';

export function loadPlanningCycles() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('planningCycles', data);
  else setState('planningCycles', []);
}

export function savePlanningCycles() {
  const { planningCycles } = getState();
  storage.set(STORAGE_KEY, planningCycles);
}

export function getPlanningCycles() {
  const { planningCycles } = getState();
  return planningCycles || [];
}

export function getCycleById(id) {
  return getPlanningCycles().find(c => c.id === id) || null;
}

/**
 * Create a new cycle
 * @param {string} nom - Name of the cycle
 * @param {Array} pattern - Array of {jour: number, shiftId: string|null}
 */
export function createCycle(nom, pattern) {
  const { planningCycles } = getState();
  const newCycle = {
    id: 'cycle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    nom,
    dureeJours: pattern.length,
    pattern,
    createdAt: new Date().toISOString(),
  };
  planningCycles.push(newCycle);
  setState('planningCycles', planningCycles);
  savePlanningCycles();
  return newCycle;
}

/**
 * Update an existing cycle
 */
export function updateCycle(id, updates) {
  const { planningCycles } = getState();
  const idx = planningCycles.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const { id: _id, ...allowed } = updates;
  Object.assign(planningCycles[idx], allowed);
  if (updates.pattern) {
    planningCycles[idx].dureeJours = updates.pattern.length;
  }
  setState('planningCycles', planningCycles);
  savePlanningCycles();
  return planningCycles[idx];
}

/**
 * Delete a cycle
 */
export function deleteCycle(id) {
  const { planningCycles } = getState();
  setState('planningCycles', planningCycles.filter(c => c.id !== id));
  savePlanningCycles();
  return true;
}

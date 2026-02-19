// Domain module: Vehicle/crew management
// Manages the list of vehicles (marque, immatriculation, equipement)

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_vehicles';

export function loadVehicles() {
  try {
    const data = storage.get(STORAGE_KEY);
    if (data && Array.isArray(data)) {
      setState('vehicles', data);
      return;
    }
  } catch (e) { /* ignore */ }
  setState('vehicles', []);
}

export function saveVehicles() {
  storage.set(STORAGE_KEY, getState().vehicles);
}

/**
 * Get vehicles that have at least a marque filled in
 * Returns array with original index: [{marque, immatriculation, equipement, idx}]
 */
export function getActiveVehicles() {
  return getState().vehicles
    .map((v, i) => ({ ...v, idx: i }))
    .filter((v) => v.marque && v.marque.trim());
}

/**
 * Get a vehicle display name: "Marque — AB-123-CD"
 */
export function getVehicleLabel(idx) {
  const v = getState().vehicles[idx];
  if (!v || !v.marque) return `Véhicule ${idx + 1}`;
  return v.immatriculation
    ? `${v.marque} — ${v.immatriculation}`
    : v.marque;
}

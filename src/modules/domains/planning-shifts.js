// Domain module: Planning Shifts — Types de créneaux (prédéfinis + custom)
import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_planning_shifts';

const DEFAULT_SHIFTS = [
  { id: 'matin', nom: 'Matin', heureDebut: '06:00', heureFin: '14:00', couleur: '#f59e0b', icon: '\u{1F305}', system: true },
  { id: 'aprem', nom: 'Après-midi', heureDebut: '14:00', heureFin: '22:00', couleur: '#3b82f6', icon: '\u{2600}\u{FE0F}', system: true },
  { id: 'nuit', nom: 'Nuit', heureDebut: '22:00', heureFin: '06:00', couleur: '#6366f1', icon: '\u{1F319}', system: true },
  { id: 'garde', nom: 'Garde', heureDebut: '18:00', heureFin: '06:00', couleur: '#ef4444', icon: '\u{1F6E1}\u{FE0F}', system: true },
  { id: 'permanence', nom: 'Permanence', heureDebut: '08:00', heureFin: '20:00', couleur: '#8b5cf6', icon: '\u{1F4DE}', system: true },
  { id: 'journee', nom: 'Journée', heureDebut: '08:00', heureFin: '18:00', couleur: '#10b981', icon: '📅', system: true },
];

export function loadPlanningShifts() {
  const data = storage.get(STORAGE_KEY);
  if (data && data.length > 0) {
    // Ensure system shifts are always present
    const systemIds = DEFAULT_SHIFTS.map(s => s.id);
    const existing = data.map(s => s.id);
    const merged = [...data];
    DEFAULT_SHIFTS.forEach(ds => {
      if (!existing.includes(ds.id)) merged.unshift(ds);
    });
    setState('planningShifts', merged);
  } else {
    setState('planningShifts', [...DEFAULT_SHIFTS]);
    savePlanningShifts();
  }
}

export function savePlanningShifts() {
  const { planningShifts } = getState();
  storage.set(STORAGE_KEY, planningShifts);
}

export function getPlanningShifts() {
  const { planningShifts } = getState();
  return planningShifts || [];
}

export function getShiftById(id) {
  return getPlanningShifts().find(s => s.id === id) || null;
}

export function createCustomShift({ nom, heureDebut, heureFin, couleur, icon }) {
  const { planningShifts } = getState();
  const newShift = {
    id: 'shift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    nom,
    heureDebut,
    heureFin,
    couleur: couleur || '#10b981',
    icon: icon || '\u{1F4CB}',
    system: false,
  };
  planningShifts.push(newShift);
  setState('planningShifts', planningShifts);
  savePlanningShifts();
  return newShift;
}

export function updateShift(id, updates) {
  const { planningShifts } = getState();
  const idx = planningShifts.findIndex(s => s.id === id);
  if (idx === -1) return null;
  // Don't allow changing system flag
  const { system, id: _id, ...allowed } = updates;
  Object.assign(planningShifts[idx], allowed);
  setState('planningShifts', planningShifts);
  savePlanningShifts();
  return planningShifts[idx];
}

export function deleteCustomShift(id) {
  const { planningShifts } = getState();
  const shift = planningShifts.find(s => s.id === id);
  if (!shift || shift.system) return false;
  setState('planningShifts', planningShifts.filter(s => s.id !== id));
  savePlanningShifts();
  return true;
}

/**
 * Calculate shift duration in hours
 */
export function getShiftDuration(shift) {
  if (!shift) return 0;
  const [dh, dm] = shift.heureDebut.split(':').map(Number);
  const [fh, fm] = shift.heureFin.split(':').map(Number);
  let start = dh * 60 + dm;
  let end = fh * 60 + fm;
  if (end <= start) end += 24 * 60; // Night shift crosses midnight
  return (end - start) / 60;
}

/**
 * Get shift end time as minutes from midnight (handles overnight)
 */
export function getShiftEndMinutes(shift) {
  if (!shift) return 0;
  const [fh, fm] = shift.heureFin.split(':').map(Number);
  const [dh, dm] = shift.heureDebut.split(':').map(Number);
  let end = fh * 60 + fm;
  let start = dh * 60 + dm;
  if (end <= start) end += 24 * 60;
  return end;
}

export function getShiftStartMinutes(shift) {
  if (!shift) return 0;
  const [dh, dm] = shift.heureDebut.split(':').map(Number);
  return dh * 60 + dm;
}

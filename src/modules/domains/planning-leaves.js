// Domain module: Planning Leaves — Congés & Absences
import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_planning_leaves';

export const LEAVE_TYPES = [
  { code: 'conge_annuel', label: 'Congé annuel', icon: '\u{1F334}', couleur: '#22c55e', joursAn: 25 },
  { code: 'rtt', label: 'RTT', icon: '\u{23F0}', couleur: '#06b6d4', joursAn: null },
  { code: 'maladie', label: 'Maladie', icon: '\u{1FA7A}', couleur: '#f97316', joursAn: null },
  { code: 'formation', label: 'Formation', icon: '\u{1F393}', couleur: '#8b5cf6', joursAn: 5 },
  { code: 'absence_injustifiee', label: 'Absence injustifi\u00e9e', icon: '\u2753', couleur: '#ef4444', joursAn: null },
  { code: 'autre', label: 'Autre absence', icon: '\u{1F4C5}', couleur: '#64748b', joursAn: null },
];

export function getLeaveType(code) {
  return LEAVE_TYPES.find(t => t.code === code) || LEAVE_TYPES[4];
}

export function loadPlanningLeaves() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('planningLeaves', data);
  else setState('planningLeaves', []);
}

export function savePlanningLeaves() {
  const { planningLeaves } = getState();
  storage.set(STORAGE_KEY, planningLeaves);
}

export function getPlanningLeaves() {
  const { planningLeaves } = getState();
  return planningLeaves || [];
}

/**
 * Create a leave request
 */
export function createLeave({ agentIdx, type, dateDebut, dateFin, motif, statut }) {
  const { planningLeaves } = getState();
  const newLeave = {
    id: 'leave_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    agentIdx,
    type: type || 'conge_annuel',
    dateDebut,
    dateFin,
    statut: statut || 'en_attente',
    motif: motif || '',
    createdAt: new Date().toISOString(),
  };
  planningLeaves.push(newLeave);
  setState('planningLeaves', planningLeaves);
  savePlanningLeaves();
  return newLeave;
}

/**
 * Update leave status
 */
export function updateLeaveStatus(id, statut) {
  const { planningLeaves } = getState();
  const leave = planningLeaves.find(l => l.id === id);
  if (!leave) return null;
  leave.statut = statut;
  leave.updatedAt = new Date().toISOString();
  setState('planningLeaves', planningLeaves);
  savePlanningLeaves();
  return leave;
}

/**
 * Delete a leave
 */
export function deleteLeave(id) {
  const { planningLeaves } = getState();
  setState('planningLeaves', planningLeaves.filter(l => l.id !== id));
  savePlanningLeaves();
  return true;
}

/**
 * Get leaves for an agent
 */
export function getLeavesForAgent(agentIdx) {
  return getPlanningLeaves().filter(l => l.agentIdx === agentIdx);
}

/**
 * Get leaves overlapping a date range
 */
export function getLeavesInRange(dateStart, dateEnd) {
  return getPlanningLeaves().filter(l => {
    return l.dateDebut <= dateEnd && l.dateFin >= dateStart;
  });
}

/**
 * Check if an agent has an approved leave on a specific date
 */
export function getLeaveForDate(agentIdx, date) {
  return getPlanningLeaves().find(l =>
    l.agentIdx === agentIdx &&
    l.statut === 'approuve' &&
    l.dateDebut <= date &&
    l.dateFin >= date
  ) || null;
}

/**
 * Count leave days used by an agent for a given type in a year
 */
export function countLeaveDaysUsed(agentIdx, type, year) {
  const leaves = getPlanningLeaves().filter(l =>
    l.agentIdx === agentIdx &&
    l.type === type &&
    l.statut !== 'refuse' &&
    l.dateDebut.startsWith(year)
  );
  let total = 0;
  leaves.forEach(l => {
    const start = new Date(l.dateDebut + 'T00:00:00');
    const end = new Date(l.dateFin + 'T00:00:00');
    // Count business days only (Mon-Fri)
    const d = new Date(start);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) total++;
      d.setDate(d.getDate() + 1);
    }
  });
  return total;
}

/**
 * Get leave balance for an agent and type
 */
export function getLeaveBalance(agentIdx, type, year) {
  const leaveType = getLeaveType(type);
  if (!leaveType.joursAn) return null; // No fixed allocation
  const used = countLeaveDaysUsed(agentIdx, type, year);
  return {
    allocation: leaveType.joursAn,
    used,
    remaining: leaveType.joursAn - used,
  };
}

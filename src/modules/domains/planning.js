// Domain module: Planning Entries — affectations jour/agent
import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { getShiftById, getShiftDuration, getShiftEndMinutes, getShiftStartMinutes } from './planning-shifts.js';

const STORAGE_KEY = 'reg_planning_entries';

export function loadPlanningEntries() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('planningEntries', data);
  else setState('planningEntries', {});
}

export function savePlanningEntries() {
  const { planningEntries } = getState();
  storage.set(STORAGE_KEY, planningEntries);
}

/**
 * Get the key for an entry: "YYYY-MM-DD_agentIdx"
 */
function entryKey(date, agentIdx) {
  return date + '_' + agentIdx;
}

/**
 * Get the planning entry for a date/agent
 */
export function getEntry(date, agentIdx) {
  const { planningEntries } = getState();
  return planningEntries[entryKey(date, agentIdx)] || null;
}

/**
 * Set or update entry for a date/agent
 */
export function setEntry(date, agentIdx, data) {
  const { planningEntries } = getState();
  const key = entryKey(date, agentIdx);
  if (data === null) {
    delete planningEntries[key];
  } else {
    planningEntries[key] = { ...data, updatedAt: new Date().toISOString() };
  }
  setState('planningEntries', planningEntries);
  savePlanningEntries();
}

/**
 * Remove entry
 */
export function removeEntry(date, agentIdx) {
  setEntry(date, agentIdx, null);
}

/**
 * Get all entries for a given date
 */
export function getEntriesForDate(date) {
  const { planningEntries } = getState();
  const results = [];
  const prefix = date + '_';
  for (const key of Object.keys(planningEntries)) {
    if (key.startsWith(prefix)) {
      const agentIdx = parseInt(key.split('_').pop());
      results.push({ agentIdx, ...planningEntries[key] });
    }
  }
  return results;
}

/**
 * Get all entries for a given agent in a date range
 */
export function getEntriesForAgent(agentIdx, dateStart, dateEnd) {
  const { planningEntries } = getState();
  const results = [];
  const d = new Date(dateStart + 'T00:00:00');
  const end = new Date(dateEnd + 'T00:00:00');
  while (d <= end) {
    const ds = d.toISOString().slice(0, 10);
    const key = entryKey(ds, agentIdx);
    if (planningEntries[key]) {
      results.push({ date: ds, ...planningEntries[key] });
    }
    d.setDate(d.getDate() + 1);
  }
  return results;
}

/**
 * Calculate total hours for an agent in a date range
 */
export function getAgentHours(agentIdx, dateStart, dateEnd) {
  const entries = getEntriesForAgent(agentIdx, dateStart, dateEnd);
  let total = 0;
  entries.forEach(e => {
    if (e.shiftId) {
      const shift = getShiftById(e.shiftId);
      if (shift) total += getShiftDuration(shift);
    }
  });
  return total;
}

/**
 * Check compliance alerts for an agent on a given date
 * Returns array of alerts: { type: 'max10h'|'max48h'|'repos11h', message, severity }
 */
export function checkCompliance(agentIdx, date) {
  const alerts = [];
  const entry = getEntry(date, agentIdx);
  if (!entry || !entry.shiftId) return alerts;

  const shift = getShiftById(entry.shiftId);
  if (!shift) return alerts;

  // Alert 1: shift > 10h
  const duration = getShiftDuration(shift);
  if (duration > 10) {
    alerts.push({
      type: 'max10h',
      message: 'D\u00e9passement 10h/jour (' + duration.toFixed(1) + 'h)',
      severity: 'error',
    });
  }

  // Alert 2: repos < 11h between this shift and previous day's shift
  const prevDate = new Date(date + 'T00:00:00');
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  const prevEntry = getEntry(prevDateStr, agentIdx);
  if (prevEntry && prevEntry.shiftId) {
    const prevShift = getShiftById(prevEntry.shiftId);
    if (prevShift) {
      const prevEnd = getShiftEndMinutes(prevShift);
      const currentStart = getShiftStartMinutes(shift);
      // Calculate rest period
      let rest;
      if (prevEnd > 24 * 60) {
        // Previous shift ends after midnight (e.g., night shift)
        rest = currentStart - (prevEnd - 24 * 60);
      } else {
        rest = (24 * 60 - prevEnd) + currentStart;
      }
      const restHours = rest / 60;
      if (restHours < 11 && restHours >= 0) {
        alerts.push({
          type: 'repos11h',
          message: 'Repos insuffisant (' + restHours.toFixed(1) + 'h au lieu de 11h min)',
          severity: 'warning',
        });
      }
    }
  }

  // Alert 3: > 48h/week
  // Find the Monday of the week containing this date
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);
  const weekHours = getAgentHours(agentIdx, mondayStr, sundayStr);
  if (weekHours > 48) {
    alerts.push({
      type: 'max48h',
      message: 'D\u00e9passement 48h/semaine (' + weekHours.toFixed(1) + 'h)',
      severity: 'error',
    });
  }

  return alerts;
}

/**
 * Apply a cycle to an agent starting from a date
 */
export function applyCycle(agentIdx, cycleId, startDate, endDate) {
  const { planningCycles } = getState();
  const cycle = planningCycles.find(c => c.id === cycleId);
  if (!cycle || !cycle.pattern || cycle.pattern.length === 0) return 0;

  const d = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  let dayIndex = 0;
  let count = 0;

  while (d <= end) {
    const ds = d.toISOString().slice(0, 10);
    const patternDay = cycle.pattern[dayIndex % cycle.pattern.length];
    if (patternDay && patternDay.shiftId) {
      setEntry(ds, agentIdx, {
        shiftId: patternDay.shiftId,
        cycleId: cycleId,
        manual: false,
      });
      count++;
    } else {
      // Repos day — remove any existing entry
      removeEntry(ds, agentIdx);
    }
    dayIndex++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

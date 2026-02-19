// Domain module: Machines management
// localStorage key: 'reg_machines'
// machines is array of {nom, ref, cat}

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { getCatById, getCatLabel } from './categories.js';

const STORAGE_KEY = 'reg_machines';

export function loadMachines() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    data.forEach(m => {
      if (m.cat === undefined) m.cat = '';
    });
    setState('machines', data);
  }
}

export function saveMachines() {
  const { machines } = getState();
  storage.set(STORAGE_KEY, machines);
}

export function getActiveMachines() {
  const { machines } = getState();
  return machines.map((m, i) => ({ ...m, idx: i })).filter(m => m.nom);
}

export function getMachinesInUse() {
  const { dayData } = getState();
  const u = {};
  dayData.forEach((d, i) => {
    if (d.matin.machines && d.matin.machines.length > 0 && d.matin.signature) {
      d.matin.machines.forEach(m => {
        u[m.machineIdx] = i;
      });
    }
  });
  return u;
}

export function getAvailableMachines(empIdx) {
  const { dayData, selectedMachines } = getState();
  const u = getMachinesInUse();
  const empMachines =
    dayData[empIdx] && dayData[empIdx].matin.machines
      ? dayData[empIdx].matin.machines.map(m => m.machineIdx)
      : [];
  const selIdxs = selectedMachines.map(m => m.machineIdx);
  return getActiveMachines().filter(m => {
    if (selIdxs.includes(m.idx)) return false;
    if (!(m.idx in u)) return true;
    if (empMachines.includes(m.idx)) return true;
    return false;
  });
}

export function getMachineName(idx) {
  const { machines } = getState();
  if (idx === null || idx === undefined || !machines[idx]) return '';
  const m = machines[idx];
  return m.nom + (m.ref ? ` (${m.ref})` : '');
}

export function getMachineRawData(idx) {
  const { machines } = getState();
  if (idx === null || idx === undefined || !machines[idx]) return { nom: '', ref: '', cat: '' };
  return { nom: machines[idx].nom || '', ref: machines[idx].ref || '', cat: machines[idx].cat || '' };
}

export function getMachineCat(idx) {
  const { machines } = getState();
  if (idx === null || idx === undefined || !machines[idx]) return '';
  return machines[idx].cat || '';
}

export function getMachineCatLabel(cat) {
  return getCatLabel(cat);
}

export function getMachineCatBadge(idx) {
  const catId = getMachineCat(idx);
  if (!catId) return '';
  const cat = getCatById(catId);
  if (!cat) return '';
  return `<span class="badge badge-cat" style="background:#dbeafe;color:#1e40af;">${cat.emoji} ${cat.nom}</span>`;
}

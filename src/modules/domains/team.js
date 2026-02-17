// Domain module: Team management
// localStorage key: 'reg_team'
// team is an array of {nom, matricule, telephone, asvp}

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_team';

export function loadTeam() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    setState('team', data);
  }
}

export function saveTeam() {
  const { team } = getState();
  storage.set(STORAGE_KEY, team);
}

export function getActiveTeam() {
  const { team } = getState();
  return team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
}

export function getPresentTeam() {
  const { presentToday } = getState();
  return getActiveTeam().filter(t => presentToday.includes(t.idx));
}

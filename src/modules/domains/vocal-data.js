// Domain module: Vocal mission reports storage
// localStorage key: 'reg_vocal'

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { todayStr, nowTime } from '../utils/date.js';

const STORAGE_KEY = 'reg_vocal';

export function loadVocalReports() {
  try {
    const data = storage.get(STORAGE_KEY);
    if (data && data.reports) {
      setState('vocalReports', data.reports);
    }
  } catch (e) {
    setState('vocalReports', []);
  }
}

export function saveVocalReports() {
  const { vocalReports } = getState();
  storage.set(STORAGE_KEY, { reports: vocalReports });
}

export function addReport({ lieu, objet, contenu, heureMission, duree }) {
  const { vocalReports, responsables, team } = getState();
  // Essayer de récupérer l'agent depuis la config (chef d'unité par défaut)
  const agent = responsables.chef.nom || '';
  const matricule = responsables.chef.matricule || '';

  const report = {
    id: 'vr_' + Date.now(),
    date: todayStr(),
    heure: nowTime(),
    lieu: lieu || '',
    objet: objet || '',
    contenu: contenu || '',
    heureMission: heureMission || '',
    duree: duree || '',
    agent,
    matricule,
  };

  vocalReports.push(report);
  setState('vocalReports', vocalReports);
  saveVocalReports();
  return report;
}

export function updateReport(id, fields) {
  const { vocalReports } = getState();
  const report = vocalReports.find((r) => r.id === id);
  if (report) {
    Object.assign(report, fields);
    setState('vocalReports', vocalReports);
    saveVocalReports();
  }
}

export function deleteReport(id) {
  const { vocalReports } = getState();
  const idx = vocalReports.findIndex((r) => r.id === id);
  if (idx >= 0) {
    vocalReports.splice(idx, 1);
    setState('vocalReports', vocalReports);
    saveVocalReports();
  }
}

export function getReportsForToday() {
  const { vocalReports } = getState();
  const today = todayStr();
  return vocalReports.filter((r) => r.date === today);
}

export function getAllReports() {
  return getState().vocalReports;
}

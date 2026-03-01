// Domain module: Responsables management
// localStorage key: 'reg_resp'
// responsables is {chef: {nom, matricule}, armurier: {nom, matricule}}

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_resp';

export function loadResponsables() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    setState('responsables', data);
  }
}

export function saveResponsables() {
  const { responsables } = getState();
  storage.set(STORAGE_KEY, responsables);
}

export function populateVisaSignerSelect() {
  const { responsables } = getState();
  const sel = document.getElementById('visaSignerSelect');
  if (!sel) return; // null-guard: registre pas monte
  sel.innerHTML = '<option value="">— Choisir le signataire —</option>';
  if (responsables.chef.nom) {
    sel.innerHTML += `<option value="chef">Chef d'unité — ${responsables.chef.nom}</option>`;
  }
  if (responsables.armurier.nom) {
    sel.innerHTML += `<option value="armurier">Armurier — ${responsables.armurier.nom}</option>`;
  }
  if (!responsables.chef.nom && !responsables.armurier.nom) {
    sel.innerHTML += '<option value="" disabled>Configurez les responsables d\'abord</option>';
  }
}

export function populateArmurierSelect() {
  const { team, responsables } = getState();
  const sel = document.getElementById('configArmurierSelect');
  if (!sel) return; // null-guard: config pas monte
  const info = document.getElementById('configArmurierInfo');
  sel.innerHTML = '<option value="">— Choisir l\'Armurier parmi les agents —</option>';
  const active = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  active.forEach(t => {
    sel.innerHTML += `<option value="${t.idx}">${t.nom}${t.matricule ? ' — Mat. ' + t.matricule : ''}</option>`;
  });
  if (responsables.armurier.nom) {
    const match = active.find(
      t =>
        t.nom === responsables.armurier.nom &&
        (!responsables.armurier.matricule || t.matricule === responsables.armurier.matricule)
    );
    if (match) {
      sel.value = match.idx;
      info.textContent =
        'Armurier : ' + match.nom + (match.matricule ? ' (Mat. ' + match.matricule + ')' : '');
    } else {
      info.textContent =
        'Armurier actuel : ' + responsables.armurier.nom + ' (non trouvé dans la liste)';
    }
  } else {
    info.textContent = '';
  }
}

export function onArmurierSelectChange() {
  const { team, responsables } = getState();
  const sel = document.getElementById('configArmurierSelect');
  const info = document.getElementById('configArmurierInfo');
  const idx = parseInt(sel.value);
  if (isNaN(idx) || !team[idx]) {
    responsables.armurier = { nom: '', matricule: '' };
    info.textContent = '';
  } else {
    responsables.armurier = { nom: team[idx].nom, matricule: team[idx].matricule || '' };
    info.textContent =
      'Armurier : ' + team[idx].nom + (team[idx].matricule ? ' (Mat. ' + team[idx].matricule + ')' : '');
  }
}

export function getSignerInfo() {
  const { responsables } = getState();
  const sel = document.getElementById('visaSignerSelect');
  if (!sel) return null;
  const role = sel.value;
  if (!role) return null;
  const r = responsables[role];
  const label = role === 'chef' ? "Chef d'unité" : 'Armurier';
  return { role, nom: r.nom, matricule: r.matricule, label };
}

export function onVisaSignerChange() {
  // Placeholder for future implementation
}

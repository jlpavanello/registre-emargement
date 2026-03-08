import { getState, setState } from '../state.js';
import { getActiveTeam } from './team.js';
import { saveDayData } from './day-data.js';
import { removeCrewAssignment } from './crew-assignment.js';
import { showToast } from '../ui/toast.js';

// Late-binding callbacks to avoid circular dependencies
let _callbacks = {};
export function bindPresenceCallbacks(callbacks) {
  _callbacks = callbacks;
}

export function isPresent(i) {
  return getState().presentToday.includes(i);
}

export function openPresenceSelector() {
  setState('tempPresenceSelection', [...getState().presentToday]);
  document.getElementById('presencePanel').classList.add('active');
  renderPresenceList();
}

export function closePresenceSelector() {
  document.getElementById('presencePanel').classList.remove('active');
}

export function renderPresenceList() {
  const c = document.getElementById('presenceList');
  c.innerHTML = '';
  const active = getActiveTeam();
  const { tempPresenceSelection } = getState();
  if (!active.length) {
    c.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Aucun agent configuré. Allez dans Config.</div>';
    return;
  }
  active.forEach((t) => {
    const sel = tempPresenceSelection.includes(t.idx);
    const card = document.createElement('div');
    card.className = 'presence-card' + (sel ? ' selected' : '');
    card.addEventListener('click', () => togglePresence(t.idx));
    card.innerHTML = `
      <div class="presence-check">${sel ? '\u2713' : ''}</div>
      <div class="emp-num" style="width:26px;height:26px;font-size:11px;">${t.idx + 1}</div>
      <div class="p-info">
        <div class="p-name">${t.nom}</div>
        ${t.matricule ? `<div class="p-mat">Mat. ${t.matricule}</div>` : ''}
      </div>`;
    c.appendChild(card);
  });
  updatePresenceCount();
}

export function togglePresence(idx) {
  const sel = getState().tempPresenceSelection;
  const i = sel.indexOf(idx);
  if (i >= 0) sel.splice(i, 1);
  else sel.push(idx);
  setState('tempPresenceSelection', sel);
  renderPresenceList();
}

export function selectAllPresence() {
  setState('tempPresenceSelection', getActiveTeam().map((t) => t.idx));
  renderPresenceList();
}

export function selectNonePresence() {
  setState('tempPresenceSelection', []);
  renderPresenceList();
}

export function updatePresenceCount() {
  const n = getState().tempPresenceSelection.length;
  document.getElementById('presenceCount').innerHTML = `<span>${n}</span> agent${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''}`;
  document.getElementById('btnPresenceSave').disabled = n === 0;
}

export function savePresence() {
  const { tempPresenceSelection } = getState();
  if (tempPresenceSelection.length === 0) { showToast('S\u00e9lectionnez au moins un agent', 'warning'); return; }
  setState('presentToday', [...tempPresenceSelection].sort((a, b) => a - b));
  saveDayData();
  closePresenceSelector();
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();
  if (_callbacks.afterSave) _callbacks.afterSave();
  showToast(tempPresenceSelection.length + ' agent' + (tempPresenceSelection.length > 1 ? 's' : '') + ' s\u00e9lectionn\u00e9' + (tempPresenceSelection.length > 1 ? 's' : ''), 'success');
}

export function removeFromPresent(idx, skipConfirm = false) {
  const { team, presentToday, dayData } = getState();
  const nom = team[idx] ? team[idx].nom : `Agent ${idx + 1}`;
  if (!skipConfirm && !confirm(`Retirer ${nom} de la liste des présents ?`)) return;

  // Retirer de presentToday
  const updated = presentToday.filter((i) => i !== idx);
  setState('presentToday', updated);

  // Nettoyer les affectations d'équipage pour cet agent
  removeCrewAssignment(idx);

  // Nettoyer les données du jour pour cet agent
  dayData[idx] = {
    matin: { signature: null, heure: null, machines: [] },
    soir: { signature: null, heure: null, returns: {} },
  };
  setState('dayData', dayData);

  saveDayData();
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();
  if (_callbacks.afterSave) _callbacks.afterSave();
  showToast(nom + ' retiré de la liste', 'info');
}

export function updatePresenceBadge() {
  const { presentToday } = getState();
  const area = document.getElementById('presenceBadgeArea');
  const badge = document.getElementById('presenceBadge');
  if (!area || !badge) return; // null-guard: registre pas monte
  if (presentToday.length > 0) {
    area.style.display = 'block';
    badge.textContent = presentToday.length + ' présent' + (presentToday.length > 1 ? 's' : '') + " aujourd'hui";
  } else {
    area.style.display = 'none';
  }
}

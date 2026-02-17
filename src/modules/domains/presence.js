import { getState, setState } from '../state.js';
import { getActiveTeam } from './team.js';
import { saveDayData } from './day-data.js';

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
    c.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Aucun salarié configuré. Allez dans Config.</div>';
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
  document.getElementById('presenceCount').innerHTML = `<span>${n}</span> salarié${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''}`;
  document.getElementById('btnPresenceSave').disabled = n === 0;
}

export function savePresence() {
  const { tempPresenceSelection } = getState();
  if (tempPresenceSelection.length === 0) { alert('Sélectionnez au moins un salarié.'); return; }
  setState('presentToday', [...tempPresenceSelection].sort((a, b) => a - b));
  saveDayData();
  closePresenceSelector();
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();
}

export function updatePresenceBadge() {
  const { presentToday } = getState();
  const area = document.getElementById('presenceBadgeArea');
  const badge = document.getElementById('presenceBadge');
  if (presentToday.length > 0) {
    area.style.display = 'block';
    badge.textContent = presentToday.length + ' présent' + (presentToday.length > 1 ? 's' : '') + " aujourd'hui";
  } else {
    area.style.display = 'none';
  }
}

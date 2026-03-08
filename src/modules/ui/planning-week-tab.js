// UI: Planning Week Tab — Vue hebdomadaire détaillée
import { getState, setState } from '../state.js';
import { getEntry, setEntry, removeEntry, getAgentHours } from '../domains/planning.js';
import { getPlanningShifts, getShiftById, getShiftDuration } from '../domains/planning-shifts.js';
import { getLeaveForDate, getLeaveType, createLeave, LEAVE_TYPES } from '../domains/planning-leaves.js';
import { getActiveTeam } from '../domains/team.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { saveDayData } from '../domains/day-data.js';

let _weekStart; // Monday of current week

function initWeek() {
  if (!_weekStart) {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    _weekStart = new Date(now);
    _weekStart.setDate(now.getDate() + diff);
    _weekStart.setHours(0, 0, 0, 0);
  }
}

function dateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatWeekRange() {
  const end = new Date(_weekStart);
  end.setDate(_weekStart.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return _weekStart.toLocaleDateString('fr-FR', opts) + ' — ' + end.toLocaleDateString('fr-FR', { ...opts, year: 'numeric' });
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function renderWeekTab(container) {
  initWeek();
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  const todayISO = new Date().toISOString().slice(0, 10);

  let html = '';

  // Navigation
  html += '<div class="planning-nav">';
  html += '  <button class="planning-nav-btn" id="planWeekPrev">◀ Précédente</button>';
  html += '  <span class="planning-nav-title">' + formatWeekRange() + '</span>';
  html += '  <button class="planning-nav-btn" id="planWeekNext">Suivante ▶</button>';
  html += '  <button class="planning-absence-btn" id="planWeekAbsenceBtn">\uD83D\uDEA8 Signaler une absence</button>';
  html += '</div>';

  if (activeTeam.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">👥</div>Aucun agent configur\u00e9.</div>';
    container.innerHTML = html;
    bindNav(container);
    return;
  }

  // Build week days array
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(_weekStart);
    d.setDate(_weekStart.getDate() + i);
    weekDays.push(d);
  }

  const mondayStr = dateStr(weekDays[0]);
  const sundayStr = dateStr(weekDays[6]);

  // Grid
  html += '<div class="planning-grid-container">';
  html += '<table class="planning-week-grid">';

  // Header
  html += '<tr><th>Agent</th>';
  weekDays.forEach((d, i) => {
    const ds = dateStr(d);
    const isWeekend = i >= 5;
    const isToday = ds === todayISO;
    const cls = isWeekend ? ' weekend' : (isToday ? ' today' : '');
    html += '<th class="' + cls + '">' + DAY_NAMES[i] + '<br>' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + '</th>';
  });
  html += '<th>Total</th></tr>';

  // Agent rows
  activeTeam.forEach(agent => {
    const weekHours = getAgentHours(agent.idx, mondayStr, sundayStr);
    const isOver48 = weekHours > 48;

    html += '<tr>';
    html += '<td class="agent-name">' + escapeHtml(agent.nom) + '</td>';

    weekDays.forEach(d => {
      const ds = dateStr(d);
      const entry = getEntry(ds, agent.idx);
      const leave = getLeaveForDate(agent.idx, ds);

      let cellHtml = '';
      if (leave) {
        const lt = getLeaveType(leave.type);
        cellHtml += '<div class="planning-week-shift" style="background:' + lt.couleur + ';">' + lt.icon + ' ' + escapeHtml(lt.label) + '</div>';
      } else if (entry && entry.shiftId) {
        const shift = getShiftById(entry.shiftId);
        if (shift) {
          const dur = getShiftDuration(shift);
          cellHtml += '<div class="planning-week-shift" style="background:' + shift.couleur + ';">' + shift.icon + ' ' + escapeHtml(shift.nom) + '</div>';
          cellHtml += '<div class="planning-week-hours">' + shift.heureDebut + ' - ' + shift.heureFin + ' (' + dur + 'h)</div>';
        }
      }

      html += '<td data-date="' + ds + '" data-agent="' + agent.idx + '">' + cellHtml + '</td>';
    });

    html += '<td class="total-col' + (isOver48 ? ' over48' : '') + '">' + weekHours.toFixed(1) + 'h</td>';
    html += '</tr>';
  });

  html += '</table></div>';

  // "Agents prévus aujourd'hui" section
  html += renderTodayPresenceSectionWeek(activeTeam, todayISO);

  container.innerHTML = html;
  bindNav(container);
  bindPresenceConfirmWeek(container, activeTeam, todayISO);
}

function bindNav(container) {
  const prev = container.querySelector('#planWeekPrev');
  const next = container.querySelector('#planWeekNext');
  const absBtn = container.querySelector('#planWeekAbsenceBtn');
  if (prev) prev.addEventListener('click', () => {
    _weekStart.setDate(_weekStart.getDate() - 7);
    renderWeekTab(container);
  });
  if (next) next.addEventListener('click', () => {
    _weekStart.setDate(_weekStart.getDate() + 7);
    renderWeekTab(container);
  });
  if (absBtn) absBtn.addEventListener('click', () => {
    openAbsenceForm(container);
  });
}

// =============================================
// Signaler une absence (formulaire complet)
// =============================================

function openAbsenceForm(container) {
  const activeTeam = getActiveTeam();
  if (activeTeam.length === 0) {
    showToast('Aucun agent configur\u00e9', 'warning');
    return;
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const absenceTypes = LEAVE_TYPES.filter(lt => ['maladie', 'absence_injustifiee', 'formation', 'autre'].includes(lt.code));

  let html = '<div class="planning-picker-overlay" id="planWeekAbsOverlay">';
  html += '<div class="planning-picker planning-absence-form">';
  html += '<div class="planning-picker-title">\uD83D\uDEA8 Signaler une absence impr\u00e9vue</div>';

  // Agent select
  html += '<div class="planning-absence-field">';
  html += '  <label>Agent</label>';
  html += '  <select id="planWeekAbsAgent">';
  html += '    <option value="">\u2014 Choisir un agent \u2014</option>';
  activeTeam.forEach(a => {
    html += '    <option value="' + a.idx + '">' + escapeHtml(a.nom) + (a.matricule ? ' (Mat. ' + escapeHtml(a.matricule) + ')' : '') + '</option>';
  });
  html += '  </select>';
  html += '</div>';

  // Type
  html += '<div class="planning-absence-field">';
  html += '  <label>Type d\'absence</label>';
  html += '  <div class="planning-absence-types" id="planWeekAbsTypes">';
  absenceTypes.forEach((lt, i) => {
    html += '    <label class="planning-absence-type-option">';
    html += '      <input type="radio" name="weekAbsType" value="' + lt.code + '"' + (i === 0 ? ' checked' : '') + '>';
    html += '      <span class="planning-absence-type-label" style="--abs-color:' + lt.couleur + ';">' + lt.icon + ' ' + escapeHtml(lt.label) + '</span>';
    html += '    </label>';
  });
  html += '  </div>';
  html += '</div>';

  // Duration
  html += '<div class="planning-absence-field">';
  html += '  <label>Dur\u00e9e</label>';
  html += '  <div class="planning-absence-types">';
  html += '    <label class="planning-absence-type-option">';
  html += '      <input type="radio" name="weekAbsDuration" value="today" checked>';
  html += '      <span class="planning-absence-type-label">Aujourd\'hui seulement</span>';
  html += '    </label>';
  html += '    <label class="planning-absence-type-option">';
  html += '      <input type="radio" name="weekAbsDuration" value="multi">';
  html += '      <span class="planning-absence-type-label">Plusieurs jours</span>';
  html += '    </label>';
  html += '  </div>';
  html += '  <div id="planWeekAbsMultiDates" style="display:none;margin-top:8px;">';
  html += '    <div style="display:flex;gap:8px;align-items:center;">';
  html += '      <span style="font-size:12px;color:var(--color-neutral-400);">Du</span>';
  html += '      <input type="date" id="planWeekAbsDateDebut" value="' + todayISO + '">';
  html += '      <span style="font-size:12px;color:var(--color-neutral-400);">au</span>';
  html += '      <input type="date" id="planWeekAbsDateFin" value="' + todayISO + '">';
  html += '    </div>';
  html += '  </div>';
  html += '</div>';

  // Motif
  html += '<div class="planning-absence-field">';
  html += '  <label>Motif (optionnel)</label>';
  html += '  <input type="text" id="planWeekAbsMotif" placeholder="Ex: arr\u00eat m\u00e9dical, appel ce matin...">';
  html += '</div>';

  // Actions
  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-picker-btn-cancel" id="planWeekAbsCancel">Annuler</button>';
  html += '  <button class="planning-absence-inline-confirm" id="planWeekAbsConfirm">\u2705 Enregistrer</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planWeekAbsOverlay');

  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
  document.getElementById('planWeekAbsCancel').addEventListener('click', () => el.remove());

  // Toggle multi-day dates
  el.querySelectorAll('input[name="weekAbsDuration"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('planWeekAbsMultiDates').style.display = radio.value === 'multi' ? 'block' : 'none';
    });
  });

  // Confirm
  document.getElementById('planWeekAbsConfirm').addEventListener('click', () => {
    const agentIdx = parseInt(document.getElementById('planWeekAbsAgent').value);
    if (isNaN(agentIdx)) {
      showToast('Veuillez choisir un agent', 'warning');
      return;
    }

    const { team, presentToday } = getState();
    const agent = team[agentIdx];
    const typeCode = el.querySelector('input[name="weekAbsType"]:checked').value;
    const lt = getLeaveType(typeCode);
    const isMulti = el.querySelector('input[name="weekAbsDuration"]:checked').value === 'multi';
    const dateDebut = isMulti ? document.getElementById('planWeekAbsDateDebut').value : todayISO;
    const dateFin = isMulti ? document.getElementById('planWeekAbsDateFin').value : todayISO;
    const motif = document.getElementById('planWeekAbsMotif').value || '';

    if (dateFin < dateDebut) {
      showToast('La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but', 'warning');
      return;
    }

    const leave = createLeave({ agentIdx, type: typeCode, dateDebut, dateFin, motif, statut: 'approuve' });
    if (leave) {

      // Remove planning entries
      const start = new Date(dateDebut + 'T00:00:00');
      const end = new Date(dateFin + 'T00:00:00');
      const d = new Date(start);
      while (d <= end) {
        removeEntry(d.toISOString().slice(0, 10), agentIdx);
        d.setDate(d.getDate() + 1);
      }

      // Remove from present if applicable
      if (presentToday && presentToday.includes(agentIdx)) {
        const { presentToday: pt } = getState();
        const idx = pt.indexOf(agentIdx);
        if (idx !== -1) {
          pt.splice(idx, 1);
          setState('presentToday', [...pt]);
        }
        showToast(lt.icon + ' ' + lt.label + ' \u2014 ' + escapeHtml(agent.nom) + ' retir\u00e9 des pr\u00e9sents', 'success');
      } else {
        showToast(lt.icon + ' ' + lt.label + ' enregistr\u00e9e pour ' + escapeHtml(agent.nom), 'success');
      }
    }

    el.remove();
    renderWeekTab(container);
  });
}

// =============================================
// Agents prévus aujourd'hui + Présence confirmée
// =============================================

function getScheduledAgentsWeek(activeTeam, todayISO) {
  const scheduled = [];
  activeTeam.forEach(agent => {
    const entry = getEntry(todayISO, agent.idx);
    const leave = getLeaveForDate(agent.idx, todayISO);
    if (entry && entry.shiftId && !leave) {
      const shift = getShiftById(entry.shiftId);
      if (shift) scheduled.push({ ...agent, shift });
    }
  });
  return scheduled;
}

function renderTodayPresenceSectionWeek(activeTeam, todayISO) {
  const scheduled = getScheduledAgentsWeek(activeTeam, todayISO);
  if (scheduled.length === 0) return '';

  const { presentToday } = getState();
  const presenceDone = presentToday && presentToday.length > 0;
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });

  let html = '<div class="planning-today-section">';
  html += '<div class="planning-today-title">\uD83D\uDCCB Agents pr\u00e9vus aujourd\'hui (' + dateLabel + ')</div>';
  html += '<div class="planning-today-list">';

  scheduled.forEach(a => {
    const dur = getShiftDuration(a.shift);
    html += '<div class="planning-today-agent">';
    html += '  <span class="planning-today-agent-icon" style="background:' + a.shift.couleur + ';">' + a.shift.icon + '</span>';
    html += '  <span class="planning-today-agent-name">' + escapeHtml(a.nom) + '</span>';
    html += '  <span class="planning-today-agent-shift">' + escapeHtml(a.shift.nom) + ' (' + a.shift.heureDebut + '-' + a.shift.heureFin + ', ' + dur + 'h)</span>';
    html += '</div>';
  });

  html += '</div>';
  html += '<div class="planning-today-count">' + scheduled.length + ' agent' + (scheduled.length > 1 ? 's' : '') + ' pr\u00e9vu' + (scheduled.length > 1 ? 's' : '') + ' sur le cycle du jour</div>';

  if (presenceDone) {
    html += '<div class="planning-confirm-done">\u2705 Pr\u00e9sence du jour valid\u00e9e \u2014 ' + presentToday.length + ' agent' + (presentToday.length > 1 ? 's' : '') + ' point\u00e9' + (presentToday.length > 1 ? 's' : '') + '</div>';
  } else {
    html += '<button class="planning-confirm-btn" id="planWeekPresenceConfirmBtn">';
    html += '  \u2705 PR\u00c9SENCE CONFIRM\u00c9E \u2014 TOUT LE MONDE';
    html += '  <span class="planning-confirm-btn-sub">Valider les ' + scheduled.length + ' agents comme pr\u00e9sents</span>';
    html += '</button>';
  }

  html += '</div>';
  return html;
}

function bindPresenceConfirmWeek(container, activeTeam, todayISO) {
  const btn = container.querySelector('#planWeekPresenceConfirmBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    openPresenceModalWeek(container, activeTeam, todayISO);
  });
}

function openPresenceModalWeek(container, activeTeam, todayISO) {
  const scheduled = getScheduledAgentsWeek(activeTeam, todayISO);
  if (scheduled.length === 0) return;

  let html = '<div class="planning-picker-overlay" id="planWeekPresenceOverlay">';
  html += '<div class="planning-picker planning-confirm-modal">';
  html += '<div class="planning-picker-title">\u2705 Confirmer la pr\u00e9sence du jour</div>';

  html += '<div class="planning-confirm-info">Les ' + scheduled.length + ' agents suivants seront marqu\u00e9s comme pr\u00e9sents :</div>';

  html += '<div class="planning-confirm-list">';
  scheduled.forEach(a => {
    html += '<label class="planning-confirm-agent">';
    html += '  <input type="checkbox" value="' + a.idx + '" checked>';
    html += '  <span class="planning-confirm-agent-name">' + escapeHtml(a.nom) + '</span>';
    html += '  <span class="planning-confirm-agent-shift">' + escapeHtml(a.shift.nom) + '</span>';
    html += '</label>';
  });
  html += '</div>';

  html += '<div class="planning-confirm-warning">\u26A0\uFE0F D\u00e9cochez un agent s\'il n\'est pas l\u00e0</div>';

  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-picker-btn-cancel" id="planWeekPresenceCancel">Annuler</button>';
  html += '  <button class="planning-absence-inline-confirm" id="planWeekPresenceValidate">\u2705 Valider la pr\u00e9sence</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planWeekPresenceOverlay');

  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
  document.getElementById('planWeekPresenceCancel').addEventListener('click', () => el.remove());

  document.getElementById('planWeekPresenceValidate').addEventListener('click', () => {
    const checkboxes = el.querySelectorAll('.planning-confirm-list input[type="checkbox"]');
    const checkedIndices = [];
    const uncheckedAgents = [];

    checkboxes.forEach(cb => {
      const idx = parseInt(cb.value);
      if (cb.checked) {
        checkedIndices.push(idx);
      } else {
        const agent = scheduled.find(a => a.idx === idx);
        if (agent) uncheckedAgents.push(agent);
      }
    });

    if (checkedIndices.length === 0) {
      showToast('Aucun agent s\u00e9lectionn\u00e9', 'warning');
      return;
    }

    checkedIndices.sort((a, b) => a - b);
    setState('presentToday', checkedIndices);
    saveDayData();

    showToast('\u2705 Pr\u00e9sence valid\u00e9e \u2014 ' + checkedIndices.length + ' agent' + (checkedIndices.length > 1 ? 's' : '') + ' point\u00e9' + (checkedIndices.length > 1 ? 's' : ''), 'success');

    el.remove();

    if (uncheckedAgents.length > 0) {
      openAbsenceForUncheckedWeek(container, uncheckedAgents, todayISO);
    } else {
      renderWeekTab(container);
    }
  });
}

function openAbsenceForUncheckedWeek(container, uncheckedAgents, todayISO) {
  if (uncheckedAgents.length === 0) {
    renderWeekTab(container);
    return;
  }

  const agent = uncheckedAgents[0];
  const remaining = uncheckedAgents.slice(1);

  let html = '<div class="planning-picker-overlay" id="planWeekAbsUncheckedOverlay">';
  html += '<div class="planning-picker planning-confirm-modal">';
  html += '<div class="planning-picker-title">\u26A0\uFE0F ' + escapeHtml(agent.nom) + ' \u2014 Absent ?</div>';

  html += '<div class="planning-confirm-info">' + escapeHtml(agent.nom) + ' \u00e9tait pr\u00e9vu mais n\'a pas \u00e9t\u00e9 coch\u00e9. Signaler une absence ?</div>';

  html += '<div class="planning-confirm-list">';
  const quickTypes = LEAVE_TYPES.filter(lt => ['maladie', 'absence_injustifiee', 'autre'].includes(lt.code));
  quickTypes.forEach(lt => {
    html += '<div class="planning-picker-absence" data-leave="' + lt.code + '">';
    html += '  <div class="planning-picker-icon" style="background:' + lt.couleur + '22;border:1px solid ' + lt.couleur + ';color:' + lt.couleur + ';">' + lt.icon + '</div>';
    html += '  <div class="planning-picker-label">' + escapeHtml(lt.label) + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-picker-btn-cancel" id="planWeekAbsUncheckedSkip">Ignorer</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planWeekAbsUncheckedOverlay');

  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });

  document.getElementById('planWeekAbsUncheckedSkip').addEventListener('click', () => {
    el.remove();
    if (remaining.length > 0) {
      openAbsenceForUncheckedWeek(container, remaining, todayISO);
    } else {
      renderWeekTab(container);
    }
  });

  el.querySelectorAll('.planning-picker-absence').forEach(item => {
    item.addEventListener('click', () => {
      const typeCode = item.dataset.leave;
      const lt = getLeaveType(typeCode);

      createLeave({ agentIdx: agent.idx, type: typeCode, dateDebut: todayISO, dateFin: todayISO, motif: '', statut: 'approuve' });
      removeEntry(todayISO, agent.idx);

      showToast(lt.icon + ' ' + escapeHtml(agent.nom) + ' \u2014 ' + lt.label, 'success');

      el.remove();
      if (remaining.length > 0) {
        openAbsenceForUncheckedWeek(container, remaining, todayISO);
      } else {
        renderWeekTab(container);
      }
    });
  });
}

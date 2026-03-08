// UI: Planning Month Tab — Vue mensuelle (grille agents x jours)
import { getState, setState } from '../state.js';
import { getEntry, setEntry, removeEntry, checkCompliance } from '../domains/planning.js';
import { getPlanningShifts, getShiftById, getShiftDuration } from '../domains/planning-shifts.js';
import { getLeaveForDate, getLeaveType, createLeave, LEAVE_TYPES } from '../domains/planning-leaves.js';
import { getActiveTeam } from '../domains/team.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/sanitize.js';
import { saveDayData } from '../domains/day-data.js';

let _year, _month; // 0-indexed month

function initDate() {
  const now = new Date();
  if (_year === undefined) { _year = now.getFullYear(); _month = now.getMonth(); }
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function formatMonthYear(y, m) {
  return new Date(y, m, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function dateStr(y, m, d) {
  return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

export function renderMonthTab(container) {
  initDate();
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  const days = daysInMonth(_year, _month);
  const todayISO = new Date().toISOString().slice(0, 10);
  const shifts = getPlanningShifts();

  let html = '';

  // Navigation
  html += '<div class="planning-nav">';
  html += '  <button class="planning-nav-btn" id="planMonthPrev">\u25C0 Pr\u00e9c\u00e9dent</button>';
  html += '  <span class="planning-nav-title">' + formatMonthYear(_year, _month) + '</span>';
  html += '  <button class="planning-nav-btn" id="planMonthNext">Suivant \u25B6</button>';
  html += '  <button class="planning-absence-btn" id="planAbsenceBtn">\uD83D\uDEA8 Signaler une absence</button>';
  html += '</div>';

  if (activeTeam.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">\uD83D\uDC65</div>Aucun agent configur\u00e9.<br>Ajoutez des agents dans la Configuration.</div>';
    container.innerHTML = html;
    bindNav(container);
    return;
  }

  // Grid
  html += '<div class="planning-grid-container">';
  html += '<table class="planning-grid">';

  // Header row
  html += '<tr><th style="min-width:100px;">Agent</th>';
  for (let d = 1; d <= days; d++) {
    const ds = dateStr(_year, _month, d);
    const dt = new Date(_year, _month, d);
    const dow = dt.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = ds === todayISO;
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const cls = isWeekend ? ' weekend' : (isToday ? ' today' : '');
    html += '<th class="' + cls + '">' + dayNames[dow] + '<br>' + d + '</th>';
  }
  html += '</tr>';

  // Agent rows
  activeTeam.forEach(agent => {
    html += '<tr>';
    html += '<td class="agent-name" title="' + escapeHtml(agent.nom) + '">' + escapeHtml(agent.nom) + '</td>';
    for (let d = 1; d <= days; d++) {
      const ds = dateStr(_year, _month, d);
      const dt = new Date(_year, _month, d);
      const dow = dt.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const entry = getEntry(ds, agent.idx);
      const leave = getLeaveForDate(agent.idx, ds);
      const alerts = entry && entry.shiftId ? checkCompliance(agent.idx, ds) : [];
      const worstAlert = alerts.length > 0 ? (alerts.some(a => a.severity === 'error') ? 'error' : 'warning') : '';

      let cellContent = '';
      if (leave) {
        const lt = getLeaveType(leave.type);
        cellContent = '<div class="planning-cell-leave" title="' + escapeHtml(lt.label) + '" style="background:' + lt.couleur + '20;border:1px solid ' + lt.couleur + '40;">' + lt.icon + '</div>';
      } else if (entry && entry.shiftId) {
        const shift = getShiftById(entry.shiftId);
        if (shift) {
          cellContent = '<div class="planning-cell-shift" style="background:' + shift.couleur + ';" title="' + escapeHtml(shift.nom) + ' (' + shift.heureDebut + '-' + shift.heureFin + ')">' + shift.icon + '</div>';
        }
      }
      if (worstAlert) {
        cellContent += '<div class="planning-alert-dot ' + worstAlert + '"></div>';
      }

      const tdCls = isWeekend ? ' weekend' : '';
      html += '<td class="' + tdCls + '" data-date="' + ds + '" data-agent="' + agent.idx + '">';
      html += '<div class="planning-cell">' + cellContent + '</div>';
      html += '</td>';
    }
    html += '</tr>';
  });

  html += '</table></div>';

  // Legend
  html += '<div class="planning-legend">';
  shifts.forEach(s => {
    html += '<div class="planning-legend-item"><div class="planning-legend-dot" style="background:' + s.couleur + ';">' + s.icon + '</div>' + escapeHtml(s.nom) + '</div>';
  });
  html += '<div class="planning-legend-item"><div class="planning-legend-dot" style="background:#e2e8f0;">R</div>Repos</div>';
  LEAVE_TYPES.forEach(lt => {
    html += '<div class="planning-legend-item"><div class="planning-legend-dot" style="background:' + lt.couleur + '22;border:1px solid ' + lt.couleur + ';">' + lt.icon + '</div>' + escapeHtml(lt.label) + '</div>';
  });
  html += '<div class="planning-legend-item"><div class="planning-alert-dot error" style="position:static;width:10px;height:10px;"></div> Alerte</div>';
  html += '</div>';

  // "Agents prévus aujourd'hui" section
  html += renderTodayPresenceSection(activeTeam, todayISO);

  container.innerHTML = html;

  // Bind events
  bindNav(container);
  bindCells(container);
  bindPresenceConfirm(container, activeTeam, todayISO);
}

function bindNav(container) {
  const prev = container.querySelector('#planMonthPrev');
  const next = container.querySelector('#planMonthNext');
  const absBtn = container.querySelector('#planAbsenceBtn');
  if (prev) prev.addEventListener('click', () => {
    _month--;
    if (_month < 0) { _month = 11; _year--; }
    renderMonthTab(container);
  });
  if (next) next.addEventListener('click', () => {
    _month++;
    if (_month > 11) { _month = 0; _year++; }
    renderMonthTab(container);
  });
  if (absBtn) absBtn.addEventListener('click', () => {
    openAbsenceForm(container);
  });
}

function bindCells(container) {
  container.querySelectorAll('.planning-grid td[data-date]').forEach(td => {
    td.addEventListener('click', () => {
      const date = td.dataset.date;
      const agentIdx = parseInt(td.dataset.agent);
      openShiftPicker(container, date, agentIdx);
    });
  });
}

// =============================================
// Shift Picker (with absences)
// =============================================

function openShiftPicker(container, date, agentIdx) {
  const { team } = getState();
  const agent = team[agentIdx];
  if (!agent) return;
  const shifts = getPlanningShifts();
  const current = getEntry(date, agentIdx);
  const currentLeave = getLeaveForDate(agentIdx, date);
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  let html = '<div class="planning-picker-overlay" id="planPickerOverlay">';
  html += '<div class="planning-picker">';
  html += '<div class="planning-picker-title">' + escapeHtml(agent.nom) + ' \u2014 ' + dateFormatted + '</div>';

  // Wrapper for service + absence lists (hidden when inline form is shown)
  html += '<div id="planPickerLists">';

  // Service section
  html += '<div class="planning-picker-section-label">SERVICE</div>';
  html += '<div class="planning-picker-list">';

  shifts.forEach(s => {
    const dur = getShiftDuration(s);
    const sel = !currentLeave && current && current.shiftId === s.id ? ' selected' : '';
    html += '<div class="planning-picker-item' + sel + '" data-shift="' + s.id + '">';
    html += '  <div class="planning-picker-icon" style="background:' + s.couleur + ';">' + s.icon + '</div>';
    html += '  <div class="planning-picker-label">' + escapeHtml(s.nom) + '</div>';
    html += '  <div class="planning-picker-hours">' + s.heureDebut + '-' + s.heureFin + ' (' + dur + 'h)</div>';
    html += '</div>';
  });
  html += '</div>';

  // Absences section
  html += '<div class="planning-picker-section-label">ABSENCES</div>';
  html += '<div class="planning-picker-list">';

  LEAVE_TYPES.forEach(lt => {
    const sel = currentLeave && currentLeave.type === lt.code ? ' selected' : '';
    html += '<div class="planning-picker-absence' + sel + '" data-leave="' + lt.code + '">';
    html += '  <div class="planning-picker-icon" style="background:' + lt.couleur + '22;border:1px solid ' + lt.couleur + ';color:' + lt.couleur + ';">' + lt.icon + '</div>';
    html += '  <div class="planning-picker-label">' + escapeHtml(lt.label) + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '</div>'; // end planPickerLists

  // Absence multi-day form (hidden by default)
  html += '<div class="planning-absence-inline" id="planAbsenceInline" style="display:none;">';
  html += '  <div class="planning-absence-inline-title" id="planAbsenceInlineTitle"></div>';
  html += '  <div class="planning-absence-inline-row">';
  html += '    <label>Jusqu\'\u00e0 quelle date ?</label>';
  html += '    <input type="date" id="planAbsenceDateFin" value="' + date + '" min="' + date + '">';
  html += '  </div>';
  html += '  <div class="planning-absence-inline-row">';
  html += '    <label>Motif (optionnel)</label>';
  html += '    <input type="text" id="planAbsenceMotif" placeholder="Ex: arr\u00eat m\u00e9dical">';
  html += '  </div>';
  html += '  <div class="planning-absence-inline-actions">';
  html += '    <button class="planning-picker-btn-cancel" id="planAbsenceInlineCancel">Retour</button>';
  html += '    <button class="planning-absence-inline-confirm" id="planAbsenceInlineConfirm">Valider l\'absence</button>';
  html += '  </div>';
  html += '</div>';

  html += '<div class="planning-picker-actions" id="planPickerMainActions">';
  html += '  <button class="planning-picker-btn-clear" id="planPickerClear">Repos / Vide</button>';
  html += '  <button class="planning-picker-btn-cancel" id="planPickerCancel">Annuler</button>';
  html += '</div>';
  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planPickerOverlay');

  // Close on background click
  el.addEventListener('click', (e) => {
    if (e.target === el) { el.remove(); }
  });

  // Cancel
  document.getElementById('planPickerCancel').addEventListener('click', () => el.remove());

  // Clear (repos)
  document.getElementById('planPickerClear').addEventListener('click', () => {
    removeEntry(date, agentIdx);
    el.remove();
    renderMonthTab(container);
  });

  // Select shift
  el.querySelectorAll('.planning-picker-item').forEach(item => {
    item.addEventListener('click', () => {
      const shiftId = item.dataset.shift;
      setEntry(date, agentIdx, { shiftId, cycleId: null, manual: true });
      el.remove();
      renderMonthTab(container);
    });
  });

  // Select absence → show inline form
  let _selectedLeaveType = null;

  el.querySelectorAll('.planning-picker-absence').forEach(item => {
    item.addEventListener('click', () => {
      _selectedLeaveType = item.dataset.leave;
      const lt = getLeaveType(_selectedLeaveType);

      // Show inline form, hide lists and main actions
      document.getElementById('planPickerLists').style.display = 'none';
      document.getElementById('planAbsenceInline').style.display = 'block';
      document.getElementById('planPickerMainActions').style.display = 'none';
      document.getElementById('planAbsenceInlineTitle').textContent = lt.icon + ' ' + lt.label;
      document.getElementById('planAbsenceDateFin').value = date;
      document.getElementById('planAbsenceInline').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Inline cancel → back to picker
  document.getElementById('planAbsenceInlineCancel').addEventListener('click', () => {
    document.getElementById('planAbsenceInline').style.display = 'none';
    document.getElementById('planPickerLists').style.display = '';
    document.getElementById('planPickerMainActions').style.display = 'flex';
    _selectedLeaveType = null;
  });

  // Inline confirm → create leave
  document.getElementById('planAbsenceInlineConfirm').addEventListener('click', () => {
    if (!_selectedLeaveType) return;
    const dateFin = document.getElementById('planAbsenceDateFin').value || date;
    const motif = document.getElementById('planAbsenceMotif').value || '';
    const lt = getLeaveType(_selectedLeaveType);

    // Create leave with 'approuve' status directly (responsable action)
    const leave = createLeave({
      agentIdx,
      type: _selectedLeaveType,
      dateDebut: date,
      dateFin,
      motif,
      statut: 'approuve',
    });
    if (leave) {
      // Remove planning entries for the period
      const start = new Date(date + 'T00:00:00');
      const end = new Date(dateFin + 'T00:00:00');
      const d = new Date(start);
      while (d <= end) {
        const ds = d.toISOString().slice(0, 10);
        removeEntry(ds, agentIdx);
        d.setDate(d.getDate() + 1);
      }
    }

    showToast(lt.icon + ' ' + lt.label + ' enregistr\u00e9e pour ' + escapeHtml(agent.nom), 'success');
    el.remove();
    renderMonthTab(container);
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

  // Absence types for the quick form (subset)
  const absenceTypes = LEAVE_TYPES.filter(lt => ['maladie', 'absence_injustifiee', 'formation', 'autre'].includes(lt.code));

  let html = '<div class="planning-picker-overlay" id="planAbsenceOverlay">';
  html += '<div class="planning-picker planning-absence-form">';
  html += '<div class="planning-picker-title">\uD83D\uDEA8 Signaler une absence impr\u00e9vue</div>';

  // Agent select
  html += '<div class="planning-absence-field">';
  html += '  <label>Agent</label>';
  html += '  <select id="planAbsAgent">';
  html += '    <option value="">\u2014 Choisir un agent \u2014</option>';
  activeTeam.forEach(a => {
    html += '    <option value="' + a.idx + '">' + escapeHtml(a.nom) + (a.matricule ? ' (Mat. ' + escapeHtml(a.matricule) + ')' : '') + '</option>';
  });
  html += '  </select>';
  html += '</div>';

  // Type
  html += '<div class="planning-absence-field">';
  html += '  <label>Type d\'absence</label>';
  html += '  <div class="planning-absence-types" id="planAbsTypes">';
  absenceTypes.forEach((lt, i) => {
    html += '    <label class="planning-absence-type-option">';
    html += '      <input type="radio" name="absType" value="' + lt.code + '"' + (i === 0 ? ' checked' : '') + '>';
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
  html += '      <input type="radio" name="absDuration" value="today" checked>';
  html += '      <span class="planning-absence-type-label">Aujourd\'hui seulement</span>';
  html += '    </label>';
  html += '    <label class="planning-absence-type-option">';
  html += '      <input type="radio" name="absDuration" value="multi">';
  html += '      <span class="planning-absence-type-label">Plusieurs jours</span>';
  html += '    </label>';
  html += '  </div>';
  html += '  <div id="planAbsMultiDates" style="display:none;margin-top:8px;">';
  html += '    <div style="display:flex;gap:8px;align-items:center;">';
  html += '      <span style="font-size:12px;color:var(--color-neutral-400);">Du</span>';
  html += '      <input type="date" id="planAbsDateDebut" value="' + todayISO + '">';
  html += '      <span style="font-size:12px;color:var(--color-neutral-400);">au</span>';
  html += '      <input type="date" id="planAbsDateFin" value="' + todayISO + '">';
  html += '    </div>';
  html += '  </div>';
  html += '</div>';

  // Motif
  html += '<div class="planning-absence-field">';
  html += '  <label>Motif (optionnel)</label>';
  html += '  <input type="text" id="planAbsMotif" placeholder="Ex: arr\u00eat m\u00e9dical, appel ce matin...">';
  html += '</div>';

  // Actions
  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-picker-btn-cancel" id="planAbsCancel">Annuler</button>';
  html += '  <button class="planning-absence-inline-confirm" id="planAbsConfirm">\u2705 Enregistrer</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planAbsenceOverlay');

  // Close on background
  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });

  // Cancel
  document.getElementById('planAbsCancel').addEventListener('click', () => el.remove());

  // Toggle multi-day dates
  el.querySelectorAll('input[name="absDuration"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('planAbsMultiDates').style.display = radio.value === 'multi' ? 'block' : 'none';
    });
  });

  // Confirm
  document.getElementById('planAbsConfirm').addEventListener('click', () => {
    const agentIdx = parseInt(document.getElementById('planAbsAgent').value);
    if (isNaN(agentIdx)) {
      showToast('Veuillez choisir un agent', 'warning');
      return;
    }

    const { team, presentToday } = getState();
    const agent = team[agentIdx];
    const typeCode = el.querySelector('input[name="absType"]:checked').value;
    const lt = getLeaveType(typeCode);
    const isMulti = el.querySelector('input[name="absDuration"]:checked').value === 'multi';
    const dateDebut = isMulti ? document.getElementById('planAbsDateDebut').value : todayISO;
    const dateFin = isMulti ? document.getElementById('planAbsDateFin').value : todayISO;
    const motif = document.getElementById('planAbsMotif').value || '';

    if (dateFin < dateDebut) {
      showToast('La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but', 'warning');
      return;
    }

    // Create leave (auto-approved by responsable)
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
      if (presentToday.includes(agentIdx)) {
        const { presentToday: pt } = getState();
        const idx = pt.indexOf(agentIdx);
        if (idx !== -1) {
          pt.splice(idx, 1);
          import('../state.js').then(({ setState }) => setState('presentToday', [...pt]));
        }
        showToast(lt.icon + ' ' + lt.label + ' \u2014 ' + escapeHtml(agent.nom) + ' retir\u00e9 des pr\u00e9sents', 'success');
      } else {
        showToast(lt.icon + ' ' + lt.label + ' enregistr\u00e9e pour ' + escapeHtml(agent.nom), 'success');
      }
    }

    el.remove();
    renderMonthTab(container);
  });
}

// =============================================
// Agents prévus aujourd'hui + Présence confirmée
// =============================================

function getScheduledAgents(activeTeam, todayISO) {
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

function renderTodayPresenceSection(activeTeam, todayISO) {
  const scheduled = getScheduledAgents(activeTeam, todayISO);
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
    html += '<button class="planning-confirm-btn" id="planPresenceConfirmBtn">';
    html += '  \u2705 PR\u00c9SENCE CONFIRM\u00c9E \u2014 TOUT LE MONDE';
    html += '  <span class="planning-confirm-btn-sub">Valider les ' + scheduled.length + ' agents comme pr\u00e9sents</span>';
    html += '</button>';
  }

  html += '</div>';
  return html;
}

function bindPresenceConfirm(container, activeTeam, todayISO) {
  const btn = container.querySelector('#planPresenceConfirmBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    openPresenceModal(container, activeTeam, todayISO);
  });
}

function openPresenceModal(container, activeTeam, todayISO) {
  const scheduled = getScheduledAgents(activeTeam, todayISO);
  if (scheduled.length === 0) return;

  let html = '<div class="planning-picker-overlay" id="planPresenceOverlay">';
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
  html += '  <button class="planning-picker-btn-cancel" id="planPresenceCancel">Annuler</button>';
  html += '  <button class="planning-absence-inline-confirm" id="planPresenceValidate">\u2705 Valider la pr\u00e9sence</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planPresenceOverlay');

  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
  document.getElementById('planPresenceCancel').addEventListener('click', () => el.remove());

  document.getElementById('planPresenceValidate').addEventListener('click', () => {
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

    // Set presence
    checkedIndices.sort((a, b) => a - b);
    setState('presentToday', checkedIndices);
    saveDayData();

    showToast('\u2705 Pr\u00e9sence valid\u00e9e \u2014 ' + checkedIndices.length + ' agent' + (checkedIndices.length > 1 ? 's' : '') + ' point\u00e9' + (checkedIndices.length > 1 ? 's' : ''), 'success');

    el.remove();

    // Handle unchecked agents (absent)
    if (uncheckedAgents.length > 0) {
      openAbsenceForUnchecked(container, uncheckedAgents, todayISO);
    } else {
      renderMonthTab(container);
    }
  });
}

function openAbsenceForUnchecked(container, uncheckedAgents, todayISO) {
  if (uncheckedAgents.length === 0) {
    renderMonthTab(container);
    return;
  }

  const agent = uncheckedAgents[0];
  const remaining = uncheckedAgents.slice(1);

  let html = '<div class="planning-picker-overlay" id="planAbsUncheckedOverlay">';
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
  html += '  <button class="planning-picker-btn-cancel" id="planAbsUncheckedSkip">Ignorer</button>';
  html += '</div>';

  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planAbsUncheckedOverlay');

  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });

  document.getElementById('planAbsUncheckedSkip').addEventListener('click', () => {
    el.remove();
    if (remaining.length > 0) {
      openAbsenceForUnchecked(container, remaining, todayISO);
    } else {
      renderMonthTab(container);
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
        openAbsenceForUnchecked(container, remaining, todayISO);
      } else {
        renderMonthTab(container);
      }
    });
  });
}

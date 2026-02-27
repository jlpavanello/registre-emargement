// UI: Planning Month Tab — Vue mensuelle (grille agents x jours)
import { getState } from '../state.js';
import { getEntry, setEntry, removeEntry, checkCompliance } from '../domains/planning.js';
import { getPlanningShifts, getShiftById, getShiftDuration } from '../domains/planning-shifts.js';
import { getLeaveForDate, getLeaveType } from '../domains/planning-leaves.js';
import { escapeHtml } from '../utils/sanitize.js';

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
  html += '  <button class="planning-nav-btn" id="planMonthPrev">◀ Précédent</button>';
  html += '  <span class="planning-nav-title">' + formatMonthYear(_year, _month) + '</span>';
  html += '  <button class="planning-nav-btn" id="planMonthNext">Suivant ▶</button>';
  html += '</div>';

  if (activeTeam.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">👥</div>Aucun agent configur\u00e9.<br>Ajoutez des agents dans la Configuration.</div>';
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
        cellContent = '<div class="planning-cell-leave" title="' + escapeHtml(lt.label) + '">' + lt.icon + '</div>';
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
  html += '<div class="planning-legend-item"><div class="planning-legend-dot" style="background:#dcfce7;">🌴</div>Cong\u00e9</div>';
  html += '<div class="planning-legend-item"><div class="planning-alert-dot error" style="position:static;width:10px;height:10px;"></div> Alerte</div>';
  html += '</div>';

  container.innerHTML = html;

  // Bind events
  bindNav(container);
  bindCells(container);
}

function bindNav(container) {
  const prev = container.querySelector('#planMonthPrev');
  const next = container.querySelector('#planMonthNext');
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

function openShiftPicker(container, date, agentIdx) {
  const { team } = getState();
  const agent = team[agentIdx];
  if (!agent) return;
  const shifts = getPlanningShifts();
  const current = getEntry(date, agentIdx);
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  let html = '<div class="planning-picker-overlay" id="planPickerOverlay">';
  html += '<div class="planning-picker">';
  html += '<div class="planning-picker-title">' + escapeHtml(agent.nom) + ' — ' + dateFormatted + '</div>';
  html += '<div class="planning-picker-list">';

  shifts.forEach(s => {
    const dur = getShiftDuration(s);
    const sel = current && current.shiftId === s.id ? ' selected' : '';
    html += '<div class="planning-picker-item' + sel + '" data-shift="' + s.id + '">';
    html += '  <div class="planning-picker-icon" style="background:' + s.couleur + ';">' + s.icon + '</div>';
    html += '  <div class="planning-picker-label">' + escapeHtml(s.nom) + '</div>';
    html += '  <div class="planning-picker-hours">' + s.heureDebut + '-' + s.heureFin + ' (' + dur + 'h)</div>';
    html += '</div>';
  });

  html += '</div>';
  html += '<div class="planning-picker-actions">';
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
}

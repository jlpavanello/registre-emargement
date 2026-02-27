// UI: Planning Week Tab — Vue hebdomadaire détaillée
import { getState } from '../state.js';
import { getEntry, setEntry, removeEntry, getAgentHours } from '../domains/planning.js';
import { getPlanningShifts, getShiftById, getShiftDuration } from '../domains/planning-shifts.js';
import { getLeaveForDate, getLeaveType } from '../domains/planning-leaves.js';
import { escapeHtml } from '../utils/sanitize.js';

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
  return d.toISOString().slice(0, 10);
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

  container.innerHTML = html;
  bindNav(container);
}

function bindNav(container) {
  const prev = container.querySelector('#planWeekPrev');
  const next = container.querySelector('#planWeekNext');
  if (prev) prev.addEventListener('click', () => {
    _weekStart.setDate(_weekStart.getDate() - 7);
    renderWeekTab(container);
  });
  if (next) next.addEventListener('click', () => {
    _weekStart.setDate(_weekStart.getDate() + 7);
    renderWeekTab(container);
  });
}

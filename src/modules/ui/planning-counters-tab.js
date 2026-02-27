// UI: Planning Counters Tab — Compteurs & Alertes de conformité
import { getState } from '../state.js';
import { getAgentHours, getEntriesForAgent, checkCompliance } from '../domains/planning.js';
import { getShiftById, getShiftDuration } from '../domains/planning-shifts.js';
import { getLeaveBalance, LEAVE_TYPES, countLeaveDaysUsed } from '../domains/planning-leaves.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderCountersTab(container) {
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  const now = new Date();
  const year = String(now.getFullYear());

  // Current month range
  const monthStart = year + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Year range
  const yearStart = year + '-01-01';
  const yearEnd = year + '-12-31';

  // Current week (Mon-Sun)
  const d = new Date(now);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  let html = '';

  html += '<div class="planning-section-title">📊 Compteurs par agent — ' + year + '</div>';

  if (activeTeam.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">👥</div>Aucun agent configur\u00e9.</div>';
    container.innerHTML = html;
    return;
  }

  activeTeam.forEach(agent => {
    const weekHours = getAgentHours(agent.idx, weekStart, weekEnd);
    const monthHours = getAgentHours(agent.idx, monthStart, monthEnd);
    const yearHours = getAgentHours(agent.idx, yearStart, yearEnd);
    const isWeekOver = weekHours > 48;
    const isYearOver = yearHours > 1607;

    // Collect weekly alerts
    const weekAlerts = [];
    const wd = new Date(monday);
    while (wd <= sunday) {
      const ds = wd.toISOString().slice(0, 10);
      const alerts = checkCompliance(agent.idx, ds);
      alerts.forEach(a => {
        weekAlerts.push({ date: ds, ...a });
      });
      wd.setDate(wd.getDate() + 1);
    }

    html += '<div class="planning-counter-card">';
    html += '<div class="planning-counter-agent">';
    html += '  <span>' + (agent.asvp ? '🔵' : '🟢') + '</span>';
    html += '  <span>' + escapeHtml(agent.nom) + '</span>';
    if (agent.matricule) html += ' <span style="font-size:11px;color:var(--text3);">(Mat. ' + escapeHtml(agent.matricule) + ')</span>';
    html += '</div>';

    // Hours
    html += '<div class="planning-counter-row">';
    html += '  <span class="planning-counter-label">Heures cette semaine</span>';
    html += '  <span class="planning-counter-value' + (isWeekOver ? ' over' : '') + '">' + weekHours.toFixed(1) + 'h' + (isWeekOver ? ' / 48h ⚠️' : ' / 48h') + '</span>';
    html += '</div>';

    html += '<div class="planning-counter-row">';
    html += '  <span class="planning-counter-label">Heures ce mois</span>';
    html += '  <span class="planning-counter-value">' + monthHours.toFixed(1) + 'h</span>';
    html += '</div>';

    html += '<div class="planning-counter-row">';
    html += '  <span class="planning-counter-label">Heures cumul\u00e9es ' + year + '</span>';
    html += '  <span class="planning-counter-value' + (isYearOver ? ' over' : '') + '">' + yearHours.toFixed(1) + 'h / 1607h</span>';
    html += '</div>';

    // Leave balances
    LEAVE_TYPES.forEach(lt => {
      if (lt.joursAn) {
        const balance = getLeaveBalance(agent.idx, lt.code, year);
        if (balance) {
          const isOver = balance.remaining < 0;
          html += '<div class="planning-counter-row">';
          html += '  <span class="planning-counter-label">' + lt.icon + ' ' + escapeHtml(lt.label) + '</span>';
          html += '  <span class="planning-counter-value' + (isOver ? ' over' : ' ok') + '">' + balance.remaining + 'j restants (' + balance.used + '/' + balance.allocation + ')</span>';
          html += '</div>';
        }
      } else {
        // Just show used days
        const used = countLeaveDaysUsed(agent.idx, lt.code, year);
        if (used > 0) {
          html += '<div class="planning-counter-row">';
          html += '  <span class="planning-counter-label">' + lt.icon + ' ' + escapeHtml(lt.label) + '</span>';
          html += '  <span class="planning-counter-value">' + used + 'j</span>';
          html += '</div>';
        }
      }
    });

    // Weekly alerts
    if (weekAlerts.length > 0) {
      html += '<div class="planning-alert-list">';
      weekAlerts.forEach(a => {
        const dateFormatted = new Date(a.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        html += '<div class="planning-alert-item ' + a.severity + '">';
        html += (a.severity === 'error' ? '🔴' : '🟡') + ' ' + dateFormatted + ' — ' + escapeHtml(a.message);
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
  });

  container.innerHTML = html;
}

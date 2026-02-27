// UI: Planning Leaves Tab — Congés & Absences
import { getState } from '../state.js';
import { getPlanningLeaves, createLeave, updateLeaveStatus, deleteLeave, LEAVE_TYPES, getLeaveType, getLeaveBalance } from '../domains/planning-leaves.js';
import { escapeHtml } from '../utils/sanitize.js';

let _filter = 'all'; // all | en_attente | approuve | refuse

export function renderLeavesTab(container) {
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  let leaves = getPlanningLeaves();

  // Sort by date desc
  leaves = [...leaves].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Filter
  if (_filter !== 'all') {
    leaves = leaves.filter(l => l.statut === _filter);
  }

  let html = '';

  // Create button
  html += '<div style="margin-bottom:12px;">';
  html += '  <button class="planning-btn planning-btn-primary" id="btnCreateLeave">+ Nouvelle demande de cong\u00e9</button>';
  html += '</div>';

  // Filters
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">';
  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'en_attente', label: 'En attente' },
    { key: 'approuve', label: 'Approuv\u00e9s' },
    { key: 'refuse', label: 'Refus\u00e9s' },
  ];
  filters.forEach(f => {
    const active = _filter === f.key ? ' planning-tab active' : '';
    html += '<button class="planning-btn planning-btn-sm planning-btn-secondary leave-filter-btn' + active + '" data-filter="' + f.key + '" style="' + (_filter === f.key ? 'background:linear-gradient(135deg,#1e40af,#1e3a8a);color:white;' : '') + '">' + f.label + '</button>';
  });
  html += '</div>';

  if (leaves.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">🌴</div>Aucune demande de cong\u00e9' + (_filter !== 'all' ? ' avec ce filtre' : '') + '.</div>';
  }

  leaves.forEach(leave => {
    const lt = getLeaveType(leave.type);
    const agent = team[leave.agentIdx];
    const agentName = agent ? agent.nom : 'Agent inconnu';
    const dateDebut = new Date(leave.dateDebut + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const dateFin = new Date(leave.dateFin + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    html += '<div class="planning-leave-card" style="border-left-color:' + lt.couleur + ';">';
    html += '  <div class="planning-leave-icon">' + lt.icon + '</div>';
    html += '  <div class="planning-leave-info">';
    html += '    <div class="planning-leave-agent">' + escapeHtml(agentName) + '</div>';
    html += '    <div class="planning-leave-dates">' + escapeHtml(lt.label) + ' — ' + dateDebut + ' au ' + dateFin + '</div>';
    if (leave.motif) {
      html += '    <div class="planning-leave-motif">' + escapeHtml(leave.motif) + '</div>';
    }
    html += '  </div>';
    html += '  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">';
    html += '    <div class="planning-leave-status ' + leave.statut + '">' + formatStatus(leave.statut) + '</div>';

    if (leave.statut === 'en_attente') {
      html += '    <div class="planning-leave-actions">';
      html += '      <button class="planning-leave-btn approve btn-approve-leave" data-id="' + leave.id + '" title="Approuver">✓</button>';
      html += '      <button class="planning-leave-btn refuse btn-refuse-leave" data-id="' + leave.id + '" title="Refuser">✕</button>';
      html += '    </div>';
    }
    html += '    <button class="planning-leave-btn delete btn-delete-leave" data-id="' + leave.id + '" title="Supprimer">🗑</button>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;

  // Bind
  container.querySelector('#btnCreateLeave')?.addEventListener('click', () => showCreateForm(container));

  container.querySelectorAll('.leave-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _filter = btn.dataset.filter;
      renderLeavesTab(container);
    });
  });

  container.querySelectorAll('.btn-approve-leave').forEach(btn => {
    btn.addEventListener('click', () => {
      updateLeaveStatus(btn.dataset.id, 'approuve');
      renderLeavesTab(container);
    });
  });

  container.querySelectorAll('.btn-refuse-leave').forEach(btn => {
    btn.addEventListener('click', () => {
      updateLeaveStatus(btn.dataset.id, 'refuse');
      renderLeavesTab(container);
    });
  });

  container.querySelectorAll('.btn-delete-leave').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Supprimer cette demande ?')) {
        deleteLeave(btn.dataset.id);
        renderLeavesTab(container);
      }
    });
  });
}

function formatStatus(s) {
  switch (s) {
    case 'en_attente': return 'En attente';
    case 'approuve': return 'Approuv\u00e9';
    case 'refuse': return 'Refus\u00e9';
    default: return s;
  }
}

function showCreateForm(container) {
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);

  let html = '<div class="planning-picker-overlay" id="planLeaveFormOverlay">';
  html += '<div class="planning-picker" style="width:340px;">';
  html += '<div class="planning-picker-title">Nouvelle demande de cong\u00e9</div>';

  html += '<div class="planning-field"><label>Agent</label>';
  html += '<select id="leaveAgent">';
  html += '<option value="">— Choisir —</option>';
  activeTeam.forEach(a => {
    html += '<option value="' + a.idx + '">' + escapeHtml(a.nom) + '</option>';
  });
  html += '</select></div>';

  html += '<div class="planning-field"><label>Type</label>';
  html += '<select id="leaveType">';
  LEAVE_TYPES.forEach(lt => {
    html += '<option value="' + lt.code + '">' + lt.icon + ' ' + escapeHtml(lt.label) + '</option>';
  });
  html += '</select></div>';

  html += '<div class="planning-field"><label>Date de d\u00e9but</label>';
  html += '<input type="date" id="leaveStart"></div>';

  html += '<div class="planning-field"><label>Date de fin</label>';
  html += '<input type="date" id="leaveEnd"></div>';

  html += '<div class="planning-field"><label>Motif (optionnel)</label>';
  html += '<input type="text" id="leaveMotif" placeholder="Ex: Vacances \u00e9t\u00e9"></div>';

  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-btn planning-btn-primary" id="btnSaveLeave">Cr\u00e9er</button>';
  html += '  <button class="planning-picker-btn-cancel" id="btnCancelLeave">Annuler</button>';
  html += '</div>';
  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planLeaveFormOverlay');
  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
  document.getElementById('btnCancelLeave').addEventListener('click', () => el.remove());

  document.getElementById('btnSaveLeave').addEventListener('click', () => {
    const agentIdx = parseInt(document.getElementById('leaveAgent').value);
    const type = document.getElementById('leaveType').value;
    const dateDebut = document.getElementById('leaveStart').value;
    const dateFin = document.getElementById('leaveEnd').value;
    const motif = document.getElementById('leaveMotif').value.trim();

    if (isNaN(agentIdx)) { alert('Choisissez un agent.'); return; }
    if (!dateDebut || !dateFin) { alert('Choisissez les dates.'); return; }
    if (dateDebut > dateFin) { alert('La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but.'); return; }

    createLeave({ agentIdx, type, dateDebut, dateFin, motif });
    el.remove();
    renderLeavesTab(container);
  });
}

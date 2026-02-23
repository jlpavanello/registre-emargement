// =============================================
// UI: Panneau Audit & Incidents
// Affiche la piste d'audit et permet de gérer les incidents
// =============================================

import { getRecentAuditEntries, getAuditEntriesForDate, AUDIT_ACTIONS, getTodayAuditStats } from '../domains/audit-log.js';
import {
  createIncident, updateIncident, getIncidents, getOpenIncidents, getIncidentStats,
  INCIDENT_TYPES, SEVERITY_LEVELS, INCIDENT_STATUSES,
} from '../domains/incidents.js';
import { getState } from '../state.js';
import { getMachineName } from '../domains/machines.js';
import { getVehicleLabel } from '../domains/crews.js';
import { todayStr } from '../utils/date.js';
import { escapeHtml } from '../utils/sanitize.js';

let _currentTab = 'audit';
let _auditFilter = 'all';
let _incidentFilter = 'all';

// ── Public API ──────────────────────────────────────────────

export function openAuditPanel() {
  document.getElementById('auditPanel').classList.add('active');
  _currentTab = 'audit';
  renderTabs();
  renderCurrentTab();
}

export function closeAuditPanel() {
  document.getElementById('auditPanel').classList.remove('active');
}

export function switchAuditTab(tab) {
  _currentTab = tab;
  renderTabs();
  renderCurrentTab();
}

// ── Tab rendering ───────────────────────────────────────────

function renderTabs() {
  document.querySelectorAll('#auditPanel .audit-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === _currentTab);
  });
}

function renderCurrentTab() {
  const container = document.getElementById('auditTabContent');
  if (!container) return;

  switch (_currentTab) {
    case 'audit':
      renderAuditTab(container);
      break;
    case 'incidents':
      renderIncidentsTab(container);
      break;
    case 'new-incident':
      renderNewIncidentForm(container);
      break;
  }
}

// ── Audit Tab ───────────────────────────────────────────────

function renderAuditTab(container) {
  const stats = getTodayAuditStats();
  const entries = _auditFilter === 'all'
    ? getRecentAuditEntries(100)
    : getAuditEntriesForDate(todayStr()).filter(e => e.category === _auditFilter);

  let html = '';

  // Stats du jour
  html += `<div class="audit-stats">
    <div class="audit-stat"><span class="audit-stat-num">${stats.total}</span><span class="audit-stat-label">Actions</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${stats.signatures}</span><span class="audit-stat-label">Signatures</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${stats.incidents}</span><span class="audit-stat-label">Incidents</span></div>
    <div class="audit-stat"><span class="audit-stat-num">${stats.stock}</span><span class="audit-stat-label">Stock</span></div>
  </div>`;

  // Filtres
  const filters = [
    { key: 'all', label: 'Tout' },
    { key: 'signature', label: 'Signatures' },
    { key: 'visa', label: 'Visas' },
    { key: 'presence', label: 'Présence' },
    { key: 'config', label: 'Config' },
    { key: 'stock', label: 'Stock' },
    { key: 'incident', label: 'Incidents' },
    { key: 'system', label: 'Système' },
  ];
  html += `<div class="audit-filters">`;
  filters.forEach(f => {
    html += `<button class="audit-filter-btn ${_auditFilter === f.key ? 'active' : ''}" data-filter="${f.key}">${f.label}</button>`;
  });
  html += `</div>`;

  // Liste des entrées
  if (entries.length === 0) {
    html += `<div class="audit-empty">
      <div class="audit-empty-icon">📋</div>
      <div>Aucune action enregistrée.</div>
    </div>`;
  } else {
    let lastDate = '';
    entries.forEach(e => {
      if (e.date !== lastDate) {
        const dateObj = new Date(e.date + 'T00:00:00');
        const dateLabel = e.date === todayStr() ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        html += `<div class="audit-date-sep">${dateLabel}</div>`;
        lastDate = e.date;
      }
      html += `<div class="audit-entry" data-category="${e.category}">
        <div class="audit-entry-icon">${e.icon}</div>
        <div class="audit-entry-info">
          <div class="audit-entry-label">${escapeHtml(e.label)}</div>
          ${e.details && e.details.description ? `<div class="audit-entry-desc">${escapeHtml(e.details.description)}</div>` : ''}
          ${e.details && e.details.agentName ? `<div class="audit-entry-desc">Agent : ${escapeHtml(e.details.agentName)}</div>` : ''}
        </div>
        <div class="audit-entry-time">
          <span>${escapeHtml(e.heure)}</span>
          <span class="audit-entry-role">${escapeHtml(e.deviceRole)}</span>
        </div>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Bind filter buttons
  container.querySelectorAll('.audit-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _auditFilter = btn.dataset.filter;
      renderAuditTab(container);
    });
  });
}

// ── Incidents Tab ───────────────────────────────────────────

function renderIncidentsTab(container) {
  const stats = getIncidentStats();
  const statusFilters = [
    { key: 'all', label: `Tous (${stats.total})` },
    { key: 'ouvert', label: `Ouverts (${stats.ouverts})` },
    { key: 'en_cours', label: `En cours (${stats.enCours})` },
    { key: 'resolu', label: `Résolus (${stats.resolus})` },
  ];

  let incidents = _incidentFilter === 'all'
    ? getIncidents()
    : getIncidents({ status: _incidentFilter });

  let html = '';

  // Alerte incidents critiques
  if (stats.critiques > 0) {
    html += `<div class="incident-alert critical">🚨 ${stats.critiques} incident${stats.critiques > 1 ? 's' : ''} critique${stats.critiques > 1 ? 's' : ''} en cours</div>`;
  }
  if (stats.graves > 0) {
    html += `<div class="incident-alert grave">⚠️ ${stats.graves} incident${stats.graves > 1 ? 's' : ''} grave${stats.graves > 1 ? 's' : ''} en cours</div>`;
  }

  // Bouton nouveau
  html += `<button class="incident-new-btn" id="btnNewIncident">+ Signaler un incident</button>`;

  // Filtres par statut
  html += `<div class="audit-filters">`;
  statusFilters.forEach(f => {
    html += `<button class="audit-filter-btn ${_incidentFilter === f.key ? 'active' : ''}" data-ifilter="${f.key}">${f.label}</button>`;
  });
  html += `</div>`;

  // Liste des incidents
  if (incidents.length === 0) {
    html += `<div class="audit-empty">
      <div class="audit-empty-icon">✅</div>
      <div>Aucun incident ${_incidentFilter !== 'all' ? 'avec ce statut' : 'signalé'}.</div>
    </div>`;
  } else {
    incidents.forEach(inc => {
      const typeInfo = INCIDENT_TYPES[inc.type] || INCIDENT_TYPES.autre;
      const sevInfo = SEVERITY_LEVELS[inc.severity] || SEVERITY_LEVELS.moyen;
      const statusInfo = INCIDENT_STATUSES[inc.status] || INCIDENT_STATUSES.ouvert;

      html += `<div class="incident-card" data-id="${escapeHtml(inc.id)}">
        <div class="incident-card-header">
          <span class="incident-type-badge" style="background:${typeInfo.color}20;color:${typeInfo.color};">${typeInfo.icon} ${escapeHtml(typeInfo.label)}</span>
          <span class="incident-severity-badge severity-${inc.severity}">${escapeHtml(sevInfo.label)}</span>
          <span class="incident-status-badge">${statusInfo.icon} ${escapeHtml(statusInfo.label)}</span>
        </div>
        <div class="incident-card-title">${escapeHtml(inc.title)}</div>
        ${inc.description ? `<div class="incident-card-desc">${escapeHtml(inc.description.length > 150 ? inc.description.substring(0, 150) + '...' : inc.description)}</div>` : ''}
        <div class="incident-card-meta">
          ${inc.agentName ? `<span>👤 ${escapeHtml(inc.agentName)}</span>` : ''}
          ${inc.armeName ? `<span>🔫 ${escapeHtml(inc.armeName)}</span>` : ''}
          ${inc.lieu ? `<span>📍 ${escapeHtml(inc.lieu)}</span>` : ''}
          <span>📅 ${escapeHtml(inc.date)} ${escapeHtml(inc.heure)}</span>
        </div>
        ${inc.status !== 'cloture' ? `<div class="incident-card-actions">
          ${inc.status === 'ouvert' ? `<button class="incident-action-btn" data-action="en_cours" data-iid="${escapeHtml(inc.id)}">Prendre en charge</button>` : ''}
          ${inc.status === 'en_cours' ? `<button class="incident-action-btn resolve" data-action="resolu" data-iid="${escapeHtml(inc.id)}">Marquer résolu</button>` : ''}
          ${inc.status === 'resolu' ? `<button class="incident-action-btn close" data-action="cloture" data-iid="${escapeHtml(inc.id)}">Clôturer</button>` : ''}
        </div>` : ''}
      </div>`;
    });
  }

  container.innerHTML = html;

  // Bind events
  container.querySelector('#btnNewIncident')?.addEventListener('click', () => {
    _currentTab = 'new-incident';
    renderTabs();
    renderCurrentTab();
  });

  container.querySelectorAll('.audit-filter-btn[data-ifilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      _incidentFilter = btn.dataset.ifilter;
      renderIncidentsTab(container);
    });
  });

  container.querySelectorAll('.incident-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.dataset.action;
      const id = btn.dataset.iid;
      const comment = newStatus === 'resolu'
        ? prompt('Commentaire de résolution (optionnel) :') || ''
        : '';
      updateIncident(id, { status: newStatus }, comment);
      renderIncidentsTab(container);
    });
  });
}

// ── New Incident Form ───────────────────────────────────────

function renderNewIncidentForm(container) {
  const { team, machines, vehicles } = getState();
  const activeTeam = team.filter(t => t.nom);
  const activeMachines = machines.filter(m => m.nom);

  let typeOptions = Object.entries(INCIDENT_TYPES).map(([key, val]) =>
    `<option value="${key}">${val.icon} ${val.label}</option>`
  ).join('');

  let severityOptions = Object.entries(SEVERITY_LEVELS).map(([key, val]) =>
    `<option value="${key}">${val.label}</option>`
  ).join('');

  let agentOptions = `<option value="">— Aucun agent —</option>` +
    activeTeam.map((t, i) => `<option value="${team.indexOf(t)}">${escapeHtml(t.nom)}${t.matricule ? ' (' + escapeHtml(t.matricule) + ')' : ''}</option>`).join('');

  let armeOptions = `<option value="">— Aucune arme —</option>` +
    activeMachines.map((m, i) => `<option value="${machines.indexOf(m)}">${escapeHtml(m.nom)}${m.ref ? ' (' + escapeHtml(m.ref) + ')' : ''}</option>`).join('');

  let vehiculeOptions = `<option value="">— Aucun véhicule —</option>` +
    vehicles.map((v, i) => `<option value="${i}">${escapeHtml(v.marque || 'Véhicule')} ${escapeHtml(v.immatriculation || '')}</option>`).join('');

  let html = `
    <div class="incident-form">
      <button class="incident-back-btn" id="btnBackToIncidents">← Retour aux incidents</button>
      <h3 class="incident-form-title">🚨 Signaler un incident</h3>

      <label>Type d'incident</label>
      <select id="incidentType">${typeOptions}</select>

      <label>Gravité</label>
      <select id="incidentSeverity">${severityOptions}</select>

      <label>Titre</label>
      <input type="text" id="incidentTitle" placeholder="Ex: Arme enrayée lors du contrôle" maxlength="120">

      <label>Description</label>
      <textarea id="incidentDesc" placeholder="Décrivez l'incident en détail..." rows="4" maxlength="1000"></textarea>

      <label>Agent concerné</label>
      <select id="incidentAgent">${agentOptions}</select>

      <label>Arme concernée</label>
      <select id="incidentArme">${armeOptions}</select>

      <label>Véhicule concerné</label>
      <select id="incidentVehicule">${vehiculeOptions}</select>

      <label>Lieu</label>
      <input type="text" id="incidentLieu" placeholder="Ex: Place du Marché, RN7 km 42..." maxlength="120">

      <button class="incident-submit-btn" id="btnSubmitIncident">Enregistrer l'incident</button>
    </div>
  `;

  container.innerHTML = html;

  // Bind
  container.querySelector('#btnBackToIncidents')?.addEventListener('click', () => {
    _currentTab = 'incidents';
    renderTabs();
    renderCurrentTab();
  });

  container.querySelector('#btnSubmitIncident')?.addEventListener('click', () => {
    const title = document.getElementById('incidentTitle').value.trim();
    if (!title) { alert('Veuillez saisir un titre.'); return; }

    const agentIdx = document.getElementById('incidentAgent').value;
    const armeIdx = document.getElementById('incidentArme').value;
    const vehiculeIdx = document.getElementById('incidentVehicule').value;

    createIncident({
      type: document.getElementById('incidentType').value,
      severity: document.getElementById('incidentSeverity').value,
      title,
      description: document.getElementById('incidentDesc').value.trim(),
      agentIdx: agentIdx ? parseInt(agentIdx) : null,
      agentName: agentIdx ? team[parseInt(agentIdx)]?.nom || '' : '',
      armeIdx: armeIdx ? parseInt(armeIdx) : null,
      armeName: armeIdx ? getMachineName(parseInt(armeIdx)) : '',
      vehiculeIdx: vehiculeIdx ? parseInt(vehiculeIdx) : null,
      vehiculeName: vehiculeIdx ? getVehicleLabel(parseInt(vehiculeIdx)) : '',
      lieu: document.getElementById('incidentLieu').value.trim(),
    });

    alert('Incident enregistré.');
    _currentTab = 'incidents';
    renderTabs();
    renderCurrentTab();
  });
}

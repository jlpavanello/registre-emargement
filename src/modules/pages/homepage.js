// =============================================
// homepage.js — Tableau de bord opérationnel
// Vue d'ensemble de la journée
// =============================================

import { getState, subscribe } from '../state.js';
import { getDeviceRole } from '../auth/auth-state.js';
import { showRoleScreen, showLoginScreen } from '../auth/login-screen.js';
import { getActiveTeam } from '../domains/team.js';
import { getActiveVehicles, getVehicleLabel } from '../domains/crews.js';
import { getCrewForEmployee } from '../domains/crew-assignment.js';
import { getMachineName } from '../domains/machines.js';
import { isMatinLocked, isSoirLocked } from '../ui/visa.js';
import { getOpenIncidents } from '../domains/incidents.js';
import { escapeHtml } from '../utils/sanitize.js';

let _unsubs = [];

// =============================================
// Outils (grille accès rapides en bas)
// =============================================

const TOOLS = [
  { id: 'planning', icon: '\uD83D\uDCC5', label: 'Planning', route: '/planning', roles: ['responsable'] },
  { id: 'presence', icon: '\u2705', label: 'Présence', route: '/presence', roles: ['responsable'],
    badge: () => { const { presentToday } = getState(); return presentToday.length > 0 ? presentToday.length : ''; },
    badgeColor: 'green',
  },
  { id: 'registre', icon: '\uD83D\uDCCB', label: 'Registre', route: '/registre', roles: ['responsable', 'agent'] },
  { id: 'equipages', icon: '\uD83D\uDE94', label: '\u00c9quipages', route: '/equipages', roles: ['responsable'],
    badge: () => { const { crewAssignments } = getState(); return Object.values(crewAssignments).filter(m => m && m.length > 0).length || ''; },
  },
  { id: 'stock', icon: '\uD83D\uDCE6', label: 'Stock', route: '/stock', roles: ['responsable'] },
  { id: 'pv', icon: '\uD83D\uDCDD', label: 'PV', route: '/pv', roles: ['responsable'] },
  { id: 'vocal', icon: '\uD83D\uDCC4', label: 'CR', route: '/vocal', roles: ['responsable', 'agent'] },
];

// =============================================
// Template principal
// =============================================

function getTemplate() {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const role = getDeviceRole() || 'responsable';
  const isAgent = role === 'agent';

  let html = `
    <div class="homepage">
      <div class="homepage-bg">
        <div class="homepage-bg-orb homepage-bg-orb--1"></div>
        <div class="homepage-bg-orb homepage-bg-orb--2"></div>
      </div>

      <div class="homepage-header">
        <div class="homepage-header-left">
          <img src="/logo-police-municipale.png" alt="" class="homepage-logo" onerror="this.style.display='none'">
          <div class="homepage-title-group">
            <h1 class="homepage-title">Gestion Op\u00e9rationnelle</h1>
            <div class="homepage-subtitle">Police Municipale de Monistrol-sur-Loire</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="homepage-role-btn" id="btnHomeLogout" title="Déconnexion" style="opacity:0.7;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
          <button class="homepage-role-btn" id="btnHomeRole" title="Changer de profil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
          </button>
        </div>
      </div>

      <div class="homepage-date-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span>${today}</span>
      </div>

      <div class="homepage-content" id="tdbContent">`;

  // Alert banner
  html += renderPresenceAlert(isAgent);

  // Synthèse
  html += renderSynthese(isAgent);

  // Équipages
  if (!isAgent) html += renderEquipages();

  // Agents présents
  html += renderAgentsList(isAgent);

  // Incidents
  if (!isAgent) html += renderIncidents();

  // Accès rapides
  html += renderQuickAccess(isAgent);

  html += `
      </div>
    </div>`;

  return html;
}

// =============================================
// Sections
// =============================================

function renderPresenceAlert(isAgent) {
  if (isAgent) return '';
  const { presentToday } = getState();
  if (presentToday.length > 0) return '';
  return `
    <div class="alert-banner warning" id="homePresenceAlert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;flex-shrink:0;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div style="flex:1;line-height:1.4;">
        La pr\u00e9sence du jour n'a pas \u00e9t\u00e9 point\u00e9e.
        <a href="#/presence">Pointer maintenant \u2192</a>
      </div>
      <button class="alert-banner-close" id="btnDismissAlert">\u2715</button>
    </div>`;
}

function renderSynthese(isAgent) {
  const { presentToday, team, dayData, crewAssignments } = getState();
  const activeTeam = getActiveTeam();
  const totalActive = activeTeam.length;
  const presentCount = presentToday.length;

  // Signatures
  let sigMatin = 0, sigSoir = 0;
  presentToday.forEach(i => {
    const d = dayData[i];
    if (d && d.matin && d.matin.signature) sigMatin++;
    if (d && d.soir && d.soir.signature) sigSoir++;
  });

  // Armes
  let armesCount = 0;
  presentToday.forEach(i => {
    const d = dayData[i];
    if (d && d.matin && d.matin.machines) armesCount += d.matin.machines.length;
  });

  // Visa status
  const matinLocked = isMatinLocked();
  const soirLocked = isSoirLocked();

  // Équipages
  const crewCount = Object.values(crewAssignments).filter(m => m && m.length > 0).length;

  if (isAgent) {
    // Agent: vue simplifiée
    return `
    <div class="tdb-section" id="tdbSynthese">
      <div class="tdb-section-title">\uD83D\uDCCA Synth\u00e8se du jour</div>
      <div class="tdb-stats-row">
        <div class="tdb-stat">
          <div class="tdb-stat-value${presentCount > 0 ? ' success' : ''}">${presentCount}</div>
          <div class="tdb-stat-label">pr\u00e9sents</div>
        </div>
        <div class="tdb-stat">
          <div class="tdb-stat-value primary">${armesCount}</div>
          <div class="tdb-stat-label">armes sorties</div>
        </div>
      </div>
    </div>`;
  }

  return `
    <div class="tdb-section" id="tdbSynthese">
      <div class="tdb-section-title">\uD83D\uDCCA Synth\u00e8se du jour</div>
      <div class="tdb-stats-grid">
        <a href="#/presence" class="tdb-stat-card">
          <div class="tdb-stat-icon">\uD83D\uDC65</div>
          <div class="tdb-stat-value${presentCount > 0 ? ' success' : ' warning'}">${presentCount}<span class="tdb-stat-total">/${totalActive}</span></div>
          <div class="tdb-stat-label">Pr\u00e9sents</div>
        </a>
        <a href="#/registre" class="tdb-stat-card">
          <div class="tdb-stat-icon">\u270D\uFE0F</div>
          <div class="tdb-stat-value primary">${sigMatin}<span class="tdb-stat-total">/${presentCount}</span></div>
          <div class="tdb-stat-label">Sortie armes</div>
          <div class="tdb-stat-badge ${matinLocked ? 'locked' : 'unlocked'}">${matinLocked ? '\uD83D\uDD12 Vis\u00e9' : '\uD83D\uDD13'}</div>
        </a>
        <a href="#/registre" class="tdb-stat-card${presentCount > 0 && sigSoir < presentCount && !soirLocked ? ' tdb-stat-card--alert' : ''}">
          <div class="tdb-stat-icon">\uD83D\uDD04</div>
          <div class="tdb-stat-value${presentCount > 0 && sigSoir < presentCount && !soirLocked ? ' danger' : ' primary'}">${sigSoir}<span class="tdb-stat-total">/${presentCount}</span></div>
          <div class="tdb-stat-label">Retour armes</div>
          <div class="tdb-stat-badge ${soirLocked ? 'locked' : 'unlocked'}">${soirLocked ? '\uD83D\uDD12 Vis\u00e9' : '\uD83D\uDD13'}</div>
        </a>
        <a href="#/equipages" class="tdb-stat-card">
          <div class="tdb-stat-icon">\uD83D\uDE94</div>
          <div class="tdb-stat-value${crewCount > 0 ? ' primary' : ' warning'}">${crewCount}</div>
          <div class="tdb-stat-label">\u00c9quipages</div>
          ${presentCount > 0 && crewCount === 0 ? '<div class="tdb-stat-badge warning">\u26A0\uFE0F \u00c0 faire</div>' : ''}
        </a>
        <a href="#/registre" class="tdb-stat-card${presentCount > 0 && !(matinLocked && soirLocked) ? ' tdb-stat-card--alert' : ''}">
          <div class="tdb-stat-icon">\uD83D\uDCC4</div>
          <div class="tdb-stat-value${matinLocked && soirLocked ? ' success' : ' danger'}">PDF</div>
          <div class="tdb-stat-label">Registre du jour</div>
          <div class="tdb-stat-badge ${matinLocked && soirLocked ? 'locked' : 'warning'}">${matinLocked && soirLocked ? '\u2705 Pr\u00eat' : '\uD83D\uDD34 En attente'}</div>
        </a>
      </div>
    </div>`;
}

function renderEquipages() {
  const { crewAssignments, crewDrivers, team, vehicles } = getState();
  const activeCrews = Object.entries(crewAssignments).filter(([, members]) => members && members.length > 0);

  if (activeCrews.length === 0) return '';

  let html = `
    <div class="tdb-section" id="tdbEquipages">
      <div class="tdb-section-title">\uD83D\uDE94 \u00c9quipages du jour</div>
      <div class="tdb-crews">`;

  for (const [vIdx, members] of activeCrews) {
    const vehicleIdx = parseInt(vIdx);
    const vLabel = getVehicleLabel(vehicleIdx);
    const driverIdx = crewDrivers[vehicleIdx];

    html += `
        <div class="tdb-crew-card">
          <div class="tdb-crew-vehicle">\uD83D\uDE94 ${escapeHtml(vLabel)}</div>
          <div class="tdb-crew-members">`;

    for (const empIdx of members) {
      const emp = team[empIdx];
      if (!emp || !emp.nom) continue;
      const isDriver = empIdx === driverIdx;
      html += `<span class="tdb-crew-member${isDriver ? ' driver' : ''}">${escapeHtml(emp.nom)}${isDriver ? ' \uD83C\uDFCE\uFE0F' : ''}</span>`;
    }

    html += `
          </div>
        </div>`;
  }

  html += `
      </div>
    </div>`;
  return html;
}

function renderAgentsList(isAgent) {
  const { presentToday, team, dayData } = getState();
  if (presentToday.length === 0) return '';

  let html = `
    <div class="tdb-section" id="tdbAgents">
      <div class="tdb-section-title">\uD83D\uDC65 Agents pr\u00e9sents <span class="tdb-count">${presentToday.length}</span></div>
      <div class="tdb-agents-list">`;

  for (const i of presentToday) {
    const emp = team[i];
    if (!emp || !emp.nom) continue;
    const d = dayData[i];
    const hasMatin = d && d.matin && d.matin.signature;
    const hasSoir = d && d.soir && d.soir.signature;
    const machines = (d && d.matin && d.matin.machines) || [];

    // Crew
    const crewVehicle = getCrewForEmployee(i);
    const vehicleLabel = crewVehicle !== null ? getVehicleLabel(crewVehicle) : null;

    // Status
    let statusHtml = '';
    if (hasMatin && hasSoir) {
      statusHtml = '<span class="tdb-agent-status done">\u2705 Complet</span>';
    } else if (hasMatin) {
      statusHtml = '<span class="tdb-agent-status partial">\u2705 Sorti</span>';
    } else {
      statusHtml = '<span class="tdb-agent-status pending">\u23F3 En attente</span>';
    }

    // Badges
    let badgesHtml = '';
    if (machines.length > 0) {
      const armeName = getMachineName(machines[0].machineIdx);
      badgesHtml += `<span class="tdb-agent-badge arme">\uD83D\uDD2B ${escapeHtml(armeName)}${machines.length > 1 ? ' +' + (machines.length - 1) : ''}</span>`;
    }
    if (vehicleLabel) {
      badgesHtml += `<span class="tdb-agent-badge crew">\uD83D\uDE94 ${escapeHtml(vehicleLabel)}</span>`;
    }

    html += `
        <div class="tdb-agent-row">
          <div class="tdb-agent-info">
            <div class="tdb-agent-name">${escapeHtml(emp.nom)}</div>
            <div class="tdb-agent-meta">${emp.matricule ? 'Mat. ' + escapeHtml(emp.matricule) : ''}${badgesHtml ? ' ' : ''}${badgesHtml}</div>
          </div>
          ${statusHtml}
        </div>`;
  }

  html += `
      </div>
    </div>`;
  return html;
}

function renderIncidents() {
  const incidents = getOpenIncidents();
  if (incidents.length === 0) return '';

  const critical = incidents.filter(i => i.severity === 'critique' || i.severity === 'grave').length;

  let html = `
    <div class="tdb-section" id="tdbIncidents">
      <div class="tdb-section-title">\u26A0\uFE0F Incidents ouverts <span class="tdb-count danger">${incidents.length}</span></div>
      <a href="#/audit" class="tdb-incident-summary">
        <div class="tdb-incident-count">${incidents.length} incident${incidents.length > 1 ? 's' : ''} en cours</div>
        ${critical > 0 ? `<div class="tdb-incident-critical">\uD83D\uDD34 ${critical} critique${critical > 1 ? 's' : ''}/grave${critical > 1 ? 's' : ''}</div>` : ''}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
      </a>
    </div>`;
  return html;
}

function renderQuickAccess(isAgent) {
  const visibleTools = isAgent ? TOOLS.filter(t => t.roles.includes('agent')) : TOOLS;
  if (visibleTools.length === 0) return '';

  let html = `
    <div class="tdb-section">
      <div class="tdb-section-title">\u26A1 Acc\u00e8s rapides</div>
      <div class="tdb-quick-grid">`;

  for (const tool of visibleTools) {
    const badgeValue = tool.badge ? tool.badge() : '';
    const badgeColorClass = tool.badgeColor ? ` tool-badge--${tool.badgeColor}` : '';

    html += `
        <a href="#${tool.route}" class="tdb-quick-btn" data-tool="${tool.id}">
          <span class="tdb-quick-icon">${tool.icon}</span>
          <span class="tdb-quick-label">${tool.label}</span>
          ${badgeValue !== '' ? `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="${badgeValue}">${badgeValue}</span>` : `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="0" style="display:none;"></span>`}
        </a>`;
  }

  html += `
      </div>
    </div>`;
  return html;
}

// =============================================
// Live updates
// =============================================

let _refreshTimer = null;

function refreshDashboard() {
  // Debounce: coalesce rapid-fire state updates into one re-render
  if (_refreshTimer) return;
  _refreshTimer = requestAnimationFrame(() => {
    _refreshTimer = null;
    _doRefreshDashboard();
  });
}

function _doRefreshDashboard() {
  const container = document.getElementById('tdbContent');
  if (!container) return;
  const role = getDeviceRole() || 'responsable';
  const isAgent = role === 'agent';

  // Rebuild dynamic sections
  let html = '';
  html += renderPresenceAlert(isAgent);
  html += renderSynthese(isAgent);
  if (!isAgent) html += renderEquipages();
  html += renderAgentsList(isAgent);
  if (!isAgent) html += renderIncidents();
  html += renderQuickAccess(isAgent);

  container.innerHTML = html;

  // Re-bind dismiss button
  const btnDismiss = document.getElementById('btnDismissAlert');
  if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
      const alertEl = document.getElementById('homePresenceAlert');
      if (alertEl) alertEl.remove();
    });
  }
}

// =============================================
// Mount / Unmount
// =============================================

export function mount(container) {
  container.innerHTML = getTemplate();

  const btnRole = document.getElementById('btnHomeRole');
  if (btnRole) {
    btnRole.addEventListener('click', () => {
      if (confirm('Changer le profil de cet appareil ?')) showRoleScreen();
    });
  }

  const btnLogout = document.getElementById('btnHomeLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Se déconnecter de l\'application ?')) showLoginScreen();
    });
  }

  const btnDismiss = document.getElementById('btnDismissAlert');
  if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
      const alertEl = document.getElementById('homePresenceAlert');
      if (alertEl) alertEl.remove();
    });
  }

  _unsubs.push(subscribe('presentToday', refreshDashboard));
  _unsubs.push(subscribe('crewAssignments', refreshDashboard));
  _unsubs.push(subscribe('dayData', refreshDashboard));
  _unsubs.push(subscribe('incidents', refreshDashboard));
  _unsubs.push(subscribe('pvDocuments', refreshDashboard));
}

export function unmount() {
  _unsubs.forEach(fn => fn());
  _unsubs = [];
}

export const homepage = {
  mount,
  unmount,
  title: 'Tableau de bord',
};

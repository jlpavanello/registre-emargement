// =============================================
// sidebar.js — Navigation latérale persistante
// =============================================

import { getState, subscribe } from '../state.js';
import { getCurrentPath } from '../router.js';
import { getDeviceRole } from '../auth/auth-state.js';
import { ACCESS } from '../auth/auth-state.js';

let _unsubs = [];

// =============================================
// Navigation items definition
// =============================================

const NAV_ITEMS = [
  // Tableau de bord — always first
  { id: 'dashboard', icon: '\uD83D\uDCCA', label: 'Tableau de bord', route: '/', section: 'main', roles: ['responsable', 'agent'] },
  // Main section — order reflects morning workflow
  { id: 'planning', icon: '\uD83D\uDCC5', label: 'Planning', route: '/planning', section: 'main', roles: ['responsable'] },
  { id: 'presence', icon: '\u2705', label: 'Présence', route: '/presence', section: 'main', roles: ['responsable'],
    badge: () => {
      const { presentToday } = getState();
      return presentToday.length > 0 ? presentToday.length : '';
    },
    badgeClass: 'success',
  },
  { id: 'registre', icon: '\uD83D\uDCCB', label: 'Registre', route: '/registre', section: 'main', roles: ['responsable', 'agent'] },
  { id: 'equipages', icon: '\uD83D\uDE94', label: 'Équipages', route: '/equipages', section: 'main', roles: ['responsable'],
    badge: () => {
      const { crewAssignments } = getState();
      return Object.values(crewAssignments).filter(m => m && m.length > 0).length || '';
    },
  },
  { id: 'stock', icon: '\uD83D\uDCE6', label: 'Stock', route: '/stock', section: 'main', roles: ['responsable'] },
  { id: 'pv', icon: '\uD83D\uDCDD', label: 'Procès-Verbaux', route: '/pv', section: 'main', roles: ['responsable'] },
  { id: 'vocal', icon: '\uD83D\uDCC4', label: 'Comptes-rendus', route: '/vocal', section: 'main', roles: ['responsable', 'agent'] },

  // Settings section
  { id: 'config', icon: '\u2699\uFE0F', label: 'Configuration', route: '/config', section: 'settings', roles: ['responsable'] },
  { id: 'audit', icon: '\uD83D\uDD0D', label: 'Audit & Incidents', route: '/audit', section: 'settings', roles: ['responsable'] },
  { id: 'feedback', icon: '\uD83D\uDCAC', label: 'Feedback Client', route: '/feedback', section: 'settings', roles: ['responsable'] },
  { id: 'aide', icon: '\u2753', label: 'Aide', route: '/aide', section: 'settings', roles: ['responsable', 'agent'] },
];

// =============================================
// Render sidebar HTML
// =============================================

function getSidebarHTML() {
  const role = getDeviceRole() || 'responsable';
  const currentPath = getCurrentPath();

  const mainItems = NAV_ITEMS.filter(i => i.section === 'main' && i.roles.includes(role));
  const settingsItems = NAV_ITEMS.filter(i => i.section === 'settings' && i.roles.includes(role));

  let html = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="#/" class="sidebar-brand" style="text-decoration:none;color:inherit;">
          <img src="/logo-police-municipale.png" alt="" class="sidebar-logo" onerror="this.style.display='none'">
          <div class="sidebar-brand-text">
            <div class="sidebar-brand-title">\uD83D\uDEE1\uFE0F Gestion PM</div>
            <div class="sidebar-brand-sub">Police Municipale<br>Monistrol-sur-Loire</div>
          </div>
        </a>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">`;

  for (const item of mainItems) {
    const isActive = currentPath === item.route || (item.route !== '/' && currentPath.startsWith(item.route));
    const activeClass = isActive ? ' active' : '';
    const badgeValue = item.badge ? item.badge() : '';
    const badgeHTML = badgeValue !== '' ? `<span class="sidebar-item-badge${item.badgeClass ? ' ' + item.badgeClass : ''}" id="sidebarBadge_${item.id}">${badgeValue}</span>` : `<span class="sidebar-item-badge" id="sidebarBadge_${item.id}" style="display:none;"></span>`;

    html += `
          <a href="#${item.route}" class="sidebar-item${activeClass}" data-route="${item.route}">
            <span class="sidebar-item-icon">${item.icon}</span>
            <span class="sidebar-item-label">${item.label}</span>
            ${badgeHTML}
          </a>`;
  }

  if (settingsItems.length > 0) {
    html += `
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-label">Administration</div>`;

    for (const item of settingsItems) {
      const isActive = currentPath === item.route;
      const activeClass = isActive ? ' active' : '';

      html += `
          <a href="#${item.route}" class="sidebar-item${activeClass}" data-route="${item.route}">
            <span class="sidebar-item-icon">${item.icon}</span>
            <span class="sidebar-item-label">${item.label}</span>
          </a>`;
    }
  }

  html += `
        </div>
      </nav>
      <div class="sidebar-footer">
        <a href="#/chat" class="sidebar-item" data-route="/chat">
          <span class="sidebar-item-icon">\uD83D\uDCAC</span>
          <span class="sidebar-item-label">Chat d'\u00e9quipe</span>
        </a>
      </div>
    </div>

    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;

  return html;
}

// =============================================
// Mount / Update / Unmount
// =============================================

export function mountSidebar() {
  // Remove existing sidebar if any
  const existing = document.getElementById('sidebar');
  if (existing) existing.remove();
  const existingToggle = document.getElementById('sidebarToggle');
  if (existingToggle) existingToggle.remove();
  const existingOverlay = document.getElementById('sidebarOverlay');
  if (existingOverlay) existingOverlay.remove();

  // Insert sidebar at beginning of body
  const wrapper = document.createElement('div');
  wrapper.innerHTML = getSidebarHTML();
  while (wrapper.firstChild) {
    document.body.insertBefore(wrapper.firstChild, document.body.firstChild);
  }

  // Bind toggle events
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // Close sidebar on mobile when clicking a nav item
  sidebar.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      }
    });
  });

  // Subscribe to badge updates
  _unsubs.push(subscribe('presentToday', updateSidebarBadges));
  _unsubs.push(subscribe('crewAssignments', updateSidebarBadges));
}

export function updateSidebarActive() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const currentPath = getCurrentPath();
  sidebar.querySelectorAll('.sidebar-item').forEach(item => {
    const route = item.dataset.route;
    const isActive = route === currentPath || (route !== '/' && currentPath.startsWith(route));
    item.classList.toggle('active', isActive);
  });
}

function updateSidebarBadges() {
  for (const item of NAV_ITEMS) {
    if (!item.badge) continue;
    const el = document.getElementById('sidebarBadge_' + item.id);
    if (!el) continue;
    const val = item.badge();
    el.textContent = val;
    el.style.display = val !== '' ? '' : 'none';
  }
}

export function unmountSidebar() {
  _unsubs.forEach(fn => fn());
  _unsubs = [];
}

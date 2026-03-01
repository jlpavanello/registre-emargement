// =============================================
// homepage.js — Page d'accueil "Caisse à outils"
// Présentation par priorité d'usage
// =============================================

import { getState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { getDeviceRole } from '../auth/auth-state.js';
import { showRoleScreen } from '../auth/login-screen.js';

let _unsubs = [];

// =============================================
// Définition des outils
// =============================================

const TOOLS = [
  // --- HERO : action prioritaire ---
  {
    id: 'presence', icon: '✅', label: 'Présence',
    subtitle: 'Pointer les agents du jour',
    route: '/presence', color: 'blue', section: 'hero',
    roles: ['responsable'],
    badge: () => {
      const { presentToday } = getState();
      return presentToday.length > 0 ? presentToday.length : '';
    },
    badgeColor: 'green',
    badgeLabel: 'présents',
  },
  // --- OUTILS : grille 3×2 ---
  {
    id: 'registre', icon: '📋', label: 'Registre\nd\'attribution',
    route: '/registre', color: 'blue', section: 'tools',
    roles: ['responsable', 'agent'],
  },
  {
    id: 'equipages', icon: '🚗', label: 'Constitution\ndes Équipages',
    route: '/equipages', color: 'blue', section: 'tools',
    roles: ['responsable'],
    badge: () => {
      const { crewAssignments } = getState();
      const count = Object.values(crewAssignments).filter(m => m && m.length > 0).length;
      return count > 0 ? count : '';
    },
    badgeColor: 'purple',
  },
  {
    id: 'stock', icon: '📦', label: 'Stock Armes\n& Munitions',
    route: '/stock', color: 'green', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'planning', icon: '📅', label: 'Planning',
    route: '/planning', color: 'green', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'pv', icon: '📋', label: 'Procès-\nVerbaux',
    route: '/pv', color: 'orange', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'vocal', icon: '🎙️', label: 'Comptes-rendus\nde mission',
    route: '/vocal', color: 'orange', section: 'tools',
    roles: ['responsable', 'agent'],
  },
  // --- SETTINGS ---
  {
    id: 'config', icon: '⚙️', label: 'Configuration',
    route: '/config', color: 'slate', section: 'settings',
    roles: ['responsable'],
  },
  // --- SECONDARY ---
  {
    id: 'audit', icon: '🛡️', label: 'Audit & Incidents',
    route: '/audit', color: 'slate', section: 'secondary',
    roles: ['responsable'],
  },
];

// =============================================
// Template HTML
// =============================================

function getTemplate() {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const role = getDeviceRole() || 'responsable';
  const isAgent = role === 'agent';

  let html = `
    <div class="homepage">
      <div class="homepage-header">
        <img src="/logo-police-municipale.png" alt="" class="homepage-logo" onerror="this.style.display='none'">
        <div class="homepage-title-group">
          <h1 class="homepage-title">GESTION OPÉRATIONNELLE PM</h1>
          <div class="homepage-subtitle">Police Municipale de Monistrol-sur-Loire</div>
          <div class="homepage-date">${today}</div>
        </div>
        <button class="homepage-role-btn" id="btnHomeRole">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
          Profil
        </button>
      </div>

      <div class="homepage-tools">`;

  // 1. Hero — Présence (responsable uniquement)
  html += renderHeroSection(isAgent);

  // 2. Grille d'outils (6 tuiles en 3×2)
  html += renderToolsGrid(isAgent);

  // 3. Config — style settings (responsable uniquement)
  html += renderSettingsSection(isAgent);

  // 4. Audit — secondaire, petit (responsable uniquement)
  html += renderSecondarySection(isAgent);

  html += `
      </div>

      <!-- FAB Chat -->
      <button class="homepage-chat-fab" id="btnHomeChat" title="Chat d'équipe">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="homepage-chat-fab-badge" id="homeChatBadge"></span>
      </button>
    </div>`;

  return html;
}

// =============================================
// Sections de la homepage
// =============================================

/**
 * Hero — Présence : tuile large en haut, gradient bleu, badge "X présents"
 */
function renderHeroSection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'hero');
  if (!tool) return '';
  // Agent n'a pas accès à Présence
  if (isAgent && !tool.roles.includes('agent')) return '';

  const badgeValue = tool.badge ? tool.badge() : '';
  const badgeText = badgeValue !== '' ? `${badgeValue} ${tool.badgeLabel || ''}` : '';

  return `
    <a href="#${tool.route}" class="homepage-hero" data-tool="${tool.id}">
      <div class="hero-tile">
        <span class="hero-icon">${tool.icon}</span>
        <div class="hero-content">
          <span class="hero-label">${tool.label}</span>
          <span class="hero-subtitle">${tool.subtitle || ''}</span>
        </div>
        ${badgeText ? `<span class="hero-badge" id="homeBadge_${tool.id}">${badgeText}</span>` : `<span class="hero-badge" id="homeBadge_${tool.id}" style="display:none;"></span>`}
        <span class="hero-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </div>
    </a>`;
}

/**
 * Grille d'outils — 6 tuiles en 3 colonnes (2 lignes)
 */
function renderToolsGrid(isAgent) {
  const tools = TOOLS.filter(t => t.section === 'tools');
  const visibleTools = isAgent ? tools.filter(t => t.roles.includes('agent')) : tools;
  if (visibleTools.length === 0) return '';

  const cols = Math.min(3, visibleTools.length);

  let html = `
    <div class="homepage-section">
      <div class="homepage-section-title">
        <span class="homepage-section-dot"></span>
        Outils
      </div>
      <div class="tool-grid" style="--grid-cols: ${cols}">`;

  for (const tool of visibleTools) {
    const badgeValue = tool.badge ? tool.badge() : '';
    const badgeColorClass = tool.badgeColor ? ` tool-badge--${tool.badgeColor}` : '';

    html += `
      <a href="#${tool.route}" class="tool-tile tool-tile--${tool.color}" data-tool="${tool.id}">
        <span class="tool-icon">${tool.icon}</span>
        <span class="tool-label">${tool.label.replace(/\n/g, '<br>')}</span>
        ${badgeValue !== '' ? `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="${badgeValue}">${badgeValue}</span>` : `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="0" style="display:none;"></span>`}
      </a>`;
  }

  html += `
      </div>
    </div>`;
  return html;
}

/**
 * Settings — Config : tuile style liste horizontale avec flèche
 */
function renderSettingsSection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'settings');
  if (!tool) return '';
  if (isAgent && !tool.roles.includes('agent')) return '';

  return `
    <div class="homepage-settings">
      <a href="#${tool.route}" class="settings-tile" data-tool="${tool.id}">
        <span class="settings-icon">${tool.icon}</span>
        <span class="settings-label">${tool.label}</span>
        <span class="settings-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>
        </span>
      </a>
    </div>`;
}

/**
 * Secondary — Audit : petit bouton centré, discret
 */
function renderSecondarySection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'secondary');
  if (!tool) return '';
  if (isAgent && !tool.roles.includes('agent')) return '';

  return `
    <div class="homepage-secondary">
      <a href="#${tool.route}" class="secondary-tile" data-tool="${tool.id}">
        <span class="secondary-icon">${tool.icon}</span>
        <span class="secondary-label">${tool.label}</span>
      </a>
    </div>`;
}

// =============================================
// Badges live
// =============================================

function updateBadges() {
  for (const tool of TOOLS) {
    if (!tool.badge) continue;
    const el = document.getElementById('homeBadge_' + tool.id);
    if (!el) continue;
    const val = tool.badge();

    if (tool.section === 'hero') {
      // Hero badge : format "X présents"
      const text = val !== '' ? `${val} ${tool.badgeLabel || ''}` : '';
      el.textContent = text;
      el.style.display = text ? '' : 'none';
    } else {
      // Badge standard (nombre seul)
      el.textContent = val;
      el.dataset.count = val || '0';
      el.style.display = val !== '' ? '' : 'none';
    }
  }
}

function updateChatBadge() {
  const el = document.getElementById('homeChatBadge');
  if (!el) return;
  el.textContent = '';
  el.dataset.count = '0';
}

// =============================================
// Mount / Unmount
// =============================================

export function mount(container) {
  container.innerHTML = getTemplate();

  // Bindings
  const btnRole = document.getElementById('btnHomeRole');
  if (btnRole) {
    btnRole.addEventListener('click', () => {
      if (confirm('Changer le profil de cet appareil ?')) showRoleScreen();
    });
  }

  const btnChat = document.getElementById('btnHomeChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => navigate('/chat'));
  }

  // Badges live : écouter les changements de state
  _unsubs.push(subscribe('presentToday', updateBadges));
  _unsubs.push(subscribe('crewAssignments', updateBadges));
  _unsubs.push(subscribe('chatMessages', updateChatBadge));

  // Mise à jour initiale
  updateBadges();
  updateChatBadge();
}

export function unmount() {
  // Cleanup subscriptions
  _unsubs.forEach(fn => fn());
  _unsubs = [];
}

// Export pour le routeur
export const homepage = {
  mount,
  unmount,
  title: 'Accueil',
};

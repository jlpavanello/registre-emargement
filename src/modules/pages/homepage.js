// =============================================
// homepage.js — Page d'accueil "Caisse à outils"
// Version premium — présentation par priorité
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
    desc: 'Armes & munitions',
    route: '/registre', color: 'blue', section: 'tools',
    roles: ['responsable', 'agent'],
  },
  {
    id: 'equipages', icon: '🚗', label: 'Équipages',
    desc: 'Véhicules & agents',
    route: '/equipages', color: 'indigo', section: 'tools',
    roles: ['responsable'],
    badge: () => {
      const { crewAssignments } = getState();
      const count = Object.values(crewAssignments).filter(m => m && m.length > 0).length;
      return count > 0 ? count : '';
    },
    badgeColor: 'purple',
  },
  {
    id: 'stock', icon: '📦', label: 'Stock',
    desc: 'Armes & munitions',
    route: '/stock', color: 'emerald', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'planning', icon: '📅', label: 'Planning',
    desc: 'Cycles & congés',
    route: '/planning', color: 'sky', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'pv', icon: '📝', label: 'Procès-\nVerbaux',
    desc: '60+ modèles',
    route: '/pv', color: 'amber', section: 'tools',
    roles: ['responsable'],
  },
  {
    id: 'vocal', icon: '🎙️', label: 'Comptes-\nrendus',
    desc: 'Dictée & mission',
    route: '/vocal', color: 'rose', section: 'tools',
    roles: ['responsable', 'agent'],
  },
  // --- SETTINGS ---
  {
    id: 'config', icon: '⚙️', label: 'Configuration',
    desc: 'Équipe, armes, véhicules',
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
      <!-- Arrière-plan décoratif -->
      <div class="homepage-bg">
        <div class="homepage-bg-orb homepage-bg-orb--1"></div>
        <div class="homepage-bg-orb homepage-bg-orb--2"></div>
      </div>

      <div class="homepage-header">
        <div class="homepage-header-left">
          <img src="/logo-police-municipale.png" alt="" class="homepage-logo" onerror="this.style.display='none'">
          <div class="homepage-title-group">
            <h1 class="homepage-title">Gestion Opérationnelle</h1>
            <div class="homepage-subtitle">Police Municipale de Monistrol-sur-Loire</div>
          </div>
        </div>
        <button class="homepage-role-btn" id="btnHomeRole" title="Changer de profil">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
        </button>
      </div>

      <div class="homepage-date-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span>${today}</span>
      </div>

      <div class="homepage-content">`;

  // 1. Hero — Présence
  html += renderHeroSection(isAgent);

  // 2. Grille d'outils
  html += renderToolsGrid(isAgent);

  // 3. Config
  html += renderSettingsSection(isAgent);

  // 4. Audit
  html += renderSecondarySection(isAgent);

  html += `
      </div>

      <!-- FAB Chat -->
      <button class="homepage-fab" id="btnHomeChat" title="Chat d'équipe">
        <span class="homepage-fab-ring"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="homepage-fab-badge" id="homeChatBadge"></span>
      </button>
    </div>`;

  return html;
}

// =============================================
// Sections
// =============================================

function renderHeroSection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'hero');
  if (!tool) return '';
  if (isAgent && !tool.roles.includes('agent')) return '';

  const badgeValue = tool.badge ? tool.badge() : '';
  const badgeText = badgeValue !== '' ? `${badgeValue} ${tool.badgeLabel || ''}` : '';

  return `
    <a href="#${tool.route}" class="hero" data-tool="${tool.id}">
      <div class="hero-glow"></div>
      <div class="hero-inner">
        <div class="hero-icon-wrap">
          <span class="hero-icon">${tool.icon}</span>
        </div>
        <div class="hero-body">
          <span class="hero-label">${tool.label}</span>
          <span class="hero-subtitle">${tool.subtitle || ''}</span>
        </div>
        <div class="hero-right">
          ${badgeText ? `<span class="hero-badge" id="homeBadge_${tool.id}">${badgeText}</span>` : `<span class="hero-badge" id="homeBadge_${tool.id}" style="display:none;"></span>`}
          <svg class="hero-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </a>`;
}

function renderToolsGrid(isAgent) {
  const tools = TOOLS.filter(t => t.section === 'tools');
  const visibleTools = isAgent ? tools.filter(t => t.roles.includes('agent')) : tools;
  if (visibleTools.length === 0) return '';

  const cols = Math.min(3, visibleTools.length);

  let html = `
    <div class="section">
      <div class="section-head">
        <span class="section-line"></span>
        <span class="section-title">Outils</span>
        <span class="section-line"></span>
      </div>
      <div class="tool-grid" style="--grid-cols: ${cols}">`;

  for (let i = 0; i < visibleTools.length; i++) {
    const tool = visibleTools[i];
    const badgeValue = tool.badge ? tool.badge() : '';
    const badgeColorClass = tool.badgeColor ? ` tool-badge--${tool.badgeColor}` : '';

    html += `
      <a href="#${tool.route}" class="tile tile--${tool.color}" data-tool="${tool.id}" style="--delay: ${i}">
        <span class="tile-icon">${tool.icon}</span>
        <span class="tile-label">${tool.label.replace(/\n/g, '<br>')}</span>
        <span class="tile-desc">${tool.desc || ''}</span>
        ${badgeValue !== '' ? `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="${badgeValue}">${badgeValue}</span>` : `<span class="tool-badge${badgeColorClass}" id="homeBadge_${tool.id}" data-count="0" style="display:none;"></span>`}
      </a>`;
  }

  html += `
      </div>
    </div>`;
  return html;
}

function renderSettingsSection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'settings');
  if (!tool) return '';
  if (isAgent && !tool.roles.includes('agent')) return '';

  return `
    <a href="#${tool.route}" class="config-row" data-tool="${tool.id}">
      <span class="config-icon">${tool.icon}</span>
      <div class="config-body">
        <span class="config-label">${tool.label}</span>
        <span class="config-desc">${tool.desc || ''}</span>
      </div>
      <svg class="config-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>
    </a>`;
}

function renderSecondarySection(isAgent) {
  const tool = TOOLS.find(t => t.section === 'secondary');
  if (!tool) return '';
  if (isAgent && !tool.roles.includes('agent')) return '';

  return `
    <div class="secondary-wrap">
      <a href="#${tool.route}" class="secondary-btn" data-tool="${tool.id}">
        <span class="secondary-icon">${tool.icon}</span>
        ${tool.label}
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
      const text = val !== '' ? `${val} ${tool.badgeLabel || ''}` : '';
      el.textContent = text;
      el.style.display = text ? '' : 'none';
    } else {
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

  _unsubs.push(subscribe('presentToday', updateBadges));
  _unsubs.push(subscribe('crewAssignments', updateBadges));
  _unsubs.push(subscribe('chatMessages', updateChatBadge));

  updateBadges();
  updateChatBadge();
}

export function unmount() {
  _unsubs.forEach(fn => fn());
  _unsubs = [];
}

export const homepage = {
  mount,
  unmount,
  title: 'Accueil',
};

// =============================================
// homepage.js — Page d'accueil "Caisse à outils"
// Grille de tuiles organisées par catégorie
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
  // --- JOURNÉE ---
  {
    id: 'registre', icon: '📋', label: 'Registre\nd\'attribution',
    route: '/registre', color: 'blue', category: 'journee',
    roles: ['responsable', 'agent'],
  },
  {
    id: 'presence', icon: '✅', label: 'Présence',
    route: '/presence', color: 'blue', category: 'journee',
    roles: ['responsable'],
    badge: () => {
      const { presentToday } = getState();
      return presentToday.length > 0 ? presentToday.length : '';
    },
    badgeColor: 'green',
  },
  {
    id: 'equipages', icon: '🚗', label: 'Constitution\ndes Équipages',
    route: '/equipages', color: 'blue', category: 'journee',
    roles: ['responsable'],
    badge: () => {
      const { crewAssignments } = getState();
      const count = Object.values(crewAssignments).filter(m => m && m.length > 0).length;
      return count > 0 ? count : '';
    },
    badgeColor: 'purple',
  },
  // --- LOGISTIQUE & ORGANISATION ---
  {
    id: 'stock', icon: '📦', label: 'Stock Armes\n& Munitions',
    route: '/stock', color: 'green', category: 'logorg',
    roles: ['responsable'],
  },
  {
    id: 'planning', icon: '📅', label: 'Planning',
    route: '/planning', color: 'green', category: 'logorg',
    roles: ['responsable'],
  },
  // --- DOCUMENTS ---
  {
    id: 'pv', icon: '📋', label: 'Procès-\nVerbaux',
    route: '/pv', color: 'orange', category: 'documents',
    roles: ['responsable'],
  },
  {
    id: 'vocal', icon: '🎙️', label: 'Comptes-rendus\nde mission',
    route: '/vocal', color: 'orange', category: 'documents',
    roles: ['responsable', 'agent'],
  },
  // --- SUIVI & ADMIN ---
  {
    id: 'audit', icon: '🛡️', label: 'Audit &\nIncidents',
    route: '/audit', color: 'slate', category: 'admin',
    roles: ['responsable'],
  },
  {
    id: 'config', icon: '⚙️', label: 'Config',
    route: '/config', color: 'slate', category: 'admin',
    roles: ['responsable'],
  },
];

const CATEGORIES = [
  { id: 'journee',   label: 'Opérations du jour',        color: 'blue' },
  { id: 'logorg',    label: 'Logistique & Organisation',  color: 'green' },
  { id: 'documents', label: 'Documents',                  color: 'orange' },
  { id: 'admin',     label: 'Suivi & Administration',     color: 'slate' },
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

  // Générer les catégories
  for (const cat of CATEGORIES) {
    html += renderCategory(cat, isAgent);
  }

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

function renderCategory(cat, isAgent) {
  const tools = TOOLS.filter(t => t.category === cat.id);
  // Si agent et aucun outil visible dans cette catégorie, masquer
  const visibleTools = isAgent ? tools.filter(t => t.roles.includes('agent')) : tools;
  if (visibleTools.length === 0) return '';

  // Colonnes basées sur le nombre total d'outils (les désactivés restent dans la grille)
  const cols = Math.min(3, tools.length);

  let html = `
    <div class="tool-category">
      <div class="tool-category-title tool-category-title--${cat.color}">
        <span class="tool-category-dot tool-category-dot--${cat.color}"></span>
        ${cat.label}
      </div>
      <div class="tool-grid" style="--grid-cols: ${cols}">`;

  for (const tool of tools) {
    const disabled = isAgent && !tool.roles.includes('agent');
    const badgeValue = tool.badge ? tool.badge() : '';
    const badgeColorClass = tool.badgeColor ? ` tool-badge--${tool.badgeColor}` : '';

    html += `
      <a href="#${tool.route}" class="tool-tile tool-tile--${tool.color}${disabled ? ' tool-tile--disabled' : ''}" data-tool="${tool.id}">
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

// =============================================
// Badges live
// =============================================

function updateBadges() {
  for (const tool of TOOLS) {
    if (!tool.badge) continue;
    const el = document.getElementById('homeBadge_' + tool.id);
    if (!el) continue;
    const val = tool.badge();
    el.textContent = val;
    el.dataset.count = val || '0';
    el.style.display = val !== '' ? '' : 'none';
  }
}

function updateChatBadge() {
  const el = document.getElementById('homeChatBadge');
  if (!el) return;
  // Pour l'instant on ne compte pas les non-lus (sera ajouté plus tard)
  // On pourrait utiliser chatMessages.length comme indicateur
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

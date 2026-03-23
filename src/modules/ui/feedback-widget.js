// =============================================
// feedback-widget.js — Composant réutilisable de feedback client
// Bouton flottant + drawer de commentaires par page
// =============================================

import { getCurrentPath } from '../router.js';

const STORAGE_KEY = 'feedback_comments';

// =============================================
// Page label mapping
// =============================================

const PAGE_LABELS = {
  '/': 'Tableau de bord',
  '/planning': 'Planning',
  '/presence': 'Présence',
  '/registre': 'Registre',
  '/equipages': 'Équipages',
  '/stock': 'Stock & Armement',
  '/pv': 'Procès-Verbaux',
  '/vocal': 'Comptes-rendus',
  '/config': 'Configuration',
  '/audit': 'Audit & Incidents',
  '/chat': 'Chat d\'équipe',
};

const COMMENT_TYPES = [
  { value: 'ajout', label: 'Ajout souhaité' },
  { value: 'modification', label: 'Modification souhaitée' },
  { value: 'bug', label: 'Bug constaté' },
  { value: 'remarque', label: 'Remarque générale' },
];

// =============================================
// Storage helpers (localStorage)
// =============================================

function getAllComments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveComment(comment) {
  const all = getAllComments();
  all.push(comment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function getCommentsForPage(page) {
  return getAllComments().filter(c => c.page === page);
}

function clearAllComments() {
  localStorage.removeItem(STORAGE_KEY);
}

// Public: export for recap page
export { getAllComments, getCommentsForPage, clearAllComments };

// =============================================
// Widget state
// =============================================

let _isOpen = false;
let _fabEl = null;
let _drawerEl = null;
let _overlayEl = null;

// =============================================
// Mount / Unmount
// =============================================

/**
 * Mount the feedback widget (call after each page mount)
 * Automatically detects current page from the router.
 */
export function mountFeedbackWidget() {
  unmountFeedbackWidget();

  const page = getCurrentPath();
  // Don't show on the feedback recap page itself
  if (page === '/feedback') return;

  const pageLabel = PAGE_LABELS[page] || page;
  const count = getCommentsForPage(page).length;

  // FAB button
  _fabEl = document.createElement('button');
  _fabEl.className = 'feedback-fab';
  _fabEl.setAttribute('aria-label', 'Ouvrir les commentaires');
  _fabEl.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
    <span>Avis / Remarques</span>
    <span class="feedback-fab-badge" id="feedbackBadge">${count || ''}</span>
  `;
  _fabEl.addEventListener('click', () => toggleDrawer(page, pageLabel));

  // Overlay
  _overlayEl = document.createElement('div');
  _overlayEl.className = 'feedback-overlay';
  _overlayEl.addEventListener('click', closeDrawer);

  // Drawer
  _drawerEl = document.createElement('div');
  _drawerEl.className = 'feedback-drawer';
  _drawerEl.innerHTML = getDrawerHTML(page, pageLabel);

  document.body.appendChild(_overlayEl);
  document.body.appendChild(_drawerEl);
  document.body.appendChild(_fabEl);

  bindDrawerEvents(page, pageLabel);
}

/**
 * Unmount the feedback widget (call before page unmount)
 */
export function unmountFeedbackWidget() {
  _isOpen = false;
  if (_fabEl) { _fabEl.remove(); _fabEl = null; }
  if (_drawerEl) { _drawerEl.remove(); _drawerEl = null; }
  if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
}

// =============================================
// Drawer HTML
// =============================================

function getDrawerHTML(page, pageLabel) {
  const comments = getCommentsForPage(page);
  const typeOptions = COMMENT_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('');

  let listHTML = '';
  if (comments.length === 0) {
    listHTML = '<div class="feedback-list-empty">Aucun commentaire sur cette page.</div>';
  } else {
    listHTML = comments
      .sort((a, b) => b.date - a.date)
      .map(c => getCommentItemHTML(c))
      .join('');
  }

  return `
    <div class="feedback-drawer-header">
      <span class="feedback-drawer-title">Commentaires — ${pageLabel}</span>
      <button class="feedback-drawer-close" id="feedbackClose" aria-label="Fermer">&times;</button>
    </div>
    <div class="feedback-form">
      <textarea id="feedbackMessage" placeholder="Votre commentaire..." rows="3"></textarea>
      <select id="feedbackType">${typeOptions}</select>
      <div class="feedback-form-actions">
        <button class="feedback-submit-btn" id="feedbackSubmit">Envoyer</button>
      </div>
    </div>
    <div class="feedback-list" id="feedbackList">${listHTML}</div>
  `;
}

function getCommentItemHTML(c) {
  const typeInfo = COMMENT_TYPES.find(t => t.value === c.type) || COMMENT_TYPES[3];
  const dateStr = new Date(c.date).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `
    <div class="feedback-item">
      <div class="feedback-item-header">
        <span class="feedback-item-type feedback-type-${c.type}">${typeInfo.label}</span>
        <span class="feedback-item-date">${dateStr}</span>
      </div>
      <div class="feedback-item-message">${escapeHTML(c.message)}</div>
    </div>
  `;
}

// =============================================
// Drawer events
// =============================================

function bindDrawerEvents(page, pageLabel) {
  const closeBtn = _drawerEl.querySelector('#feedbackClose');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  const submitBtn = _drawerEl.querySelector('#feedbackSubmit');
  if (submitBtn) submitBtn.addEventListener('click', () => handleSubmit(page, pageLabel));

  // Enter key submits
  const textarea = _drawerEl.querySelector('#feedbackMessage');
  if (textarea) {
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit(page, pageLabel);
      }
    });
  }
}

function handleSubmit(page, pageLabel) {
  const msgEl = _drawerEl.querySelector('#feedbackMessage');
  const typeEl = _drawerEl.querySelector('#feedbackType');
  const message = msgEl.value.trim();
  if (!message) return;

  const comment = {
    page,
    pageLabel: PAGE_LABELS[page] || page,
    type: typeEl.value,
    message,
    date: Date.now(),
  };

  saveComment(comment);

  // Reset form
  msgEl.value = '';

  // Re-render list
  refreshList(page);

  // Update badge
  updateBadge(page);
}

function refreshList(page) {
  const listEl = _drawerEl.querySelector('#feedbackList');
  if (!listEl) return;
  const comments = getCommentsForPage(page);
  if (comments.length === 0) {
    listEl.innerHTML = '<div class="feedback-list-empty">Aucun commentaire sur cette page.</div>';
  } else {
    listEl.innerHTML = comments
      .sort((a, b) => b.date - a.date)
      .map(c => getCommentItemHTML(c))
      .join('');
  }
}

function updateBadge(page) {
  const badge = document.getElementById('feedbackBadge');
  if (!badge) return;
  const count = getCommentsForPage(page).length;
  badge.textContent = count || '';
}

// =============================================
// Toggle / Open / Close
// =============================================

function toggleDrawer(page, pageLabel) {
  if (_isOpen) {
    closeDrawer();
  } else {
    openDrawer(page, pageLabel);
  }
}

function openDrawer(page, pageLabel) {
  if (!_drawerEl || !_overlayEl) return;
  // Refresh content
  _drawerEl.innerHTML = getDrawerHTML(page, pageLabel);
  bindDrawerEvents(page, pageLabel);
  _drawerEl.classList.add('open');
  _overlayEl.classList.add('open');
  _isOpen = true;
  // Focus textarea
  setTimeout(() => {
    const ta = _drawerEl.querySelector('#feedbackMessage');
    if (ta) ta.focus();
  }, 300);
}

function closeDrawer() {
  if (_drawerEl) _drawerEl.classList.remove('open');
  if (_overlayEl) _overlayEl.classList.remove('open');
  _isOpen = false;
}

// =============================================
// Utilities
// =============================================

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

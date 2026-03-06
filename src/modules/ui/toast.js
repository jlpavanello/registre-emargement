// =============================================
// toast.js — Système de notifications toast
// =============================================

let _container = null;

function ensureContainer() {
  if (_container && document.body.contains(_container)) return _container;
  _container = document.createElement('div');
  _container.className = 'toast-container';
  document.body.appendChild(_container);
  return _container;
}

const ICONS = {
  success: '\u2705',
  error: '\u274C',
  warning: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
};

/**
 * Affiche une notification toast
 * @param {string} message - Le texte du toast
 * @param {'success'|'error'|'warning'|'info'} type - Le type de toast
 * @param {number} duration - Durée d'affichage en ms (défaut: 3000)
 */
export function showToast(message, type = 'success', duration = 3000) {
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast-text">${message}</span>
  `;
  container.appendChild(toast);

  // Auto-remove after duration
  const timer = setTimeout(() => removeToast(toast), duration);

  // Click to dismiss
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    removeToast(toast);
  });
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// =============================================
// toast.js — Notifications toast légères
// Auto-injecte son CSS au premier appel
// =============================================

let _injected = false;

function injectStyles() {
  if (_injected) return;
  const style = document.createElement('style');
  style.textContent = `
    .toast-container {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      pointer-events: none;
      width: 90%;
      max-width: 360px;
    }
    .toast {
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      animation: toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      line-height: 1.3;
    }
    .toast--success { background: #166534; color: white; }
    .toast--error   { background: #dc2626; color: white; }
    .toast--info    { background: #1e40af; color: white; }
    .toast--exit {
      animation: toastSlideOut 0.25s ease-in forwards;
    }
    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateY(16px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(16px); }
    }
  `;
  document.head.appendChild(style);
  _injected = true;
}

function getContainer() {
  let c = document.querySelector('.toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

const ICONS = { success: '✅', error: '❌', info: 'ℹ️' };

/**
 * Affiche un toast de notification
 * @param {string} message — texte à afficher
 * @param {'success'|'error'|'info'} type — couleur du toast
 * @param {number} duration — durée en ms avant disparition
 */
export function showToast(message, type = 'success', duration = 2500) {
  injectStyles();
  const container = getContainer();

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span>${ICONS[type] || ''}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast--exit');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

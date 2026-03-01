// =============================================
// confirm-dialog.js — Boîte de confirmation touch-friendly
// Remplace confirm() natif. Promise-based.
// =============================================

let _injected = false;

function injectStyles() {
  if (_injected) return;
  const style = document.createElement('style');
  style.textContent = `
    .confirm-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: confirmFadeIn 0.2s ease;
    }
    .confirm-dialog {
      background: white; border-radius: 18px;
      width: 100%; max-width: 340px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: confirmScaleIn 0.25s cubic-bezier(0.16,1,0.3,1);
      overflow: hidden;
    }
    .confirm-body {
      padding: 24px 20px 16px;
    }
    .confirm-title {
      font-size: 16px; font-weight: 800;
      color: #0f172a; margin-bottom: 8px;
    }
    .confirm-message {
      font-size: 13px; font-weight: 500;
      color: #64748b; line-height: 1.5;
    }
    .confirm-type-area {
      margin-top: 14px;
    }
    .confirm-type-label {
      font-size: 11px; font-weight: 600; color: #94a3b8;
      margin-bottom: 6px;
    }
    .confirm-type-input {
      width: 100%; padding: 10px 14px;
      border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; font-family: inherit;
      outline: none; transition: border-color 0.15s;
    }
    .confirm-type-input:focus {
      border-color: #3b82f6;
    }
    .confirm-actions {
      display: flex; gap: 0;
      border-top: 1px solid #f1f5f9;
    }
    .confirm-btn {
      flex: 1; padding: 16px; border: none;
      font-size: 14px; font-weight: 700;
      font-family: inherit; cursor: pointer;
      min-height: 52px; transition: background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .confirm-btn--cancel {
      background: white; color: #64748b;
      border-right: 1px solid #f1f5f9;
      border-radius: 0 0 0 18px;
    }
    .confirm-btn--cancel:active { background: #f8fafc; }
    .confirm-btn--confirm {
      background: white; color: #2563eb;
      border-radius: 0 0 18px 0;
    }
    .confirm-btn--confirm:active { background: #f0f7ff; }
    .confirm-btn--danger {
      color: #dc2626;
    }
    .confirm-btn--danger:active { background: #fef2f2; }
    .confirm-btn:disabled {
      opacity: 0.35; cursor: not-allowed;
    }
    @keyframes confirmFadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes confirmScaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  _injected = true;
}

/**
 * Affiche une boîte de confirmation modale
 * @param {Object} opts
 * @param {string} opts.title — titre de la dialog
 * @param {string} opts.message — message explicatif
 * @param {string} [opts.confirmText='Confirmer'] — texte du bouton confirmer
 * @param {string} [opts.cancelText='Annuler'] — texte du bouton annuler
 * @param {boolean} [opts.danger=false] — bouton confirmer en rouge
 * @param {string|null} [opts.requireType=null] — si défini, l'utilisateur doit taper ce texte
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  title = 'Confirmer',
  message = '',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  danger = false,
  requireType = null,
} = {}) {
  injectStyles();

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const typeHtml = requireType ? `
      <div class="confirm-type-area">
        <div class="confirm-type-label">Tapez « ${requireType} » pour confirmer :</div>
        <input type="text" class="confirm-type-input" id="confirmTypeInput" autocomplete="off" spellcheck="false">
      </div>` : '';

    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-body">
          <div class="confirm-title">${title}</div>
          <div class="confirm-message">${message}</div>
          ${typeHtml}
        </div>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--cancel" id="confirmCancel">${cancelText}</button>
          <button class="confirm-btn confirm-btn--confirm ${danger ? 'confirm-btn--danger' : ''}"
                  id="confirmOk" ${requireType ? 'disabled' : ''}>${confirmText}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const btnOk = overlay.querySelector('#confirmOk');
    const btnCancel = overlay.querySelector('#confirmCancel');
    const typeInput = overlay.querySelector('#confirmTypeInput');

    function close(result) {
      overlay.remove();
      resolve(result);
    }

    btnOk.addEventListener('click', () => close(true));
    btnCancel.addEventListener('click', () => close(false));

    // Fermer sur clic en dehors du dialog
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    // Type-to-confirm
    if (typeInput && requireType) {
      typeInput.addEventListener('input', () => {
        btnOk.disabled = typeInput.value.trim() !== requireType;
      });
      typeInput.focus();
    }

    // Fermer avec Escape
    function onKey(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        close(false);
      }
    }
    document.addEventListener('keydown', onKey);
  });
}

// =============================================
// feedback-page.js — Page récapitulative Feedback Client
// Affiche tous les commentaires groupés par page
// =============================================

import { getAllComments, clearAllComments } from '../ui/feedback-widget.js';
import { showConfirm } from '../utils/confirm-dialog.js';

const COMMENT_TYPES = {
  ajout: 'Ajout souhaité',
  modification: 'Modification souhaitée',
  bug: 'Bug constaté',
  remarque: 'Remarque générale',
};

export const feedbackPage = {
  title: 'Feedback Client',

  mount(container) {
    this._container = container;
    container.innerHTML = getPageHTML();
    bindEvents(container);
  },

  unmount() {},
};

function getPageHTML() {
  const comments = getAllComments().sort((a, b) => b.date - a.date);

  // Group by page
  const grouped = {};
  for (const c of comments) {
    const key = c.pageLabel || c.page;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }

  let contentHTML = '';
  if (comments.length === 0) {
    contentHTML = '<div class="feedback-recap-empty">Aucun commentaire pour le moment.</div>';
  } else {
    for (const [pageLabel, items] of Object.entries(grouped)) {
      contentHTML += `
        <div class="feedback-recap-group">
          <div class="feedback-recap-group-title">${escapeHTML(pageLabel)} (${items.length})</div>
          ${items.map(c => getItemHTML(c)).join('')}
        </div>
      `;
    }
  }

  return `
    <div class="feedback-recap">
      <div class="feedback-recap-header">
        <h2>Feedback Client</h2>
        <div class="feedback-recap-actions">
          <button id="feedbackCopyAll">Copier tout</button>
          <button id="feedbackExportCSV">Exporter CSV</button>
          <button id="feedbackClearAll" class="feedback-btn-danger">Vider tous les commentaires</button>
        </div>
      </div>
      ${contentHTML}
    </div>
  `;
}

function getItemHTML(c) {
  const typeLabel = COMMENT_TYPES[c.type] || c.type;
  const dateStr = new Date(c.date).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  return `
    <div class="feedback-item">
      <div class="feedback-item-header">
        <span class="feedback-item-type feedback-type-${c.type}">${typeLabel}</span>
        <span class="feedback-item-date">${dateStr}</span>
      </div>
      <div class="feedback-item-message">${escapeHTML(c.message)}</div>
    </div>
  `;
}

function bindEvents(container) {
  const copyBtn = document.getElementById('feedbackCopyAll');
  if (copyBtn) copyBtn.addEventListener('click', handleCopyAll);

  const csvBtn = document.getElementById('feedbackExportCSV');
  if (csvBtn) csvBtn.addEventListener('click', handleExportCSV);

  const clearBtn = document.getElementById('feedbackClearAll');
  if (clearBtn) clearBtn.addEventListener('click', () => handleClearAll(container));
}

function handleCopyAll() {
  const comments = getAllComments().sort((a, b) => b.date - a.date);
  if (comments.length === 0) return;

  const lines = comments.map(c => {
    const date = new Date(c.date).toLocaleString('fr-FR');
    const typeLabel = COMMENT_TYPES[c.type] || c.type;
    return `[${c.pageLabel || c.page}] [${typeLabel}] ${date}\n${c.message}`;
  });

  navigator.clipboard.writeText(lines.join('\n\n---\n\n')).then(() => {
    const btn = document.getElementById('feedbackCopyAll');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copié !';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  });
}

function handleExportCSV() {
  const comments = getAllComments().sort((a, b) => b.date - a.date);
  if (comments.length === 0) return;

  const header = 'Page;Type;Date;Message';
  const rows = comments.map(c => {
    const date = new Date(c.date).toLocaleString('fr-FR');
    const typeLabel = COMMENT_TYPES[c.type] || c.type;
    const msg = c.message.replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${c.pageLabel || c.page}";"${typeLabel}";"${date}";"${msg}"`;
  });

  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feedback_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleClearAll(container) {
  const count = getAllComments().length;
  if (count === 0) return;

  const confirmed = await showConfirm({
    title: 'Vider tous les commentaires',
    message: `Vous allez supprimer définitivement ${count} commentaire${count > 1 ? 's' : ''} de toutes les pages. Cette action est irréversible.`,
    confirmText: 'Supprimer tout',
    cancelText: 'Annuler',
    danger: true,
  });

  if (!confirmed) return;

  clearAllComments();
  container.innerHTML = getPageHTML();
  bindEvents(container);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

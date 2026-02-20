// PV — Mes PV tab (list of saved/filled PV documents)
import { getAllDocuments, getDocumentsByStatut, deletePvDocument, getDocumentProgress } from '../domains/pv-documents.js';
import { openEditor } from './pv-panel.js';
import { generatePvPDF } from '../actions/pv-pdf.js';

let _statusFilter = 'tous';

export function renderMesPvTab(container) {
  const documents = getDocumentsByStatut(_statusFilter);

  let html = '';

  // Status filter buttons
  html += `<div class="pv-filters">
    <button class="pv-filter ${_statusFilter === 'tous' ? 'active' : ''}" data-statut="tous">Tous</button>
    <button class="pv-filter ${_statusFilter === 'brouillon' ? 'active' : ''}" data-statut="brouillon">Brouillons</button>
    <button class="pv-filter ${_statusFilter === 'complet' ? 'active' : ''}" data-statut="complet">Complets</button>
    <button class="pv-filter ${_statusFilter === 'imprime' ? 'active' : ''}" data-statut="imprime">Imprim\u00e9s</button>
  </div>`;

  if (documents.length === 0) {
    html += `<div class="pv-empty">
      <div class="pv-empty-icon">\uD83D\uDCCB</div>
      <div>Aucun PV enregistr\u00e9${_statusFilter !== 'tous' ? ' avec ce statut' : ''}.</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text3);">Cr\u00e9ez un PV depuis l'onglet <strong>Mod\u00e8les</strong>.</div>
    </div>`;
  } else {
    documents.forEach(doc => {
      const progress = getDocumentProgress(doc.id);
      const statutBadge = {
        brouillon: '<span class="pv-statut-badge brouillon">Brouillon</span>',
        complet: '<span class="pv-statut-badge complet">Complet</span>',
        imprime: '<span class="pv-statut-badge imprime">Imprim\u00e9</span>',
      };
      html += `<div class="pv-doc-card" data-id="${doc.id}">
        <div class="pv-doc-header">
          <div class="pv-doc-numero">${doc.numero}</div>
          ${statutBadge[doc.statut] || ''}
        </div>
        <div class="pv-doc-type">${doc.templateRef} \u2014 ${doc.templateNom}</div>
        <div class="pv-doc-date">Cr\u00e9\u00e9 le ${doc.dateCreation}${doc.dateModification ? ' \u00b7 Modifi\u00e9 le ' + new Date(doc.dateModification).toLocaleDateString('fr-FR') : ''}</div>
        <div class="pv-doc-progress">
          <div class="pv-progress-bar"><div class="pv-progress-fill" style="width:${progress.percent}%"></div></div>
          <span class="pv-progress-text">${progress.filled}/${progress.total} champs (${progress.percent}%)</span>
        </div>
        <div class="pv-doc-actions">
          <button class="pv-btn-action pv-btn-edit" data-id="${doc.id}">Ouvrir</button>
          <button class="pv-btn-action pv-btn-pdf" data-id="${doc.id}">PDF</button>
          <button class="pv-btn-action pv-btn-delete" data-id="${doc.id}">Supprimer</button>
        </div>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Event listeners
  container.querySelectorAll('.pv-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      _statusFilter = btn.dataset.statut;
      renderMesPvTab(container);
    });
  });

  container.querySelectorAll('.pv-btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor(btn.dataset.id);
    });
  });

  container.querySelectorAll('.pv-btn-pdf').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      generatePvPDF(btn.dataset.id);
    });
  });

  container.querySelectorAll('.pv-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Supprimer ce PV ? Cette action est irr\u00e9versible.')) {
        deletePvDocument(btn.dataset.id);
        renderMesPvTab(container);
      }
    });
  });
}

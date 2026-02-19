// Stock — Onglet Commandes / Devis
import { getState } from '../state.js';
import { createCommande, updateCommande, addLigne, removeLigne, changeStatut, deleteCommande, getCommandeById } from '../domains/commandes.js';
import { generateOrderPDF } from '../actions/stock-pdf.js';

let _filter = 'devis';

export function renderCommandesTab(container) {
  const { commandes, fournisseurs } = getState();

  const filtered = commandes.filter(c => c.type === _filter);

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div style="display:flex;gap:4px;">
      <button class="stock-tab ${_filter === 'devis' ? 'active' : ''}" id="btnFilterDevis">Devis</button>
      <button class="stock-tab ${_filter === 'commande' ? 'active' : ''}" id="btnFilterCommande">Commandes</button>
    </div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnNewCommande">+ ${_filter === 'devis' ? 'Nouveau devis' : 'Nouvelle commande'}</button>
  </div>`;

  html += `<div id="commandeForm" style="display:none;margin-bottom:12px;"></div>`;

  if (filtered.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">${_filter === 'devis' ? '📋' : '📦'}</div>
      <div>Aucun ${_filter} pour le moment.</div>
    </div>`;
  } else {
    filtered.forEach(c => {
      const statusLabels = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', livre: 'Livré' };
      html += `<div class="commande-card" data-cmd-id="${c.id}">
        <div class="commande-header">
          <div>
            <div class="commande-numero">${c.numero}</div>
            <div style="font-size:11px;color:var(--text3);">${c.date}</div>
          </div>
          <div class="commande-status ${c.statut}">${statusLabels[c.statut] || c.statut}</div>
        </div>
        <div class="commande-fournisseur">${c.fournisseurNom || 'Fournisseur non défini'}</div>
        ${c.lignes.length > 0 ? `
          <table class="ligne-table">
            <thead><tr><th>Désignation</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead>
            <tbody>${c.lignes.map((l, li) => `<tr>
              <td>${l.designation}</td><td>${l.quantite}</td><td>${l.prixUnitaire.toFixed(2)}€</td><td>${l.total.toFixed(2)}€</td>
            </tr>`).join('')}</tbody>
          </table>
          <div class="ligne-total"><span>Total HT</span><span>${c.totalHT.toFixed(2)}€</span></div>
          <div class="ligne-total"><span>TVA ${c.tva}%</span><span>${(c.totalTTC - c.totalHT).toFixed(2)}€</span></div>
          <div class="ligne-total ttc"><span>Total TTC</span><span>${c.totalTTC.toFixed(2)}€</span></div>
        ` : '<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">Aucune ligne</div>'}
        ${c.notes ? `<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">📝 ${c.notes}</div>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-cmd-edit" data-id="${c.id}">✏️ Lignes</button>
          <button class="stock-btn stock-btn-primary stock-btn-sm btn-cmd-pdf" data-id="${c.id}">📄 PDF</button>
          ${c.statut === 'brouillon' ? `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="envoye" style="background:#dbeafe;color:#1e40af;">→ Envoyé</button>` : ''}
          ${c.statut === 'envoye' ? `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="accepte" style="background:#dcfce7;color:#166534;">→ Accepté</button>` : ''}
          ${c.statut === 'accepte' ? `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="livre" style="background:#f0fdf4;color:#14532d;">→ Livré</button>` : ''}
          <button class="stock-btn stock-btn-danger stock-btn-sm btn-cmd-delete" data-id="${c.id}">🗑️</button>
        </div>
        <div id="cmdAction_${c.id}" style="display:none;margin-top:10px;"></div>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Filter buttons
  document.getElementById('btnFilterDevis')?.addEventListener('click', () => { _filter = 'devis'; renderCommandesTab(container); });
  document.getElementById('btnFilterCommande')?.addEventListener('click', () => { _filter = 'commande'; renderCommandesTab(container); });

  // New commande
  document.getElementById('btnNewCommande')?.addEventListener('click', () => showCommandeForm(container));

  // Edit lines
  container.querySelectorAll('.btn-cmd-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditLignes(container, btn.dataset.id));
  });

  // PDF
  container.querySelectorAll('.btn-cmd-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCommandeById(btn.dataset.id);
      if (c) generateOrderPDF(c);
    });
  });

  // Status change
  container.querySelectorAll('.btn-cmd-status').forEach(btn => {
    btn.addEventListener('click', () => {
      changeStatut(btn.dataset.id, btn.dataset.status);
      renderCommandesTab(container);
    });
  });

  // Delete
  container.querySelectorAll('.btn-cmd-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer ce document ?')) return;
      deleteCommande(btn.dataset.id);
      renderCommandesTab(container);
    });
  });
}

function showCommandeForm(container) {
  const { fournisseurs } = getState();
  const form = document.getElementById('commandeForm');
  if (!form) return;

  const fourOpts = fournisseurs.map(f => `<option value="${f.id}" data-nom="${f.nom}">${f.nom}</option>`).join('');

  form.style.display = 'block';
  form.innerHTML = `
    <div class="stock-card">
      <div class="stock-field"><label>Fournisseur</label>
        <select id="cmdFournisseur">
          <option value="">— Choisir un fournisseur —</option>
          ${fourOpts}
        </select>
      </div>
      <div class="stock-field"><label>Notes</label>
        <textarea id="cmdNotes" rows="2" placeholder="Notes internes..."></textarea>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="stock-btn stock-btn-primary" id="cmdConfirm">Créer</button>
        <button class="stock-btn stock-btn-secondary" id="cmdCancel">Annuler</button>
      </div>
    </div>`;

  document.getElementById('cmdConfirm')?.addEventListener('click', () => {
    const select = document.getElementById('cmdFournisseur');
    const fournisseurId = select.value;
    const fournisseurNom = select.selectedOptions[0]?.dataset?.nom || '';
    const notes = document.getElementById('cmdNotes').value;
    createCommande({ type: _filter, fournisseurId, fournisseurNom, notes });
    renderCommandesTab(container);
  });
  document.getElementById('cmdCancel')?.addEventListener('click', () => { form.style.display = 'none'; });
}

function showEditLignes(container, commandeId) {
  const c = getCommandeById(commandeId);
  if (!c) return;
  const area = document.getElementById(`cmdAction_${commandeId}`);
  if (!area) return;

  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-section-title" style="padding-top:0;">Ajouter une ligne</div>
    <div class="stock-field"><label>Désignation</label><input type="text" id="ligneDesign_${commandeId}" placeholder="Ex: Cartouches 9mm"></div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Quantité</label><input type="number" id="ligneQty_${commandeId}" value="1" min="1" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Prix unitaire (€)</label><input type="number" id="lignePrix_${commandeId}" value="0" step="0.01" min="0" inputmode="decimal"></div>
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="ligneAdd_${commandeId}">Ajouter la ligne</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="ligneClose_${commandeId}">Fermer</button>
    </div>`;

  document.getElementById(`ligneAdd_${commandeId}`).addEventListener('click', () => {
    const designation = document.getElementById(`ligneDesign_${commandeId}`).value.trim();
    if (!designation) { alert('Veuillez saisir une désignation'); return; }
    const quantite = parseInt(document.getElementById(`ligneQty_${commandeId}`).value) || 1;
    const prixUnitaire = parseFloat(document.getElementById(`lignePrix_${commandeId}`).value) || 0;
    addLigne(commandeId, { designation, quantite, prixUnitaire });
    renderCommandesTab(container);
  });
  document.getElementById(`ligneClose_${commandeId}`).addEventListener('click', () => { area.style.display = 'none'; });
}

// Stock — Onglet Fournisseurs
import { getState } from '../state.js';
import { addFournisseur, updateFournisseur, deleteFournisseur, addProduit, updateProduit, deleteProduit } from '../domains/fournisseurs.js';

export function renderFournisseursTab(container) {
  const { fournisseurs } = getState();

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div class="stock-section-title">🏪 Fournisseurs</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddFournisseur">+ Ajouter</button>
  </div>`;

  html += `<div id="fournisseurForm" style="display:none;margin-bottom:12px;"></div>`;

  if (fournisseurs.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">🏪</div>
      <div>Aucun fournisseur enregistré.</div>
      <div style="margin-top:8px;">Ajoutez vos fournisseurs pour gérer les devis et commandes.</div>
    </div>`;
  } else {
    fournisseurs.forEach(f => {
      html += `<div class="fournisseur-card" data-fournisseur-id="${f.id}">
        <div class="fournisseur-header">
          <div>
            <div class="fournisseur-nom">${f.nom}</div>
            <div class="fournisseur-contact">${[f.contact, f.telephone, f.email].filter(Boolean).join(' · ') || 'Aucun contact'}</div>
            ${f.adresse ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;">📍 ${f.adresse}</div>` : ''}
            ${f.notes ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;font-style:italic;">${f.notes}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-four-edit" data-id="${f.id}">✏️</button>
            <button class="stock-btn stock-btn-danger stock-btn-sm btn-four-delete" data-id="${f.id}">🗑️</button>
          </div>
        </div>
        <div class="fournisseur-produits">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text2);">Catalogue (${f.produits.length} produit${f.produits.length > 1 ? 's' : ''})</span>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prod-add" data-fid="${f.id}" style="padding:4px 8px;font-size:10px;">+ Produit</button>
          </div>
          ${f.produits.length === 0 ? `<div style="font-size:11px;color:var(--text3);font-style:italic;">Aucun produit dans le catalogue</div>` : ''}
          ${f.produits.map(p => `
            <div class="produit-item">
              <div>
                <div class="produit-nom">${p.designation}</div>
                <div style="font-size:10px;color:var(--text3);">${p.conditionnement || ''}${p.delaiJours ? ' · Délai: ' + p.delaiJours + 'j' : ''}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <div class="produit-prix">${p.prixUnitaire.toFixed(2)}€</div>
                <button class="stock-btn stock-btn-danger stock-btn-sm btn-prod-delete" data-fid="${f.id}" data-pid="${p.id}" style="padding:2px 6px;font-size:10px;">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div id="fourAction_${f.id}" style="display:none;margin-top:10px;"></div>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Add fournisseur
  document.getElementById('btnAddFournisseur')?.addEventListener('click', () => {
    showFournisseurForm(container);
  });

  // Edit fournisseur
  container.querySelectorAll('.btn-four-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditFournisseur(container, btn.dataset.id));
  });

  // Delete fournisseur
  container.querySelectorAll('.btn-four-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer ce fournisseur et son catalogue ?')) return;
      deleteFournisseur(btn.dataset.id);
      renderFournisseursTab(container);
    });
  });

  // Add produit
  container.querySelectorAll('.btn-prod-add').forEach(btn => {
    btn.addEventListener('click', () => showAddProduit(container, btn.dataset.fid));
  });

  // Delete produit
  container.querySelectorAll('.btn-prod-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteProduit(btn.dataset.fid, btn.dataset.pid);
      renderFournisseursTab(container);
    });
  });
}

function showFournisseurForm(container) {
  const form = document.getElementById('fournisseurForm');
  if (!form) return;
  form.style.display = 'block';
  form.innerHTML = `
    <div class="stock-card">
      <div class="stock-field"><label>Nom</label><input type="text" id="fourNom" placeholder="Nom du fournisseur"></div>
      <div class="stock-field"><label>Contact</label><input type="text" id="fourContact" placeholder="Nom du contact"></div>
      <div class="stock-field"><label>Téléphone</label><input type="tel" id="fourTel" placeholder="06 12 34 56 78"></div>
      <div class="stock-field"><label>Email</label><input type="email" id="fourEmail" placeholder="contact@fournisseur.fr"></div>
      <div class="stock-field"><label>Adresse</label><input type="text" id="fourAdresse" placeholder="Adresse postale"></div>
      <div class="stock-field"><label>Notes</label><textarea id="fourNotes" rows="2" placeholder="Notes..."></textarea></div>
      <div style="display:flex;gap:6px;">
        <button class="stock-btn stock-btn-primary" id="fourConfirm">Ajouter</button>
        <button class="stock-btn stock-btn-secondary" id="fourCancel">Annuler</button>
      </div>
    </div>`;

  document.getElementById('fourConfirm').addEventListener('click', () => {
    const nom = document.getElementById('fourNom').value.trim();
    if (!nom) { alert('Veuillez saisir un nom'); return; }
    addFournisseur({
      nom,
      contact: document.getElementById('fourContact').value,
      telephone: document.getElementById('fourTel').value,
      email: document.getElementById('fourEmail').value,
      adresse: document.getElementById('fourAdresse').value,
      notes: document.getElementById('fourNotes').value,
    });
    renderFournisseursTab(container);
  });
  document.getElementById('fourCancel').addEventListener('click', () => { form.style.display = 'none'; });
}

function showEditFournisseur(container, id) {
  const { fournisseurs } = getState();
  const f = fournisseurs.find(f => f.id === id);
  if (!f) return;
  const area = document.getElementById(`fourAction_${id}`);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Nom</label><input type="text" id="fourEditNom_${id}" value="${f.nom}"></div>
    <div class="stock-field"><label>Contact</label><input type="text" id="fourEditContact_${id}" value="${f.contact || ''}"></div>
    <div class="stock-field"><label>Téléphone</label><input type="tel" id="fourEditTel_${id}" value="${f.telephone || ''}"></div>
    <div class="stock-field"><label>Email</label><input type="email" id="fourEditEmail_${id}" value="${f.email || ''}"></div>
    <div class="stock-field"><label>Adresse</label><input type="text" id="fourEditAdresse_${id}" value="${f.adresse || ''}"></div>
    <div class="stock-field"><label>Notes</label><textarea id="fourEditNotes_${id}" rows="2">${f.notes || ''}</textarea></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="fourEditConfirm_${id}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="fourEditCancel_${id}">Annuler</button>
    </div>`;

  document.getElementById(`fourEditConfirm_${id}`).addEventListener('click', () => {
    updateFournisseur(id, {
      nom: document.getElementById(`fourEditNom_${id}`).value,
      contact: document.getElementById(`fourEditContact_${id}`).value,
      telephone: document.getElementById(`fourEditTel_${id}`).value,
      email: document.getElementById(`fourEditEmail_${id}`).value,
      adresse: document.getElementById(`fourEditAdresse_${id}`).value,
      notes: document.getElementById(`fourEditNotes_${id}`).value,
    });
    renderFournisseursTab(container);
  });
  document.getElementById(`fourEditCancel_${id}`).addEventListener('click', () => { area.style.display = 'none'; });
}

function showAddProduit(container, fournisseurId) {
  const area = document.getElementById(`fourAction_${fournisseurId}`);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Désignation</label><input type="text" id="prodDesign_${fournisseurId}" placeholder="Ex: Cartouches 9mm"></div>
    <div class="stock-field"><label>Prix unitaire (€)</label><input type="number" id="prodPrix_${fournisseurId}" value="0" step="0.01" min="0" inputmode="decimal"></div>
    <div class="stock-field"><label>Conditionnement</label><input type="text" id="prodCond_${fournisseurId}" placeholder="Ex: Boîte de 50"></div>
    <div class="stock-field"><label>Prix boîte (€)</label><input type="number" id="prodPrixBoite_${fournisseurId}" value="0" step="0.01" min="0" inputmode="decimal"></div>
    <div class="stock-field"><label>Délai livraison (jours)</label><input type="number" id="prodDelai_${fournisseurId}" value="0" min="0" inputmode="numeric"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="prodConfirm_${fournisseurId}">Ajouter</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="prodCancel_${fournisseurId}">Annuler</button>
    </div>`;

  document.getElementById(`prodConfirm_${fournisseurId}`).addEventListener('click', () => {
    const designation = document.getElementById(`prodDesign_${fournisseurId}`).value.trim();
    if (!designation) { alert('Veuillez saisir une désignation'); return; }
    addProduit(fournisseurId, {
      designation,
      prixUnitaire: parseFloat(document.getElementById(`prodPrix_${fournisseurId}`).value) || 0,
      conditionnement: document.getElementById(`prodCond_${fournisseurId}`).value,
      prixBoite: parseFloat(document.getElementById(`prodPrixBoite_${fournisseurId}`).value) || 0,
      delaiJours: parseInt(document.getElementById(`prodDelai_${fournisseurId}`).value) || 0,
    });
    renderFournisseursTab(container);
  });
  document.getElementById(`prodCancel_${fournisseurId}`).addEventListener('click', () => { area.style.display = 'none'; });
}

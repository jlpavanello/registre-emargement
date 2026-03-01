// Stock — Onglet Munitions (références de munitions)
// Cartes repliées avec status dots, expand/collapse, suppression protégée
import { getState } from '../state.js';
import {
  addMunitionRef, updateMunitionRef, deleteMunitionRef,
  getMunRefById, getAlertLevelForRef, updateSeuils, saveMunitionRefs,
} from '../domains/stock-munitions.js';
import { logMouvement } from '../domains/stock-mouvements.js';
import { getCatById } from '../domains/categories.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { showConfirm } from '../utils/confirm-dialog.js';

export function renderMunitionsTab(container) {
  const { munitionRefs, machines } = getState();

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <div class="stock-section-title" style="margin:0;">Munitions</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddMunRef">+ Ajouter</button>
  </div>`;

  html += `<div id="munRefCreateArea" style="display:none;"></div>`;

  if (munitionRefs.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">🔫</div>
      <div>Aucune munition enregistrée.</div>
      <div style="margin-top:8px;">Ajoutez vos munitions pour suivre le stock.</div>
    </div>`;
  }

  munitionRefs.forEach(ref => {
    const level = getAlertLevelForRef(ref);
    const pct = ref.seuilAlerte > 0 ? Math.min(100, (ref.stockActuel / (ref.seuilAlerte * 2)) * 100) : (ref.stockActuel > 0 ? 100 : 0);
    const condit = ref.conditionnement || 1;
    const total = ref.stockActuel * condit;
    const uniteRaw = escapeHtml(ref.unite);
    const unitePluriel = total > 1 ? (uniteRaw.endsWith('s') ? uniteRaw : uniteRaw + 's') : uniteRaw;

    // Build weapon chips for details
    let armesHtml = '';
    if (ref.armeIdxList.length === 0) {
      armesHtml = '<span style="font-size:11px;color:var(--text3);font-style:italic;">Aucune arme associée</span>';
    } else {
      ref.armeIdxList.forEach(aIdx => {
        const m = machines[aIdx];
        if (!m || !m.nom) return;
        const cat = m.cat ? getCatById(m.cat) : null;
        const catLabel = cat ? cat.emoji + ' ' : '';
        armesHtml += `<span class="mun-arme-chip">${catLabel}${escapeHtml(m.nom)}</span>`;
      });
    }

    // Calc block for details
    const calcHtml = `<div class="mun-calc-block">
      <div class="mun-calc-row">
        <div class="mun-calc-item">
          <div class="mun-calc-value">${ref.stockActuel}</div>
          <div class="mun-calc-label">${condit > 1 ? 'boîtes' : 'quantité'}</div>
        </div>
        <div class="mun-calc-op">×</div>
        <div class="mun-calc-item">
          <div class="mun-calc-value">${condit}</div>
          <div class="mun-calc-label">${condit > 1 ? 'par boîte' : 'unité'}</div>
        </div>
        <div class="mun-calc-op">=</div>
        <div class="mun-calc-item">
          <div class="mun-calc-value total ${level}">${total}</div>
          <div class="mun-calc-label">${unitePluriel}</div>
        </div>
      </div>
    </div>`;

    // Stock display in summary
    const stockDisplay = condit > 1
      ? `<span class="mun-summary-stock ${level}">${total}<span class="mun-summary-unit">${unitePluriel}</span></span>`
      : `<span class="mun-summary-stock ${level}">${ref.stockActuel}<span class="mun-summary-unit">${unitePluriel}</span></span>`;

    // Calibre subtitle
    const calibreSub = ref.calibre ? escapeHtml(ref.calibre) : '';
    const armeCount = ref.armeIdxList.length;
    const subParts = [calibreSub, `${armeCount} arme${armeCount > 1 ? 's' : ''}`].filter(Boolean);

    html += `<div class="mun-card" data-mun-ref-id="${ref.id}">
      <div class="mun-summary" data-ref-id="${ref.id}">
        <div class="mun-status-dot ${level}"></div>
        <div class="mun-summary-info">
          <div class="mun-summary-name">${escapeHtml(ref.nom)}</div>
          <div class="mun-summary-sub">${subParts.join(' · ')}</div>
        </div>
        ${stockDisplay}
        <button class="stock-btn stock-btn-primary stock-btn-sm btn-mref-appro" data-id="${ref.id}" style="margin-left:6px;">+ Stock</button>
        <span class="mun-summary-chevron">▾</span>
      </div>
      <div class="mun-details">
        ${calcHtml}
        <div style="margin:6px 0 4px;"><span style="font-size:11px;font-weight:600;color:var(--text2);">Armes associées</span></div>
        <div class="mun-armes-row">${armesHtml}</div>
        <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-adjust" data-id="${ref.id}">🔧 Corriger</button>
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-edit" data-id="${ref.id}">✏️ Modifier</button>
        </div>
        <div id="mrefAction_${ref.id}" style="display:none;margin-top:10px;"></div>
      </div>
    </div>`;
  });

  container.innerHTML = html;

  // Bind create button
  document.getElementById('btnAddMunRef').addEventListener('click', () => showCreateForm(container));

  // Expand/collapse on summary click (excluding the "+ Stock" button)
  container.querySelectorAll('.mun-summary').forEach(summary => {
    summary.addEventListener('click', (e) => {
      // Don't toggle if clicking the "+ Stock" button
      if (e.target.closest('.btn-mref-appro')) return;
      const card = summary.closest('.mun-card');
      if (card) card.classList.toggle('mun-card-expanded');
    });
  });

  // Bind action buttons
  container.querySelectorAll('.btn-mref-appro').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Expand the card and show appro form
      const card = btn.closest('.mun-card');
      if (card) card.classList.add('mun-card-expanded');
      showApproForm(container, btn.dataset.id);
    });
  });
  container.querySelectorAll('.btn-mref-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustForm(container, btn.dataset.id));
  });
  container.querySelectorAll('.btn-mref-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditForm(container, btn.dataset.id));
  });
}

// --- Create form ---

function showCreateForm(container) {
  const area = document.getElementById('munRefCreateArea');
  if (!area) return;
  const { machines } = getState();
  area.style.display = 'block';

  let armesChips = '';
  machines.forEach((m, idx) => {
    if (!m.nom) return;
    const cat = m.cat ? getCatById(m.cat) : null;
    const catLabel = cat ? cat.emoji + ' ' : '';
    armesChips += `<label class="mun-arme-toggle"><input type="checkbox" value="${idx}"> ${catLabel}${escapeHtml(m.nom)}</label>`;
  });

  area.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Nouvelle munition</div>
    <div class="stock-field"><label>Nom *</label><input type="text" id="newMrefNom" placeholder="Ex: 9mm Parabellum" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="newMrefCalibre" placeholder="Ex: 9x19mm" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="newMrefUnite" value="cartouche" maxlength="30"></div>
    <div class="stock-field"><label>Par boîte (conditionnement)</label><input type="number" id="newMrefCondit" value="1" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Armes associées</label>
      <div class="mun-armes-select" id="newMrefArmes">${armesChips || '<span style="color:var(--text3);font-size:11px;">Aucune arme configurée</span>'}</div>
    </div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Stock initial</label><input type="number" id="newMrefStock" value="0" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil alerte</label><input type="number" id="newMrefAlerte" value="100" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil critique</label><input type="number" id="newMrefCritique" value="30" min="0" inputmode="numeric"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnConfirmMref">Créer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="btnCancelMref">Annuler</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('btnConfirmMref').addEventListener('click', () => {
    const nom = document.getElementById('newMrefNom').value.trim();
    if (!nom) { showToast('Le nom est obligatoire', 'error'); return; }
    const calibre = document.getElementById('newMrefCalibre').value.trim();
    const unite = document.getElementById('newMrefUnite').value.trim() || 'cartouche';
    const conditionnement = parseInt(document.getElementById('newMrefCondit').value) || 1;
    const stockActuel = parseInt(document.getElementById('newMrefStock').value) || 0;
    const seuilAlerte = parseInt(document.getElementById('newMrefAlerte').value) || 100;
    const seuilCritique = parseInt(document.getElementById('newMrefCritique').value) || 30;

    const armeIdxList = [];
    document.querySelectorAll('#newMrefArmes input:checked').forEach(cb => {
      armeIdxList.push(+cb.value);
    });

    addMunitionRef({ nom, calibre, unite, conditionnement, armeIdxList, stockActuel, seuilAlerte, seuilCritique });
    showToast('Munition ajoutée');
    renderMunitionsTab(container);
  });

  document.getElementById('btnCancelMref').addEventListener('click', () => {
    area.style.display = 'none';
    area.innerHTML = '';
  });
}

// --- Edit form (with delete in danger zone) ---

function showEditForm(container, refId) {
  const area = document.getElementById('mrefAction_' + refId);
  if (!area) return;
  const ref = getMunRefById(refId);
  if (!ref) return;
  const { machines } = getState();
  area.style.display = 'block';

  let armesChips = '';
  machines.forEach((m, idx) => {
    if (!m.nom) return;
    const checked = ref.armeIdxList.includes(idx) ? 'checked' : '';
    const cat = m.cat ? getCatById(m.cat) : null;
    const catLabel = cat ? cat.emoji + ' ' : '';
    armesChips += `<label class="mun-arme-toggle"><input type="checkbox" value="${idx}" ${checked}> ${catLabel}${escapeHtml(m.nom)}</label>`;
  });

  area.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Modifier la munition</div>
    <div class="stock-field"><label>Nom</label><input type="text" id="editMrefNom_${refId}" value="${escapeHtml(ref.nom)}" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="editMrefCalibre_${refId}" value="${escapeHtml(ref.calibre)}" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="editMrefUnite_${refId}" value="${escapeHtml(ref.unite)}" maxlength="30"></div>
    <div class="stock-field"><label>Par boîte (conditionnement)</label><input type="number" id="editMrefCondit_${refId}" value="${ref.conditionnement || 1}" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Armes associées</label>
      <div class="mun-armes-select" id="editMrefArmes_${refId}">${armesChips}</div>
    </div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Seuil alerte</label><input type="number" id="editMrefAlerte_${refId}" value="${ref.seuilAlerte}" min="0" inputmode="numeric"></div>
      <div class="stock-field" style="flex:1;"><label>Seuil critique</label><input type="number" id="editMrefCritique_${refId}" value="${ref.seuilCritique}" min="0" inputmode="numeric"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="editMrefConfirm_${refId}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="editMrefCancel_${refId}">Annuler</button>
    </div>
    <div class="stock-danger-zone">
      <div class="stock-danger-zone-title">Zone danger</div>
      <button class="stock-btn stock-btn-danger stock-btn-sm" id="editMrefDelete_${refId}">Supprimer cette munition</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('editMrefConfirm_' + refId).addEventListener('click', () => {
    const nom = document.getElementById('editMrefNom_' + refId).value.trim();
    if (!nom) { showToast('Le nom est obligatoire', 'error'); return; }
    const calibre = document.getElementById('editMrefCalibre_' + refId).value.trim();
    const unite = document.getElementById('editMrefUnite_' + refId).value.trim() || 'cartouche';
    const conditionnement = parseInt(document.getElementById('editMrefCondit_' + refId).value) || 1;
    const seuilAlerte = parseInt(document.getElementById('editMrefAlerte_' + refId).value) || 100;
    const seuilCritique = parseInt(document.getElementById('editMrefCritique_' + refId).value) || 30;

    const armeIdxList = [];
    document.querySelectorAll('#editMrefArmes_' + refId + ' input:checked').forEach(cb => {
      armeIdxList.push(+cb.value);
    });

    updateMunitionRef(refId, { nom, calibre, unite, conditionnement, armeIdxList, seuilAlerte, seuilCritique });
    showToast('Munition modifiée');
    renderMunitionsTab(container);
  });

  document.getElementById('editMrefCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });

  // Delete with confirmation dialog (type-to-confirm)
  document.getElementById('editMrefDelete_' + refId).addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Supprimer cette munition ?',
      message: `Cette action supprimera définitivement « ${ref.nom} » et tout son historique de stock.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: true,
      requireType: ref.nom,
    });
    if (!confirmed) return;
    deleteMunitionRef(refId);
    showToast('Munition supprimée');
    renderMunitionsTab(container);
  });
}

// --- Approvisionner ---

function showApproForm(container, refId) {
  const area = document.getElementById('mrefAction_' + refId);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Ajouter du stock</div>
    <div class="stock-field"><label>Quantité à ajouter</label><input type="number" id="approQty_${refId}" min="1" value="50" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif (optionnel)</label><input type="text" id="approMotif_${refId}" placeholder="Ex: Livraison fournisseur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="approConfirm_${refId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="approCancel_${refId}">Annuler</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('approConfirm_' + refId).addEventListener('click', () => {
    const qty = parseInt(document.getElementById('approQty_' + refId).value) || 0;
    if (qty <= 0) { showToast('Quantité invalide', 'error'); return; }
    const motif = document.getElementById('approMotif_' + refId).value;
    logMouvement({ type: 'approvisionnement', munRefId: refId, armeIdx: null, quantite: qty, motif, source: 'manuel' });
    showToast(`+${qty} ajoutés au stock`);
    renderMunitionsTab(container);
  });
  document.getElementById('approCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

// --- Corriger (ajuster) ---

function showAdjustForm(container, refId) {
  const area = document.getElementById('mrefAction_' + refId);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Corriger le stock</div>
    <div class="stock-field"><label>Correction (+/-)</label><input type="number" id="adjustQty_${refId}" value="0" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif</label><input type="text" id="adjustMotif_${refId}" placeholder="Ex: Inventaire, correction erreur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="adjustConfirm_${refId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="adjustCancel_${refId}">Annuler</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('adjustConfirm_' + refId).addEventListener('click', () => {
    const qty = parseInt(document.getElementById('adjustQty_' + refId).value) || 0;
    if (qty === 0) { showToast('Quantité invalide', 'error'); return; }
    const motif = document.getElementById('adjustMotif_' + refId).value;
    logMouvement({ type: 'ajustement', munRefId: refId, armeIdx: null, quantite: qty, motif, source: 'manuel' });
    showToast(`Stock corrigé (${qty > 0 ? '+' : ''}${qty})`);
    renderMunitionsTab(container);
  });
  document.getElementById('adjustCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

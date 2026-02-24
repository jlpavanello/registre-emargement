// Stock — Onglet Munitions (références de munitions indépendantes)
import { getState } from '../state.js';
import {
  addMunitionRef, updateMunitionRef, deleteMunitionRef,
  getMunRefById, getAlertLevelForRef, updateSeuils, saveMunitionRefs,
} from '../domains/stock-munitions.js';
import { logMouvement } from '../domains/stock-mouvements.js';
import { getCatById } from '../domains/categories.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderMunitionsTab(container) {
  const { munitionRefs, machines } = getState();

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <div class="stock-section-title" style="margin:0;">🔫 Références de munitions</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddMunRef">+ Nouvelle référence</button>
  </div>`;

  html += `<div id="munRefCreateArea" style="display:none;"></div>`;

  if (munitionRefs.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">🔫</div>
      <div>Aucune référence de munition créée.</div>
      <div style="margin-top:8px;">Créez une référence et affectez-la à une ou plusieurs armes.</div>
    </div>`;
  }

  munitionRefs.forEach(ref => {
    const level = getAlertLevelForRef(ref);
    const pct = ref.seuilAlerte > 0 ? Math.min(100, (ref.stockActuel / (ref.seuilAlerte * 2)) * 100) : (ref.stockActuel > 0 ? 100 : 0);
    const condit = ref.conditionnement || 1;
    const total = ref.stockActuel * condit;
    const unitePluriel = escapeHtml(ref.unite) + (total > 1 ? 's' : '');

    // Build weapon chips
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

    // Build calc block — nombre × conditionnement = total
    let calcHtml;
    if (condit > 1) {
      calcHtml = `<div class="mun-calc-block">
        <div class="mun-calc-row">
          <div class="mun-calc-item">
            <div class="mun-calc-value">${ref.stockActuel}</div>
            <div class="mun-calc-label">boîtes</div>
          </div>
          <div class="mun-calc-op">×</div>
          <div class="mun-calc-item">
            <div class="mun-calc-value">${condit}</div>
            <div class="mun-calc-label">par boîte</div>
          </div>
          <div class="mun-calc-op">=</div>
          <div class="mun-calc-item">
            <div class="mun-calc-value total ${level}">${total}</div>
            <div class="mun-calc-label">${unitePluriel}</div>
          </div>
        </div>
      </div>`;
    } else {
      calcHtml = `<div class="mun-calc-block">
        <div class="mun-calc-simple">
          <div class="mun-calc-value total ${level}">${total}</div>
          <div class="mun-calc-unit">${unitePluriel}</div>
        </div>
      </div>`;
    }

    html += `<div class="stock-card" data-mun-ref-id="${ref.id}">
      <div class="stock-card-header">
        <div>
          <div class="stock-card-title">📦 ${escapeHtml(ref.nom)}</div>
          <div class="stock-card-sub">${ref.calibre ? 'Calibre : ' + escapeHtml(ref.calibre) : 'Pas de calibre défini'}</div>
        </div>
      </div>
      ${calcHtml}
      <div style="margin:6px 0 4px;"><span style="font-size:11px;font-weight:600;color:var(--text2);">Armes associées :</span></div>
      <div class="mun-armes-row">${armesHtml}</div>
      <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
      <div class="stock-info-row">
        <span>Seuil alerte : ${ref.seuilAlerte}</span>
        <span>Seuil critique : ${ref.seuilCritique}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button class="stock-btn stock-btn-primary stock-btn-sm btn-mref-appro" data-id="${ref.id}">+ Approvisionner</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-adjust" data-id="${ref.id}">🔧 Ajuster</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mref-edit" data-id="${ref.id}">✏️ Modifier</button>
        <button class="stock-btn stock-btn-danger stock-btn-sm btn-mref-delete" data-id="${ref.id}">Supprimer</button>
      </div>
      <div id="mrefAction_${ref.id}" style="display:none;margin-top:10px;"></div>
    </div>`;
  });

  container.innerHTML = html;

  // Bind create button
  document.getElementById('btnAddMunRef').addEventListener('click', () => showCreateForm(container));

  // Bind action buttons
  container.querySelectorAll('.btn-mref-appro').forEach(btn => {
    btn.addEventListener('click', () => showApproForm(container, btn.dataset.id));
  });
  container.querySelectorAll('.btn-mref-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustForm(container, btn.dataset.id));
  });
  container.querySelectorAll('.btn-mref-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditForm(container, btn.dataset.id));
  });
  container.querySelectorAll('.btn-mref-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const ref = getMunRefById(btn.dataset.id);
      if (!ref) return;
      if (!confirm('Supprimer la référence « ' + ref.nom + ' » et son stock ?')) return;
      deleteMunitionRef(btn.dataset.id);
      renderMunitionsTab(container);
    });
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

  area.innerHTML = `<div class="stock-card" style="border:2px dashed var(--accent);background:#f8fafc;">
    <div class="stock-card-title" style="margin-bottom:8px;">Nouvelle référence de munition</div>
    <div class="stock-field"><label>Nom *</label><input type="text" id="newMrefNom" placeholder="Ex: 9mm Parabellum" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="newMrefCalibre" placeholder="Ex: 9x19mm" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="newMrefUnite" value="cartouche" maxlength="30"></div>
    <div class="stock-field"><label>Conditionnement (unités par boîte)</label><input type="number" id="newMrefCondit" value="1" min="1" inputmode="numeric"></div>
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

  document.getElementById('btnConfirmMref').addEventListener('click', () => {
    const nom = document.getElementById('newMrefNom').value.trim();
    if (!nom) { alert('Le nom est obligatoire.'); return; }
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
    renderMunitionsTab(container);
  });

  document.getElementById('btnCancelMref').addEventListener('click', () => {
    area.style.display = 'none';
    area.innerHTML = '';
  });
}

// --- Edit form ---

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

  area.innerHTML = `
    <div class="stock-field"><label>Nom</label><input type="text" id="editMrefNom_${refId}" value="${escapeHtml(ref.nom)}" maxlength="80"></div>
    <div class="stock-field"><label>Calibre</label><input type="text" id="editMrefCalibre_${refId}" value="${escapeHtml(ref.calibre)}" maxlength="40"></div>
    <div class="stock-field"><label>Unité</label><input type="text" id="editMrefUnite_${refId}" value="${escapeHtml(ref.unite)}" maxlength="30"></div>
    <div class="stock-field"><label>Conditionnement (unités par boîte)</label><input type="number" id="editMrefCondit_${refId}" value="${ref.conditionnement || 1}" min="1" inputmode="numeric"></div>
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
    </div>`;

  document.getElementById('editMrefConfirm_' + refId).addEventListener('click', () => {
    const nom = document.getElementById('editMrefNom_' + refId).value.trim();
    if (!nom) { alert('Le nom est obligatoire.'); return; }
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
    renderMunitionsTab(container);
  });

  document.getElementById('editMrefCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

// --- Approvisionner ---

function showApproForm(container, refId) {
  const area = document.getElementById('mrefAction_' + refId);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Quantité à ajouter</label><input type="number" id="approQty_${refId}" min="1" value="50" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif (optionnel)</label><input type="text" id="approMotif_${refId}" placeholder="Ex: Livraison fournisseur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="approConfirm_${refId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="approCancel_${refId}">Annuler</button>
    </div>`;

  document.getElementById('approConfirm_' + refId).addEventListener('click', () => {
    const qty = parseInt(document.getElementById('approQty_' + refId).value) || 0;
    if (qty <= 0) { alert('Quantité invalide'); return; }
    const motif = document.getElementById('approMotif_' + refId).value;
    logMouvement({ type: 'approvisionnement', munRefId: refId, armeIdx: null, quantite: qty, motif, source: 'manuel' });
    renderMunitionsTab(container);
  });
  document.getElementById('approCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

// --- Ajuster ---

function showAdjustForm(container, refId) {
  const area = document.getElementById('mrefAction_' + refId);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Ajustement (+/-)</label><input type="number" id="adjustQty_${refId}" value="0" inputmode="numeric"></div>
    <div class="stock-field"><label>Motif</label><input type="text" id="adjustMotif_${refId}" placeholder="Ex: Inventaire, correction erreur"></div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="adjustConfirm_${refId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="adjustCancel_${refId}">Annuler</button>
    </div>`;

  document.getElementById('adjustConfirm_' + refId).addEventListener('click', () => {
    const qty = parseInt(document.getElementById('adjustQty_' + refId).value) || 0;
    if (qty === 0) { alert('Quantité invalide'); return; }
    const motif = document.getElementById('adjustMotif_' + refId).value;
    logMouvement({ type: 'ajustement', munRefId: refId, armeIdx: null, quantite: qty, motif, source: 'manuel' });
    renderMunitionsTab(container);
  });
  document.getElementById('adjustCancel_' + refId).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

// Stock — Onglet Munitions
import { getState } from '../state.js';
import { ensureStockForWeapon, saveStockMunitions, getAlertLevel, updateSeuils } from '../domains/stock-munitions.js';
import { logMouvement } from '../domains/stock-mouvements.js';

export function renderMunitionsTab(container) {
  const { machines, stockMunitions } = getState();

  let html = `<div class="stock-section-title">🔫 Stock de munitions par arme</div>`;
  let hasArmes = false;

  machines.forEach((m, idx) => {
    if (!m.nom) return;
    hasArmes = true;
    const stock = stockMunitions[idx];
    const s = stock || { stockActuel: 0, seuilAlerte: 100, seuilCritique: 30, unite: 'cartouche' };
    const level = stock ? getAlertLevel(idx) : 'ok';
    const pct = s.seuilAlerte > 0 ? Math.min(100, (s.stockActuel / (s.seuilAlerte * 2)) * 100) : (s.stockActuel > 0 ? 100 : 0);

    html += `<div class="stock-card" data-mun-idx="${idx}">
      <div class="stock-card-header">
        <div>
          <div class="stock-card-title">${m.nom}</div>
          <div class="stock-card-sub">${m.ref || 'Pas de référence'}</div>
        </div>
        <div class="stock-value ${level}">${s.stockActuel}<span style="font-size:11px;font-weight:500;color:var(--text3);margin-left:4px;">${s.unite}s</span></div>
      </div>
      <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
      <div class="stock-info-row">
        <span>Alerte: ${s.seuilAlerte}</span>
        <span>Critique: ${s.seuilCritique}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <button class="stock-btn stock-btn-primary stock-btn-sm btn-mun-appro" data-idx="${idx}">+ Approvisionner</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mun-adjust" data-idx="${idx}">🔧 Ajuster</button>
        <button class="stock-btn stock-btn-secondary stock-btn-sm btn-mun-seuils" data-idx="${idx}">⚙️ Seuils</button>
      </div>
      <div id="munAction_${idx}" style="display:none;margin-top:10px;"></div>
    </div>`;
  });

  if (!hasArmes) {
    html = `<div class="stock-empty">
      <div class="stock-empty-icon">🔫</div>
      <div>Aucune arme configurée.</div>
      <div style="margin-top:8px;">Ajoutez des armes dans la <strong>Configuration</strong> d'abord.</div>
    </div>`;
  }

  container.innerHTML = html;

  // Bind buttons
  container.querySelectorAll('.btn-mun-appro').forEach(btn => {
    btn.addEventListener('click', () => showApproForm(container, +btn.dataset.idx));
  });
  container.querySelectorAll('.btn-mun-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustForm(container, +btn.dataset.idx));
  });
  container.querySelectorAll('.btn-mun-seuils').forEach(btn => {
    btn.addEventListener('click', () => showSeuilsForm(container, +btn.dataset.idx));
  });
}

function showApproForm(container, idx) {
  const area = document.getElementById(`munAction_${idx}`);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Quantité à ajouter</label>
      <input type="number" id="approQty_${idx}" min="1" value="50" inputmode="numeric">
    </div>
    <div class="stock-field"><label>Motif (optionnel)</label>
      <input type="text" id="approMotif_${idx}" placeholder="Ex: Livraison fournisseur">
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="approConfirm_${idx}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="approCancel_${idx}">Annuler</button>
    </div>`;
  document.getElementById(`approConfirm_${idx}`).addEventListener('click', () => {
    const qty = parseInt(document.getElementById(`approQty_${idx}`).value) || 0;
    if (qty <= 0) { alert('Quantité invalide'); return; }
    const motif = document.getElementById(`approMotif_${idx}`).value;
    ensureStockForWeapon(idx);
    logMouvement({ type: 'approvisionnement', armeIdx: idx, quantite: qty, motif, source: 'manuel' });
    renderMunitionsTab(container);
  });
  document.getElementById(`approCancel_${idx}`).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

function showAdjustForm(container, idx) {
  const area = document.getElementById(`munAction_${idx}`);
  if (!area) return;
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Ajustement (+/-)</label>
      <input type="number" id="adjustQty_${idx}" value="0" inputmode="numeric">
    </div>
    <div class="stock-field"><label>Motif</label>
      <input type="text" id="adjustMotif_${idx}" placeholder="Ex: Inventaire, correction erreur">
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="adjustConfirm_${idx}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="adjustCancel_${idx}">Annuler</button>
    </div>`;
  document.getElementById(`adjustConfirm_${idx}`).addEventListener('click', () => {
    const qty = parseInt(document.getElementById(`adjustQty_${idx}`).value) || 0;
    if (qty === 0) { alert('Quantité invalide'); return; }
    const motif = document.getElementById(`adjustMotif_${idx}`).value;
    ensureStockForWeapon(idx);
    logMouvement({ type: 'ajustement', armeIdx: idx, quantite: qty, motif, source: 'manuel' });
    renderMunitionsTab(container);
  });
  document.getElementById(`adjustCancel_${idx}`).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

function showSeuilsForm(container, idx) {
  const area = document.getElementById(`munAction_${idx}`);
  if (!area) return;
  const stock = ensureStockForWeapon(idx);
  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-field"><label>Seuil d'alerte</label>
      <input type="number" id="seuilAlerte_${idx}" value="${stock.seuilAlerte}" min="0" inputmode="numeric">
    </div>
    <div class="stock-field"><label>Seuil critique</label>
      <input type="number" id="seuilCritique_${idx}" value="${stock.seuilCritique}" min="0" inputmode="numeric">
    </div>
    <div class="stock-field"><label>Unité</label>
      <input type="text" id="seuilUnite_${idx}" value="${stock.unite}">
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="seuilConfirm_${idx}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="seuilCancel_${idx}">Annuler</button>
    </div>`;
  document.getElementById(`seuilConfirm_${idx}`).addEventListener('click', () => {
    const alerte = parseInt(document.getElementById(`seuilAlerte_${idx}`).value) || 0;
    const critique = parseInt(document.getElementById(`seuilCritique_${idx}`).value) || 0;
    const unite = document.getElementById(`seuilUnite_${idx}`).value || 'cartouche';
    stock.unite = unite;
    updateSeuils(idx, alerte, critique);
    renderMunitionsTab(container);
  });
  document.getElementById(`seuilCancel_${idx}`).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

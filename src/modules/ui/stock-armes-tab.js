// Stock — Onglet État des Armes (groupé par catégorie)
import { getState } from '../state.js';
import { ensureWeaponStatus, updateWeaponStatus, ETATS_ARME, saveStockArmes } from '../domains/stock-armes.js';
import { getCatById } from '../domains/categories.js';

export function renderArmesTab(container) {
  const { machines, stockArmes, categories } = getState();

  let html = `<div class="stock-section-title">🛡️ État des armes</div>`;
  const activeMachines = machines.map((m, idx) => ({ ...m, idx })).filter(m => m.nom);

  if (activeMachines.length === 0) {
    html = `<div class="stock-empty">
      <div class="stock-empty-icon">🛡️</div>
      <div>Aucune arme configurée.</div>
    </div>`;
    container.innerHTML = html;
    return;
  }

  // Group machines by category
  const groups = {};
  const NO_CAT = '__none__';
  activeMachines.forEach(m => {
    const key = m.cat || NO_CAT;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  // Render categories in order, then uncategorized
  const catOrder = categories.filter(c => groups[c.id]).map(c => c.id);
  if (groups[NO_CAT]) catOrder.push(NO_CAT);

  catOrder.forEach(catId => {
    const items = groups[catId];
    if (catId === NO_CAT) {
      html += `<div class="stock-cat-header"><span class="stock-cat-emoji">📦</span> <span class="stock-cat-name">Sans catégorie</span> <span class="stock-cat-count">${items.length}</span></div>`;
    } else {
      const cat = getCatById(catId);
      html += `<div class="stock-cat-header"><span class="stock-cat-emoji">${cat ? cat.emoji : '📦'}</span> <span class="stock-cat-name">${cat ? cat.nom : 'Catégorie'}</span> <span class="stock-cat-count">${items.length}</span></div>`;
    }

    items.forEach(m => {
      const idx = m.idx;
      const status = stockArmes[idx] || { etat: 'operationnelle', dateRevision: '', notes: '' };
      const etatInfo = ETATS_ARME[status.etat] || ETATS_ARME.operationnelle;

      html += `<div class="stock-card" data-arme-idx="${idx}">
        <div class="stock-card-header">
          <div>
            <div class="stock-card-title">${m.nom}</div>
            <div class="stock-card-sub">${m.ref || 'Pas de référence'}</div>
          </div>
          <span class="status-badge" style="background:${etatInfo.bg};color:${etatInfo.color};">${etatInfo.label}</span>
        </div>
        ${status.dateRevision ? `<div style="font-size:11px;color:var(--text3);margin-top:4px;">📅 Prochaine révision: ${status.dateRevision}</div>` : ''}
        ${status.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:2px;font-style:italic;">📝 ${status.notes}</div>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-arme-edit" data-idx="${idx}">✏️ Modifier</button>
        </div>
        <div id="armeAction_${idx}" style="display:none;margin-top:10px;"></div>
      </div>`;
    });
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-arme-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditForm(container, +btn.dataset.idx));
  });
}

function showEditForm(container, idx) {
  const area = document.getElementById(`armeAction_${idx}`);
  if (!area) return;
  const status = ensureWeaponStatus(idx);
  area.style.display = 'block';

  const etatOptions = Object.entries(ETATS_ARME).map(([key, val]) =>
    `<option value="${key}" ${status.etat === key ? 'selected' : ''}>${val.label}</option>`
  ).join('');

  area.innerHTML = `
    <div class="stock-field"><label>État</label>
      <select id="armeEtat_${idx}">${etatOptions}</select>
    </div>
    <div class="stock-field"><label>Date de prochaine révision</label>
      <input type="date" id="armeRevision_${idx}" value="${status.dateRevision}">
    </div>
    <div class="stock-field"><label>Notes</label>
      <textarea id="armeNotes_${idx}" rows="2" placeholder="Notes sur l'arme...">${status.notes}</textarea>
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="armeConfirm_${idx}">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="armeCancel_${idx}">Annuler</button>
    </div>`;

  document.getElementById(`armeConfirm_${idx}`).addEventListener('click', () => {
    const etat = document.getElementById(`armeEtat_${idx}`).value;
    const dateRevision = document.getElementById(`armeRevision_${idx}`).value;
    const notes = document.getElementById(`armeNotes_${idx}`).value;
    updateWeaponStatus(idx, etat, dateRevision, notes);
    renderArmesTab(container);
  });
  document.getElementById(`armeCancel_${idx}`).addEventListener('click', () => {
    area.style.display = 'none';
  });
}

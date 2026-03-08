// PV — Templates library tab
import { getAllTemplates, searchTemplates, getFamilles } from '../domains/pv-templates.js';
import { createPvDocument } from '../domains/pv-documents.js';
import { openEditor } from './pv-panel.js';

let _selectedFamille = null;
let _searchQuery = '';

export function renderTemplatesTab(container) {
  const familles = getFamilles();
  let templates = _searchQuery ? searchTemplates(_searchQuery) : getAllTemplates();

  if (_selectedFamille) {
    templates = templates.filter(t => t.famille === _selectedFamille);
  }

  let html = '';

  // Search bar
  html += `<div class="pv-search">
    <input type="text" id="pvSearchInput" placeholder="Rechercher un mod\u00e8le..." value="${_searchQuery}">
  </div>`;

  // Family chips
  html += `<div class="pv-chips">
    <button class="pv-chip ${!_selectedFamille ? 'active' : ''}" data-famille="">Tous</button>`;
  familles.forEach(f => {
    const icons = { 1: '\uD83C\uDD7F\uFE0F', 2: '\uD83D\uDE94', 3: '\uD83D\uDD07', 4: '\uD83E\uDDF9', 5: '\uD83D\uDC15', 6: '\uD83C\uDFD7\uFE0F', 7: '\uD83C\uDFEA', 8: '\uD83C\uDFDB\uFE0F' };
    html += `<button class="pv-chip ${_selectedFamille === f.nom ? 'active' : ''}" data-famille="${f.nom}">${icons[f.num] || '\uD83D\uDCCB'} ${f.nom}</button>`;
  });
  html += `</div>`;

  // Templates grouped by famille
  if (templates.length === 0) {
    html += `<div class="pv-empty">
      <div class="pv-empty-icon">\uD83D\uDD0D</div>
      <div>Aucun mod\u00e8le trouv\u00e9</div>
      <div style="margin-top:8px;font-size:12px;color:var(--text3);">Essayez un autre terme de recherche ou une autre cat\u00e9gorie.</div>
    </div>`;
  } else {
    let currentFamille = '';
    templates.sort((a, b) => a.familleNum - b.familleNum || a.ref.localeCompare(b.ref, undefined, { numeric: true }));

    templates.forEach(t => {
      if (t.famille !== currentFamille) {
        currentFamille = t.famille;
        if (!_selectedFamille) {
          html += `<div class="pv-famille-header">${currentFamille}</div>`;
        }
      }
      html += `<div class="pv-template-card" data-id="${t.id}">
        <div class="pv-template-ref">${t.ref}</div>
        <div class="pv-template-info">
          <div class="pv-template-nom">${t.nom}</div>
          <div class="pv-template-detail">${t.article} \u2014 ${t.classeContravention} classe${t.amendeForfaitaire ? ' \u2014 ' + t.amendeForfaitaire : ''}</div>
        </div>
        <button class="pv-btn-use" data-id="${t.id}">Utiliser</button>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Event listeners
  const searchInput = container.querySelector('#pvSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      _searchQuery = e.target.value;
      renderTemplatesTab(container);
    });
    if (_searchQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  container.querySelectorAll('.pv-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      _selectedFamille = chip.dataset.famille || null;
      renderTemplatesTab(container);
    });
  });

  container.querySelectorAll('.pv-btn-use').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tplId = btn.dataset.id;
      const doc = createPvDocument(tplId);
      if (doc) {
        openEditor(doc.id);
      }
    });
  });
}

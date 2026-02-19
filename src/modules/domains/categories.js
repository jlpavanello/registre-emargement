// Domain module: Categories management
// localStorage key: 'reg_categories'
// categories is array of {id, nom, emoji}

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_categories';

export function loadCategories() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    setState('categories', data);
  }
}

export function saveCategories() {
  const { categories } = getState();
  storage.set(STORAGE_KEY, categories);
}

export function getCatById(id) {
  const { categories } = getState();
  return categories.find(c => c.id === id) || null;
}

export function getCatLabel(id) {
  const c = getCatById(id);
  return c ? c.nom : '';
}

export function getCatEmoji(id) {
  const c = getCatById(id);
  return c ? c.emoji : '';
}

export function addCategory() {
  const { categories } = getState();
  const id = 'cat_' + Date.now();
  categories.push({ id, nom: '', emoji: '\u{1F4E6}' });
  setState('categories', categories);

  // Lazy import to avoid circular dependency
  import('../ui/config-panel.js').then(mod => {
    mod.renderConfig();
    document.getElementById('configPanel').scrollTop = 99999;
  });
}

export function removeCategory() {
  const { categories, machines } = getState();
  if (categories.length <= 1) {
    alert('Il faut garder au moins une catégorie.');
    return;
  }
  const last = categories[categories.length - 1];
  if (confirm('Retirer la catégorie "' + (last.nom || 'sans nom') + '" ?')) {
    machines.forEach(m => {
      if (m.cat === last.id) m.cat = '';
    });
    categories.pop();
    setState('categories', categories);
    setState('machines', machines);

    // Lazy import to avoid circular dependency
    import('../ui/config-panel.js').then(mod => {
      mod.renderConfig();
    });
  }
}

export function removeCategoryAt(idx) {
  const { categories, machines } = getState();
  if (categories.length <= 1) {
    alert('Il faut garder au moins une catégorie.');
    return;
  }
  const cat = categories[idx];
  const name = cat.nom || 'sans nom';
  if (!confirm(`Supprimer la catégorie « ${name} » ?`)) return;
  // Retirer la catégorie des armes qui l'utilisent
  machines.forEach(m => {
    if (m.cat === cat.id) m.cat = '';
  });
  categories.splice(idx, 1);
  setState('categories', categories);
  setState('machines', machines);

  // Lazy import to avoid circular dependency
  import('../ui/config-panel.js').then(mod => {
    mod.renderConfig();
  });
}

export function renderCatList() {
  const { categories } = getState();
  const c = document.getElementById('configCatList');
  c.innerHTML = '';
  const emojis = [
    '\u{1F527}', '\u{2699}\u{FE0F}', '\u{1F69B}', '\u{1F4E6}', '\u{1F528}',
    '\u{1FA9A}', '\u{1F3D7}\u{FE0F}', '\u{1F529}', '\u{26CF}\u{FE0F}', '\u{1F9F0}',
    '\u{1F69C}', '\u{1F69A}', '\u{1F50C}', '\u{1F4A1}', '\u{1FA9C}',
  ];
  categories.forEach((cat, i) => {
    const emojiOpts = emojis
      .map(e => `<option value="${e}" ${cat.emoji === e ? 'selected' : ''}>${e}</option>`)
      .join('');
    c.innerHTML += `<div class="config-card">
      <button class="btn-remove-config" data-rt="cat" data-ri="${i}" title="Supprimer cette catégorie">✕</button>
      <select data-ci="${i}" data-cf="emoji" style="width:44px;height:36px;font-size:20px;border:1.5px solid var(--border);border-radius:8px;text-align:center;background:white;cursor:pointer;appearance:none;">${emojiOpts}</select>
      <div class="fields">
        <input class="name-input" type="text" placeholder="Nom de la catégorie" value="${cat.nom}" data-ci="${i}" data-cf="nom">
      </div>
    </div>`;
  });
  document.querySelectorAll('#configCatList input,#configCatList select').forEach(inp => {
    if (inp.dataset.ci === undefined) return; // skip remove buttons
    inp.addEventListener(inp.tagName === 'SELECT' ? 'change' : 'input', function () {
      const { categories: cats } = getState();
      const idx = +this.dataset.ci;
      cats[idx][this.dataset.cf] = this.value;
    });
  });
  // Bind boutons ✕ de suppression individuelle des catégories
  document.querySelectorAll('#configCatList .btn-remove-config').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = +btn.dataset.ri;
      removeCategoryAt(idx);
    });
  });
}

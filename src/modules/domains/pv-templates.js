// Domain module: PV Templates management
// localStorage key: 'reg_pv_templates'
// Templates = array of template objects

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_pv_templates';

export function loadPvTemplates() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    setState('pvTemplates', data);
  }
}

export function savePvTemplates() {
  const { pvTemplates } = getState();
  storage.set(STORAGE_KEY, pvTemplates);
}

/**
 * Initialize builtin templates if not yet loaded
 * Called once at startup — merges builtins with any user-created templates
 */
export function initBuiltinTemplates(builtins) {
  const { pvTemplates } = getState();

  if (!pvTemplates || pvTemplates.length === 0) {
    setState('pvTemplates', builtins.map(t => ({ ...t })));
    savePvTemplates();
    return;
  }

  const existing = new Map(pvTemplates.map(t => [t.id, t]));
  let changed = false;

  for (const builtin of builtins) {
    if (!existing.has(builtin.id)) {
      pvTemplates.push({ ...builtin });
      changed = true;
    } else {
      const ex = existing.get(builtin.id);
      if (ex.isBuiltin) {
        Object.assign(ex, builtin);
        changed = true;
      }
    }
  }

  if (changed) {
    setState('pvTemplates', pvTemplates);
    savePvTemplates();
  }
}

export function getAllTemplates() {
  const { pvTemplates } = getState();
  return pvTemplates || [];
}

export function getTemplateById(id) {
  return getAllTemplates().find(t => t.id === id) || null;
}

export function getTemplatesByFamille(famille) {
  return getAllTemplates().filter(t => t.famille === famille);
}

export function getFamilles() {
  const templates = getAllTemplates();
  const familles = new Map();
  templates.forEach(t => {
    if (!familles.has(t.familleNum)) {
      familles.set(t.familleNum, t.famille);
    }
  });
  return Array.from(familles.entries()).sort((a, b) => a[0] - b[0]).map(([num, nom]) => ({ num, nom }));
}

export function searchTemplates(query) {
  if (!query) return getAllTemplates();
  const q = query.toLowerCase();
  return getAllTemplates().filter(t =>
    t.nom.toLowerCase().includes(q) ||
    t.ref.includes(q) ||
    t.article.toLowerCase().includes(q) ||
    t.famille.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  );
}

export function createCustomTemplate(templateData) {
  const { pvTemplates } = getState();
  const newTemplate = {
    ...templateData,
    id: 'tpl_custom_' + Date.now(),
    isBuiltin: false,
  };
  pvTemplates.push(newTemplate);
  setState('pvTemplates', pvTemplates);
  savePvTemplates();
  return newTemplate;
}

export function updateTemplate(id, updates) {
  const { pvTemplates } = getState();
  const idx = pvTemplates.findIndex(t => t.id === id);
  if (idx === -1) return false;
  Object.assign(pvTemplates[idx], updates);
  setState('pvTemplates', pvTemplates);
  savePvTemplates();
  return true;
}

export function deleteTemplate(id) {
  const { pvTemplates } = getState();
  const idx = pvTemplates.findIndex(t => t.id === id);
  if (idx === -1 || pvTemplates[idx].isBuiltin) return false;
  pvTemplates.splice(idx, 1);
  setState('pvTemplates', pvTemplates);
  savePvTemplates();
  return true;
}

export function duplicateTemplate(id) {
  const template = getTemplateById(id);
  if (!template) return null;
  return createCustomTemplate({
    ...template,
    nom: template.nom + ' (copie)',
    ref: template.ref + '-copie',
  });
}

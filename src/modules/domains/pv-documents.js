// Domain module: PV Documents management
// localStorage key: 'reg_pv_documents'
// Documents = array of filled PV instances

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { getTemplateById } from './pv-templates.js';

const STORAGE_KEY = 'reg_pv_documents';

export function loadPvDocuments() {
  const data = storage.get(STORAGE_KEY);
  if (data) {
    setState('pvDocuments', data);
  }
}

export function savePvDocuments() {
  const { pvDocuments } = getState();
  storage.set(STORAGE_KEY, pvDocuments);
}

function generateNumero() {
  const { pvDocuments } = getState();
  const year = new Date().getFullYear();
  const prefix = `PV-${year}-`;

  let maxNum = 0;
  (pvDocuments || []).forEach(d => {
    if (d.numero && d.numero.startsWith(prefix)) {
      const num = parseInt(d.numero.replace(prefix, ''), 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return prefix + String(maxNum + 1).padStart(3, '0');
}

export function createPvDocument(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return null;

  const { pvDocuments } = getState();
  const now = new Date();

  const doc = {
    id: now.getTime() + '_' + Math.random().toString(36).substr(2, 6),
    templateId: template.id,
    templateRef: template.ref,
    templateNom: template.nom,
    numero: generateNumero(),
    dateCreation: now.toISOString().split('T')[0],
    dateModification: now.toISOString(),
    statut: 'brouillon',
    values: {},
    templateSnapshot: {
      sections: template.sections.map(s => ({
        ...s,
        fields: s.fields.map(f => ({ ...f }))
      })),
      article: template.article,
      classeContravention: template.classeContravention,
      amendeForfaitaire: template.amendeForfaitaire,
      amendeMinoree: template.amendeMinoree,
      amendeMajoree: template.amendeMajoree,
      retraitPoints: template.retraitPoints,
      famille: template.famille,
    },
  };

  pvDocuments.push(doc);
  setState('pvDocuments', pvDocuments);
  savePvDocuments();
  return doc;
}

export function getAllDocuments() {
  const { pvDocuments } = getState();
  return (pvDocuments || []).sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
}

export function getDocumentById(id) {
  const { pvDocuments } = getState();
  return (pvDocuments || []).find(d => d.id === id) || null;
}

export function getDocumentsByStatut(statut) {
  if (!statut || statut === 'tous') return getAllDocuments();
  return getAllDocuments().filter(d => d.statut === statut);
}

export function updateDocumentValues(docId, values) {
  const { pvDocuments } = getState();
  const doc = pvDocuments.find(d => d.id === docId);
  if (!doc) return false;

  Object.assign(doc.values, values);
  doc.dateModification = new Date().toISOString();
  setState('pvDocuments', pvDocuments);
  savePvDocuments();
  return true;
}

export function updateDocumentStatut(docId, statut) {
  const { pvDocuments } = getState();
  const doc = pvDocuments.find(d => d.id === docId);
  if (!doc) return false;

  doc.statut = statut;
  doc.dateModification = new Date().toISOString();
  setState('pvDocuments', pvDocuments);
  savePvDocuments();
  return true;
}

export function deletePvDocument(docId) {
  const { pvDocuments } = getState();
  const idx = pvDocuments.findIndex(d => d.id === docId);
  if (idx === -1) return false;

  pvDocuments.splice(idx, 1);
  setState('pvDocuments', pvDocuments);
  savePvDocuments();
  return true;
}

export function getDocumentProgress(docId) {
  const doc = getDocumentById(docId);
  if (!doc || !doc.templateSnapshot) return { filled: 0, required: 0, total: 0, percent: 0 };

  let filled = 0;
  let required = 0;
  let total = 0;

  doc.templateSnapshot.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type === 'fixed') return;
      total++;
      if (field.required) required++;

      const val = doc.values[field.id];
      if (val !== undefined && val !== null && val !== '') {
        filled++;
      }
    });
  });

  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { filled, required, total, percent };
}

export function isDocumentComplete(docId) {
  const doc = getDocumentById(docId);
  if (!doc || !doc.templateSnapshot) return false;

  for (const section of doc.templateSnapshot.sections) {
    for (const field of section.fields) {
      if (field.type === 'fixed') continue;
      if (field.required) {
        const val = doc.values[field.id];
        if (val === undefined || val === null || val === '') return false;
      }
    }
  }
  return true;
}

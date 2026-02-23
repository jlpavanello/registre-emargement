// =============================================
// Domain module: Piste d'audit (Audit Trail)
// Enregistre toutes les actions importantes de l'application
// localStorage key: 'reg_audit_log'
// =============================================

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { todayStr, nowTime } from '../utils/date.js';
import { getDeviceRole } from '../auth/auth-state.js';

const STORAGE_KEY = 'reg_audit_log';
const MAX_ENTRIES = 2000;

// Types d'actions auditées
export const AUDIT_ACTIONS = {
  // Signatures
  SIGNATURE_MATIN: { label: 'Signature sortie', icon: '✍️', category: 'signature' },
  SIGNATURE_SOIR: { label: 'Signature retour', icon: '✍️', category: 'signature' },
  VISA_MATIN: { label: 'Visa sortie', icon: '🔏', category: 'visa' },
  VISA_SOIR: { label: 'Visa retour', icon: '🔏', category: 'visa' },

  // Présence
  PRESENCE_UPDATE: { label: 'Modification présents', icon: '👥', category: 'presence' },
  PRESENCE_REMOVE: { label: 'Retrait agent', icon: '👤', category: 'presence' },

  // Configuration
  CONFIG_SAVE: { label: 'Config enregistrée', icon: '⚙️', category: 'config' },
  TEAM_MODIFIED: { label: 'Équipe modifiée', icon: '👥', category: 'config' },
  WEAPON_MODIFIED: { label: 'Armes modifiées', icon: '🔫', category: 'config' },

  // Stock
  STOCK_MOUVEMENT: { label: 'Mouvement de stock', icon: '📦', category: 'stock' },

  // PV
  PV_CREATED: { label: 'PV créé', icon: '📋', category: 'pv' },
  PV_MODIFIED: { label: 'PV modifié', icon: '📝', category: 'pv' },
  PV_DELETED: { label: 'PV supprimé', icon: '🗑️', category: 'pv' },

  // Rapports
  REPORT_CREATED: { label: 'Rapport créé', icon: '🎙️', category: 'report' },
  REPORT_DELETED: { label: 'Rapport supprimé', icon: '🗑️', category: 'report' },

  // Incidents
  INCIDENT_CREATED: { label: 'Incident signalé', icon: '🚨', category: 'incident' },
  INCIDENT_UPDATED: { label: 'Incident mis à jour', icon: '📝', category: 'incident' },
  INCIDENT_CLOSED: { label: 'Incident clôturé', icon: '✅', category: 'incident' },

  // Système
  RESET_SIGNATURES: { label: 'Remise à zéro signatures', icon: '🔄', category: 'system' },
  FULL_RESET: { label: 'Remise à zéro complète', icon: '⚠️', category: 'system' },
  PDF_GENERATED: { label: 'PDF généré', icon: '📄', category: 'system' },
  ROLE_CHANGED: { label: 'Changement de profil', icon: '🔀', category: 'system' },
};

/**
 * Charger le journal d'audit depuis le storage
 */
export function loadAuditLog() {
  const data = storage.get(STORAGE_KEY);
  if (data && Array.isArray(data)) {
    setState('auditLog', data);
  }
}

/**
 * Sauvegarder le journal d'audit
 */
export function saveAuditLog() {
  const { auditLog } = getState();
  storage.set(STORAGE_KEY, auditLog);
}

/**
 * Enregistrer une entrée dans la piste d'audit
 * @param {string} action — Clé de AUDIT_ACTIONS (ex: 'SIGNATURE_MATIN')
 * @param {object} details — Détails de l'action (variable selon le type)
 * @returns {object} L'entrée créée
 */
export function logAudit(action, details = {}) {
  const { auditLog } = getState();
  const actionInfo = AUDIT_ACTIONS[action] || { label: action, icon: '📌', category: 'other' };

  const entry = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    timestamp: new Date().toISOString(),
    date: todayStr(),
    heure: nowTime(),
    action,
    label: actionInfo.label,
    icon: actionInfo.icon,
    category: actionInfo.category,
    deviceRole: getDeviceRole() || 'inconnu',
    details,
  };

  auditLog.unshift(entry);

  // Limiter le nombre d'entrées
  if (auditLog.length > MAX_ENTRIES) {
    auditLog.length = MAX_ENTRIES;
  }

  setState('auditLog', auditLog);
  saveAuditLog();

  return entry;
}

/**
 * Obtenir les entrées d'audit récentes
 * @param {number} limit — Nombre max d'entrées
 * @returns {Array}
 */
export function getRecentAuditEntries(limit = 50) {
  const { auditLog } = getState();
  return auditLog.slice(0, limit);
}

/**
 * Obtenir les entrées d'audit pour une date donnée
 * @param {string} date — Format YYYY-MM-DD
 * @returns {Array}
 */
export function getAuditEntriesForDate(date) {
  const { auditLog } = getState();
  return auditLog.filter(e => e.date === date);
}

/**
 * Obtenir les entrées d'audit par catégorie
 * @param {string} category — ex: 'signature', 'config', 'stock'
 * @param {number} limit
 * @returns {Array}
 */
export function getAuditEntriesByCategory(category, limit = 100) {
  const { auditLog } = getState();
  return auditLog.filter(e => e.category === category).slice(0, limit);
}

/**
 * Obtenir les entrées d'audit pour un agent
 * @param {number} agentIdx
 * @param {number} limit
 * @returns {Array}
 */
export function getAuditEntriesForAgent(agentIdx, limit = 50) {
  const { auditLog } = getState();
  return auditLog.filter(e => e.details && e.details.agentIdx === agentIdx).slice(0, limit);
}

/**
 * Rechercher dans le journal d'audit
 * @param {string} query — Texte de recherche
 * @param {number} limit
 * @returns {Array}
 */
export function searchAuditLog(query, limit = 50) {
  const { auditLog } = getState();
  const q = query.toLowerCase();
  return auditLog.filter(e =>
    e.label.toLowerCase().includes(q) ||
    (e.details.agentName && e.details.agentName.toLowerCase().includes(q)) ||
    (e.details.description && e.details.description.toLowerCase().includes(q))
  ).slice(0, limit);
}

/**
 * Statistiques d'audit pour aujourd'hui
 * @returns {object}
 */
export function getTodayAuditStats() {
  const today = todayStr();
  const entries = getAuditEntriesForDate(today);
  const stats = {
    total: entries.length,
    signatures: entries.filter(e => e.category === 'signature').length,
    visas: entries.filter(e => e.category === 'visa').length,
    stock: entries.filter(e => e.category === 'stock').length,
    incidents: entries.filter(e => e.category === 'incident').length,
    config: entries.filter(e => e.category === 'config').length,
  };
  return stats;
}

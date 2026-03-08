// =============================================
// Domain module: Rapports d'incident
// Gère les signalements liés aux agents, armes et opérations
// localStorage key: 'reg_incidents'
// =============================================

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';
import { todayStr, nowTime } from '../utils/date.js';
import { getDeviceRole } from '../auth/auth-state.js';
import { logAudit } from './audit-log.js';

const STORAGE_KEY = 'reg_incidents';

// Types d'incidents
export const INCIDENT_TYPES = {
  arme: { label: 'Incident arme', icon: '🔫', color: '#dc2626' },
  munition: { label: 'Incident munition', icon: '💥', color: '#ea580c' },
  vehicule: { label: 'Incident véhicule', icon: '🚔', color: '#2563eb' },
  agent: { label: 'Incident agent', icon: '👤', color: '#7c3aed' },
  securite: { label: 'Incident sécurité', icon: '🛡️', color: '#b91c1c' },
  materiel: { label: 'Incident matériel', icon: '🔧', color: '#ca8a04' },
  autre: { label: 'Autre incident', icon: '📌', color: '#64748b' },
};

// Niveaux de gravité
export const SEVERITY_LEVELS = {
  faible: { label: 'Faible', color: '#3b82f6', badge: 'info' },
  moyen: { label: 'Moyen', color: '#f59e0b', badge: 'warning' },
  grave: { label: 'Grave', color: '#ef4444', badge: 'danger' },
  critique: { label: 'Critique', color: '#991b1b', badge: 'critical' },
};

// Statuts
export const INCIDENT_STATUSES = {
  ouvert: { label: 'Ouvert', color: '#ef4444', icon: '🔴' },
  en_cours: { label: 'En cours', color: '#f59e0b', icon: '🟡' },
  resolu: { label: 'Résolu', color: '#22c55e', icon: '🟢' },
  cloture: { label: 'Clôturé', color: '#6b7280', icon: '⚪' },
};

/**
 * Charger les incidents depuis le storage
 */
export function loadIncidents() {
  const data = storage.get(STORAGE_KEY);
  if (data && Array.isArray(data)) {
    setState('incidents', data);
  }
}

/**
 * Sauvegarder les incidents
 */
export function saveIncidents() {
  const { incidents } = getState();
  storage.set(STORAGE_KEY, incidents);
}

/**
 * Créer un nouveau rapport d'incident
 * @param {object} params
 * @returns {object} L'incident créé
 */
export function createIncident({
  type = 'autre',
  severity = 'moyen',
  title = '',
  description = '',
  agentIdx = null,
  agentName = '',
  armeIdx = null,
  armeName = '',
  vehiculeIdx = null,
  vehiculeName = '',
  lieu = '',
}) {
  const { incidents } = getState();

  const incident = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 8),
    createdAt: new Date().toISOString(),
    date: todayStr(),
    heure: nowTime(),
    type,
    severity,
    status: 'ouvert',
    title,
    description,
    // Références
    agentIdx,
    agentName,
    armeIdx,
    armeName,
    vehiculeIdx,
    vehiculeName,
    lieu,
    // Métadonnées
    createdBy: getDeviceRole() || 'inconnu',
    // Historique des mises à jour
    updates: [],
  };

  incidents.unshift(incident);
  setState('incidents', incidents);
  saveIncidents();

  // Logger dans l'audit
  logAudit('INCIDENT_CREATED', {
    incidentId: incident.id,
    type,
    severity,
    title,
    agentIdx,
    agentName,
    description: `${INCIDENT_TYPES[type]?.label || type} — ${title}`,
  });

  return incident;
}

/**
 * Mettre à jour un incident existant
 * @param {string} id — ID de l'incident
 * @param {object} changes — Champs à modifier
 * @param {string} comment — Commentaire sur la mise à jour
 * @returns {object|null}
 */
export function updateIncident(id, changes = {}, comment = '') {
  const { incidents } = getState();
  const incident = incidents.find(inc => inc.id === id);
  if (!incident) return null;

  // Enregistrer la mise à jour dans l'historique
  const update = {
    timestamp: new Date().toISOString(),
    date: todayStr(),
    heure: nowTime(),
    changedBy: getDeviceRole() || 'inconnu',
    comment,
    changes: {},
  };

  // Appliquer les changements et noter les anciens valeurs
  for (const [key, value] of Object.entries(changes)) {
    if (incident[key] !== value) {
      update.changes[key] = { from: incident[key], to: value };
      incident[key] = value;
    }
  }

  incident.updates.push(update);
  incident.updatedAt = new Date().toISOString();

  setState('incidents', incidents);
  saveIncidents();

  // Déterminer le type d'audit
  const auditAction = changes.status === 'cloture' ? 'INCIDENT_CLOSED' : 'INCIDENT_UPDATED';
  logAudit(auditAction, {
    incidentId: id,
    title: incident.title,
    changes: update.changes,
    comment,
  });

  return incident;
}

/**
 * Obtenir tous les incidents
 * @param {object} filters — { type?, severity?, status?, date? }
 * @returns {Array}
 */
export function getIncidents(filters = {}) {
  const { incidents } = getState();
  let result = [...incidents];

  if (filters.type) result = result.filter(i => i.type === filters.type);
  if (filters.severity) result = result.filter(i => i.severity === filters.severity);
  if (filters.status) result = result.filter(i => i.status === filters.status);
  if (filters.date) result = result.filter(i => i.date === filters.date);

  return result;
}

/**
 * Obtenir les incidents ouverts (non résolus)
 * @returns {Array}
 */
export function getOpenIncidents() {
  return getIncidents({ status: 'ouvert' })
    .concat(getIncidents({ status: 'en_cours' }));
}

/**
 * Obtenir les incidents pour un agent
 * @param {number} agentIdx
 * @returns {Array}
 */
export function getIncidentsForAgent(agentIdx) {
  const { incidents } = getState();
  return incidents.filter(i => i.agentIdx === agentIdx);
}

/**
 * Obtenir les incidents pour une arme
 * @param {number} armeIdx
 * @returns {Array}
 */
export function getIncidentsForWeapon(armeIdx) {
  const { incidents } = getState();
  return incidents.filter(i => i.armeIdx === armeIdx);
}

/**
 * Obtenir les incidents du jour
 * @returns {Array}
 */
export function getTodayIncidents() {
  return getIncidents({ date: todayStr() });
}

/**
 * Statistiques des incidents
 * @returns {object}
 */
export function getIncidentStats() {
  const { incidents } = getState();
  return {
    total: incidents.length,
    ouverts: incidents.filter(i => i.status === 'ouvert').length,
    enCours: incidents.filter(i => i.status === 'en_cours').length,
    resolus: incidents.filter(i => i.status === 'resolu').length,
    clotures: incidents.filter(i => i.status === 'cloture').length,
    critiques: incidents.filter(i => i.severity === 'critique' && i.status !== 'cloture').length,
    graves: incidents.filter(i => i.severity === 'grave' && i.status !== 'cloture').length,
    today: getTodayIncidents().length,
  };
}

/**
 * Supprimer un incident (uniquement si clôturé)
 * @param {string} id
 * @returns {boolean}
 */
export function deleteIncident(id) {
  const { incidents } = getState();
  const idx = incidents.findIndex(i => i.id === id);
  if (idx === -1) return false;

  const incident = incidents[idx];
  if (incident.status !== 'cloture') return false;

  incidents.splice(idx, 1);
  setState('incidents', incidents);
  saveIncidents();
  return true;
}

// Domain module: Orders and quote requests management
// localStorage key: 'reg_commandes'
// Array of { id, type, numero, date, fournisseurId, fournisseurNom, lignes[], totalHT, tva, totalTTC, statut, notes }
// type: 'demande_devis' = Demande de devis (envoyé au fournisseur pour obtenir une offre de prix)
//       'commande'      = Bon de commande (après acceptation d'un devis)

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_commandes';

export function loadCommandes() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('commandes', data);
}

export function saveCommandes() {
  const { commandes } = getState();
  storage.set(STORAGE_KEY, commandes);
}

/**
 * Generate next order/quote number
 * Format: DEV-2026-001 or CMD-2026-001
 */
export function generateNumero(type) {
  const { commandes } = getState();
  const prefix = type === 'demande_devis' ? 'DDD' : 'CMD';
  const year = new Date().getFullYear();
  const sameTypeYear = commandes.filter(c => c.type === type && c.numero && c.numero.includes(`${year}`));
  const num = sameTypeYear.length + 1;
  return `${prefix}-${year}-${String(num).padStart(3, '0')}`;
}

/**
 * Create a new order or quote
 */
export function createCommande({ type, fournisseurId, fournisseurNom, lignes = [], notes = '' }) {
  const { commandes } = getState();
  const numero = generateNumero(type);
  const commande = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    type,
    numero,
    date: new Date().toISOString().split('T')[0],
    fournisseurId,
    fournisseurNom,
    lignes,
    totalHT: 0,
    tva: 20,
    totalTTC: 0,
    statut: 'brouillon',
    notes,
  };
  recalculateTotals(commande);
  commandes.unshift(commande);
  saveCommandes();
  return commande;
}

/**
 * Update an existing order/quote
 */
export function updateCommande(id, updates) {
  const { commandes } = getState();
  const c = commandes.find(c => c.id === id);
  if (!c) return null;
  Object.assign(c, updates);
  if (updates.lignes) recalculateTotals(c);
  saveCommandes();
  return c;
}

/**
 * Add a line to an order/quote
 */
export function addLigne(commandeId, { designation, quantite, prixUnitaire }) {
  const { commandes } = getState();
  const c = commandes.find(c => c.id === commandeId);
  if (!c) return null;
  c.lignes.push({
    designation,
    quantite,
    prixUnitaire,
    total: quantite * prixUnitaire,
  });
  recalculateTotals(c);
  saveCommandes();
  return c;
}

/**
 * Remove a line from an order/quote
 */
export function removeLigne(commandeId, ligneIdx) {
  const { commandes } = getState();
  const c = commandes.find(c => c.id === commandeId);
  if (!c || !c.lignes[ligneIdx]) return null;
  c.lignes.splice(ligneIdx, 1);
  recalculateTotals(c);
  saveCommandes();
  return c;
}

/**
 * Change status of an order/quote
 */
export function changeStatut(id, newStatut) {
  const { commandes } = getState();
  const c = commandes.find(c => c.id === id);
  if (!c) return null;
  c.statut = newStatut;
  saveCommandes();
  return c;
}

/**
 * Delete an order/quote
 */
export function deleteCommande(id) {
  const { commandes } = getState();
  const idx = commandes.findIndex(c => c.id === id);
  if (idx === -1) return false;
  commandes.splice(idx, 1);
  saveCommandes();
  return true;
}

/**
 * Recalculate totals for an order/quote
 */
function recalculateTotals(commande) {
  commande.totalHT = commande.lignes.reduce((sum, l) => {
    l.total = l.quantite * l.prixUnitaire;
    return sum + l.total;
  }, 0);
  commande.totalTTC = commande.totalHT * (1 + commande.tva / 100);
}

/**
 * Get commandes filtered by type
 */
export function getCommandesByType(type) {
  const { commandes } = getState();
  return commandes.filter(c => c.type === type);
}

/**
 * Create a commande from purchase needs
 */
export function createFromNeeds(type, fournisseurId, fournisseurNom, needs, priceMap = {}) {
  const lignes = needs.map(n => ({
    designation: `Munitions ${n.nom}${n.ref ? ' (' + n.ref + ')' : ''}`,
    quantite: n.quantiteBesoin,
    prixUnitaire: priceMap[n.machineIdx] || 0,
    total: n.quantiteBesoin * (priceMap[n.machineIdx] || 0),
  }));
  return createCommande({ type, fournisseurId, fournisseurNom, lignes });
}

/**
 * Get a commande by ID
 */
export function getCommandeById(id) {
  const { commandes } = getState();
  return commandes.find(c => c.id === id) || null;
}

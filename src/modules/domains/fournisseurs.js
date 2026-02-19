// Domain module: Suppliers management
// localStorage key: 'reg_fournisseurs'
// Array of { id, nom, contact, telephone, email, adresse, notes, produits[] }

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_fournisseurs';

export function loadFournisseurs() {
  const data = storage.get(STORAGE_KEY);
  if (data) setState('fournisseurs', data);
}

export function saveFournisseurs() {
  const { fournisseurs } = getState();
  storage.set(STORAGE_KEY, fournisseurs);
}

/**
 * Add a new supplier
 */
export function addFournisseur({ nom, contact = '', telephone = '', email = '', adresse = '', notes = '' }) {
  const { fournisseurs } = getState();
  const fournisseur = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    nom,
    contact,
    telephone,
    email,
    adresse,
    notes,
    produits: [],
  };
  fournisseurs.push(fournisseur);
  saveFournisseurs();
  return fournisseur;
}

/**
 * Update an existing supplier
 */
export function updateFournisseur(id, updates) {
  const { fournisseurs } = getState();
  const f = fournisseurs.find(f => f.id === id);
  if (!f) return null;
  Object.assign(f, updates);
  saveFournisseurs();
  return f;
}

/**
 * Delete a supplier
 */
export function deleteFournisseur(id) {
  const { fournisseurs } = getState();
  const idx = fournisseurs.findIndex(f => f.id === id);
  if (idx === -1) return false;
  fournisseurs.splice(idx, 1);
  saveFournisseurs();
  return true;
}

/**
 * Add a product to a supplier's catalog
 */
export function addProduit(fournisseurId, { designation, prixUnitaire = 0, conditionnement = '', prixBoite = 0, delaiJours = 0 }) {
  const { fournisseurs } = getState();
  const f = fournisseurs.find(f => f.id === fournisseurId);
  if (!f) return null;
  const produit = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    designation,
    prixUnitaire,
    conditionnement,
    prixBoite,
    delaiJours,
  };
  f.produits.push(produit);
  saveFournisseurs();
  return produit;
}

/**
 * Update a product in a supplier's catalog
 */
export function updateProduit(fournisseurId, produitId, updates) {
  const { fournisseurs } = getState();
  const f = fournisseurs.find(f => f.id === fournisseurId);
  if (!f) return null;
  const p = f.produits.find(p => p.id === produitId);
  if (!p) return null;
  Object.assign(p, updates);
  saveFournisseurs();
  return p;
}

/**
 * Delete a product from a supplier's catalog
 */
export function deleteProduit(fournisseurId, produitId) {
  const { fournisseurs } = getState();
  const f = fournisseurs.find(f => f.id === fournisseurId);
  if (!f) return false;
  const idx = f.produits.findIndex(p => p.id === produitId);
  if (idx === -1) return false;
  f.produits.splice(idx, 1);
  saveFournisseurs();
  return true;
}

/**
 * Get a supplier by ID
 */
export function getFournisseurById(id) {
  const { fournisseurs } = getState();
  return fournisseurs.find(f => f.id === id) || null;
}

/**
 * Compare prices across suppliers for a product designation
 */
export function comparePrices(designation) {
  const { fournisseurs } = getState();
  const results = [];
  for (const f of fournisseurs) {
    for (const p of f.produits) {
      if (p.designation.toLowerCase().includes(designation.toLowerCase())) {
        results.push({
          fournisseurId: f.id,
          fournisseurNom: f.nom,
          ...p,
        });
      }
    }
  }
  return results.sort((a, b) => a.prixUnitaire - b.prixUnitaire);
}

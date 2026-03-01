// =============================================
// auth-guard.js — Contrôle d'accès par rôle
// Phase 7 : guards au niveau route + per-element
// =============================================

import { getCurrentProfile, ACCESS, getDeviceRole } from './auth-state.js';

/**
 * Apply role-based UI restrictions.
 * Called after auth init, on auth state changes, and when pages mount.
 * All element lookups are null-guarded (safe to call from any page).
 */
export function applyRoleGuards() {
  const deviceRole = getDeviceRole();

  // Pas de rôle défini → afficher l'écran de sélection (z-index: 2000)
  if (!deviceRole) {
    const roleScreen = document.getElementById('roleSelectScreen');
    if (roleScreen) roleScreen.style.display = 'flex';
    return;
  }

  const profile = getCurrentProfile();
  if (!profile) {
    const roleScreen = document.getElementById('roleSelectScreen');
    if (roleScreen) roleScreen.style.display = 'flex';
    return;
  }

  // Cacher l'écran de sélection de rôle
  const roleScreen = document.getElementById('roleSelectScreen');
  if (roleScreen) roleScreen.style.display = 'none';

  // === Éléments du registre (null-guardés — no-op si page non montée) ===

  // Header config button (registre)
  toggleElement('btnOpenConfig', ACCESS.canViewConfig());

  // Présents du jour + Équipages: responsable only
  toggleElement('presencePromptBox', ACCESS.canViewConfig());
  toggleElement('crewPromptBox', ACCESS.canViewConfig());

  // Reset: chef+ only
  toggleElement('btnReset', ACCESS.canResetDay());

  // PDF: chef+ only
  toggleElement('btnPDF', ACCESS.canResetDay());

  // Full reset (page config): responsable+ only
  toggleElement('btnFullReset', ACCESS.canFullReset());

  // Visa: armurier+ only
  toggleElement('visaMatinBtn', ACCESS.canSignVisa());
  toggleElement('visaSoirBtn', ACCESS.canSignVisa());
  toggleElement('visaSignerSelect', ACCESS.canSignVisa());
}

/**
 * Hide/show an element by ID (null-guarded)
 */
function toggleElement(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  if (visible) {
    el.classList.remove('hidden-by-role');
    el.removeAttribute('aria-hidden');
  } else {
    el.classList.add('hidden-by-role');
    el.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Check guard before executing an action.
 * Shows alert if not permitted.
 * @param {string} action - Action key from ACCESS
 * @returns {boolean} true if allowed
 */
export function guardAction(action) {
  const checkFn = ACCESS[action];
  if (!checkFn) return true;

  if (!checkFn()) {
    alert("Vous n'avez pas les droits nécessaires pour cette action.");
    return false;
  }
  return true;
}

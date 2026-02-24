// Phase 5: Route/feature guards based on user role
// Applies visibility and interaction restrictions per role

import { getCurrentProfile, ACCESS, getDeviceRole } from './auth-state.js';

/**
 * Apply role-based UI restrictions
 * Called after auth init and on auth state changes
 */
export function applyRoleGuards() {
  const deviceRole = getDeviceRole();

  // Pas de rôle défini → l'écran de sélection s'affichera
  if (!deviceRole) {
    hideApp();
    return;
  }

  const profile = getCurrentProfile();
  if (!profile) {
    hideApp();
    return;
  }

  showApp();

  // Config button: armurier+ only (= responsable en mode local)
  toggleElement('btnOpenConfig', ACCESS.canViewConfig());

  // Configuration des moyens (pavé raccourcis): responsable uniquement
  toggleElement('sectionConfigMoyens', ACCESS.canViewConfig());

  // Présents du jour + Équipages: responsable uniquement
  toggleElement('presencePromptBox', ACCESS.canViewConfig());
  toggleElement('crewPromptBox', ACCESS.canViewConfig());

  // Reset button: chef+ only
  toggleElement('btnReset', ACCESS.canResetDay());

  // PDF generation: chef+ only
  toggleElement('btnPDF', ACCESS.canResetDay());

  // Full reset button: responsable+ only
  toggleElement('btnFullReset', ACCESS.canFullReset());

  // Visa signing: armurier+ only
  toggleElement('visaMatinBtn', ACCESS.canSignVisa());
  toggleElement('visaSoirBtn', ACCESS.canSignVisa());
  toggleElement('visaSignerSelect', ACCESS.canSignVisa());

  // Stock & Logistique: chef+ only (= responsable en mode local)
  toggleElement('btnOpenStock', ACCESS.canViewStock());

  // PV (Procès-Verbaux): chef+ only (= responsable en mode local)
  toggleElement('btnOpenPV', ACCESS.canViewPV());

  // Vocal reports: all can create, chef+ can delete others
  // (deletion guard is in vocal-panel.js)
}

/**
 * Hide/show an element by ID
 */
function toggleElement(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  if (visible) {
    el.style.removeProperty('display');
    el.removeAttribute('aria-hidden');
  } else {
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Hide the main app (show role selection screen)
 */
function hideApp() {
  const roleScreen = document.getElementById('roleSelectScreen');
  if (roleScreen) roleScreen.style.display = 'flex';

  // Hide main content sections
  const mainSections = document.querySelectorAll('header, .section, .period-tabs, #employeesList, .bottom-bar, #presenceBadgeArea, #crewBadgeArea, #lockedBanner, #pageNumberBadge');
  mainSections.forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Show the main app (hide role selection screen)
 */
function showApp() {
  const roleScreen = document.getElementById('roleSelectScreen');
  if (roleScreen) roleScreen.style.display = 'none';

  // Show main content sections (sauf celles gérées par les gardes de rôle)
  const guardedIds = ['sectionConfigMoyens', 'presencePromptBox', 'crewPromptBox'];
  const mainSections = document.querySelectorAll('header, .section, .period-tabs, #employeesList, .bottom-bar, #pageNumberBadge');
  mainSections.forEach(el => {
    if (!guardedIds.includes(el.id)) {
      el.style.removeProperty('display');
    }
  });
}

/**
 * Check guard before executing an action
 * Shows alert if not permitted
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

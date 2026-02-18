// Phase 5: Route/feature guards based on user role
// Applies visibility and interaction restrictions per role

import { getCurrentProfile, hasMinRole, ACCESS } from './auth-state.js';
import { isSupabaseEnabled } from '../supabase/client.js';

/**
 * Apply role-based UI restrictions
 * Called after auth init and on auth state changes
 */
export function applyRoleGuards() {
  // In offline mode (no Supabase), grant full access
  if (!isSupabaseEnabled()) return;

  const profile = getCurrentProfile();
  if (!profile) {
    // Not logged in — hide everything except login
    hideApp();
    return;
  }

  showApp();

  // Config button: armurier+ only
  toggleElement('btnOpenConfig', ACCESS.canViewConfig());

  // Reset button: chef+ only
  toggleElement('btnReset', ACCESS.canResetDay());

  // Full reset button: responsable+ only
  toggleElement('btnFullReset', ACCESS.canFullReset());

  // Export/Import buttons: chef+ only
  toggleElement('btnExportConfig', ACCESS.canExportImport());
  toggleElement('btnImportConfig', ACCESS.canExportImport());

  // Visa signing: armurier+ only
  toggleElement('visaMatinBtn', ACCESS.canSignVisa());
  toggleElement('visaSoirBtn', ACCESS.canSignVisa());
  toggleElement('visaSignerSelect', ACCESS.canSignVisa());

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
 * Hide the main app (show login screen)
 */
function hideApp() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'flex';

  // Hide main content sections
  const mainSections = document.querySelectorAll('header, .section, .period-tabs, #employeesList, .bottom-bar, #presenceBadgeArea, #lockedBanner, #pageNumberBadge');
  mainSections.forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Show the main app (hide login screen)
 */
function showApp() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.style.display = 'none';

  // Show main content sections
  const mainSections = document.querySelectorAll('header, .section, .period-tabs, #employeesList, .bottom-bar, #pageNumberBadge');
  mainSections.forEach(el => {
    el.style.removeProperty('display');
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

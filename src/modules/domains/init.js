// Domain module: Application initialization
// Loads all data, sets up the initial UI state
import { getState, setState } from '../state.js';
import { todayStr } from '../utils/date.js';
import { initStorage, getRawStorage } from '../storage/storage-interface.js';
import { syncPullAll, syncPushAll, subscribeToChanges } from '../supabase/data-sync.js';
import { isSupabaseEnabled } from '../supabase/client.js';
import { loadTeam, saveTeam } from './team.js';
import { loadMachines, saveMachines } from './machines.js';
import { loadCategories } from './categories.js';
import { loadResponsables, populateVisaSignerSelect } from './responsables.js';
import { loadDayData, syncDayData } from './day-data.js';
import { loadInfoFields, saveInfoFields } from './info-fields.js';
import { loadPageNumber, updatePageNumberDisplay } from './page-number.js';
import { updatePresenceBadge } from './presence.js';
import { loadVehicles } from './crews.js';
import { updateCrewBadge } from './crew-assignment.js';
import { loadVocalReports } from './vocal-data.js';
import { loadStockMunitions } from './stock-munitions.js';
import { loadStockArmes } from './stock-armes.js';
import { loadStockMouvements } from './stock-mouvements.js';
import { loadPrevisionsTir } from './previsions-tir.js';
import { loadFournisseurs } from './fournisseurs.js';
import { loadCommandes } from './commandes.js';

let _callbacks = {};
export function bindInitCallbacks(callbacks) {
  _callbacks = callbacks;
}

export async function init() {
  // Phase 2: Initialize IndexedDB storage (migrates from localStorage on first run)
  await initStorage();

  // Phase 4: Pull remote data from Supabase BEFORE loading into state
  // This ensures we have the latest data from other devices
  if (isSupabaseEnabled()) {
    try {
      const rawStorage = getRawStorage();
      const updated = await syncPullAll(rawStorage);
      const updatedKeys = Object.keys(updated);
      if (updatedKeys.length > 0) {
        console.log('📥 Données synchronisées depuis le serveur:', updatedKeys.join(', '));
      } else {
        // First time with Supabase? Push all local data
        await syncPushAll(rawStorage);
      }
    } catch (e) {
      console.warn('⚠️ Sync pull au démarrage échoué (mode hors-ligne):', e);
    }
  }

  document.getElementById('dateJour').value = todayStr();
  loadTeam();
  loadMachines();
  loadCategories();
  loadResponsables();
  loadVehicles();
  loadDayData();
  loadInfoFields();
  loadPageNumber();
  loadVocalReports();
  loadStockMunitions();
  loadStockArmes();
  loadStockMouvements();
  loadPrevisionsTir();
  loadFournisseurs();
  loadCommandes();
  populateVisaSignerSelect();

  const { team } = getState();
  if (team.length === 0) {
    const newTeam = [];
    const newMachines = [];
    for (let i = 0; i < 10; i++) {
      newTeam.push({ nom: '', matricule: '', telephone: '', asvp: false });
      newMachines.push({ nom: '', ref: '', cat: '' });
    }
    setState('team', newTeam);
    setState('machines', newMachines);
    saveTeam();
    saveMachines();
    setTimeout(() => {
      if (_callbacks.openConfig) _callbacks.openConfig();
    }, 300);
  }

  syncDayData();
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  updateCrewBadge();
  updatePageNumberDisplay();
  if (_callbacks.updateSoirTabState) _callbacks.updateSoirTabState();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();

  // Bind info field save on input
  ['entreprise', 'dateJour', 'refChantier', 'responsable', 'adresseChantier'].forEach((id) =>
    document.getElementById(id).addEventListener('input', saveInfoFields)
  );
  document.getElementById('dateJour').addEventListener('change', updatePageNumberDisplay);

  // Phase 4: Subscribe to real-time changes from other devices
  if (isSupabaseEnabled()) {
    const rawStorage = getRawStorage();
    subscribeToChanges(rawStorage, (key, _value) => {
      // When data changes from another device, reload the affected module
      console.log(`🔄 Mise à jour en temps réel reçue: ${key}`);
      _reloadFromStorage(key);
    });
  }

  // Auto-open presence selector if no one is selected and there are employees
  const { presentToday, team: currentTeam } = getState();
  if (presentToday.length === 0 && currentTeam.some((t) => t.nom)) {
    setTimeout(() => {
      if (_callbacks.openPresenceSelector) _callbacks.openPresenceSelector();
    }, 500);
  }
}

/**
 * Reload a specific module from storage after a real-time sync update
 */
function _reloadFromStorage(key) {
  switch (key) {
    case 'reg_team':
      loadTeam();
      break;
    case 'reg_machines':
      loadMachines();
      break;
    case 'reg_categories':
      loadCategories();
      break;
    case 'reg_resp':
      loadResponsables();
      populateVisaSignerSelect();
      break;
    case 'reg_day':
      loadDayData();
      syncDayData();
      break;
    case 'reg_info':
      loadInfoFields();
      break;
    case 'reg_page':
      loadPageNumber();
      updatePageNumberDisplay();
      break;
    case 'reg_vehicles':
      loadVehicles();
      break;
    case 'reg_vocal':
      loadVocalReports();
      break;
    case 'reg_stock_munitions':
      loadStockMunitions();
      break;
    case 'reg_stock_armes':
      loadStockArmes();
      break;
    case 'reg_stock_mouvements':
      loadStockMouvements();
      break;
    case 'reg_previsions_tir':
      loadPrevisionsTir();
      break;
    case 'reg_fournisseurs':
      loadFournisseurs();
      break;
    case 'reg_commandes':
      loadCommandes();
      break;
    default:
      return; // Unknown key, skip UI refresh
  }
  // Refresh the UI after reloading data
  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updatePresenceBadge();
  updateCrewBadge();
  if (_callbacks.updateSoirTabState) _callbacks.updateSoirTabState();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();
}

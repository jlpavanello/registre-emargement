// Domain module: Application initialization
// Loads all data, sets up the initial UI state
import { getState, setState } from '../state.js';
import { todayStr } from '../utils/date.js';
import { loadTeam, saveTeam } from './team.js';
import { loadMachines, saveMachines } from './machines.js';
import { loadCategories } from './categories.js';
import { loadResponsables, populateVisaSignerSelect } from './responsables.js';
import { loadDayData, syncDayData } from './day-data.js';
import { loadInfoFields, saveInfoFields } from './info-fields.js';
import { loadPageNumber, updatePageNumberDisplay } from './page-number.js';
import { updatePresenceBadge } from './presence.js';

let _callbacks = {};
export function bindInitCallbacks(callbacks) {
  _callbacks = callbacks;
}

export function init() {
  document.getElementById('dateJour').value = todayStr();
  loadTeam();
  loadMachines();
  loadCategories();
  loadResponsables();
  loadDayData();
  loadInfoFields();
  loadPageNumber();
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
  updatePageNumberDisplay();
  if (_callbacks.updateSoirTabState) _callbacks.updateSoirTabState();
  if (_callbacks.updateVisaButtonState) _callbacks.updateVisaButtonState();

  // Bind info field save on input
  ['entreprise', 'dateJour', 'refChantier', 'responsable', 'adresseChantier'].forEach((id) =>
    document.getElementById(id).addEventListener('input', saveInfoFields)
  );
  document.getElementById('dateJour').addEventListener('change', updatePageNumberDisplay);

  // Auto-open presence selector if no one is selected and there are employees
  const { presentToday, team: currentTeam } = getState();
  if (presentToday.length === 0 && currentTeam.some((t) => t.nom)) {
    setTimeout(() => {
      if (_callbacks.openPresenceSelector) _callbacks.openPresenceSelector();
    }, 500);
  }
}

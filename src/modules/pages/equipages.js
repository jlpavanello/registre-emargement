// =============================================
// equipages.js — Page Équipages véhicules
// Assigner agents aux véhicules, désigner conducteurs
// =============================================

import { navigate } from '../router.js';
import {
  openCrewSelector, closeCrewSelector,
  saveCrewAssignments, onVehicleSelect, onAgentSelect,
} from '../domains/crew-assignment.js';

// --- Template ---

function getTemplate() {
  return `
<div class="crew-overlay active" id="crewPanel">
  <div class="crew-header">
    <h2>\uD83D\uDE97 \u00c9quipages v\u00e9hicules</h2>
    <button class="header-btn" id="btnCloseCrew" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="crew-info">Choisissez un v\u00e9hicule, puis ajoutez les agents de l'\u00e9quipage.</div>
  <div class="crew-select-section">
    <label class="crew-select-label">V\u00e9hicule</label>
    <select id="crewVehicleSelect" class="crew-select">
      <option value="">— Choisir un v\u00e9hicule —</option>
    </select>
  </div>
  <div class="crew-select-section" id="crewAgentSection" style="display:none;">
    <label class="crew-select-label">Ajouter un agent \u00e0 l'\u00e9quipage</label>
    <select id="crewAgentSelect" class="crew-select">
      <option value="">— Choisir un agent —</option>
    </select>
  </div>
  <div id="crewAssignedList" style="display:none;">
    <div class="crew-assigned-header">
      <span id="crewAssignedTitle">\u00c9quipage</span>
      <span class="crew-count" id="crewCount">0 agent</span>
    </div>
    <div id="crewAssignedMembers"></div>
  </div>
  <div id="crewSummary"></div>
  <div style="height:90px;"></div>
  <div class="crew-bottom"><button class="btn-crew-save" id="btnSaveCrew">Valider les \u00e9quipages</button></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseCrew').addEventListener('click', () => navigate('/'));
  document.getElementById('btnSaveCrew').addEventListener('click', () => {
    saveCrewAssignments();
    navigate('/registre');
  });
  document.getElementById('crewVehicleSelect').addEventListener('change', onVehicleSelect);
  document.getElementById('crewAgentSelect').addEventListener('change', onAgentSelect);
}

// --- Page export ---

export const equipagesPage = {
  title: '\u00c9quipages',
  mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    openCrewSelector();
  },
  unmount() {},
};

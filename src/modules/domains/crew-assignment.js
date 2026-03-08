// Domain module: Crew assignment
// Manages assignment of present employees to vehicles (équipages)
// UI: vehicle dropdown → agent dropdown → assigned list with driver toggle

import { getState, setState } from '../state.js';
import { getActiveVehicles, getVehicleLabel } from './crews.js';
import { getPresentTeam } from './team.js';
import { saveDayData } from './day-data.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../ui/toast.js';

// Late-binding callbacks
let _callbacks = {};
export function bindCrewCallbacks(callbacks) {
  _callbacks = callbacks;
}

// Currently selected vehicle index in the overlay
let _selectedVehicleIdx = null;

/**
 * Open the crew assignment overlay
 */
export function openCrewSelector() {
  const { crewAssignments, crewDrivers } = getState();
  // Deep copy current assignments into temp
  const temp = {};
  for (const vIdx of Object.keys(crewAssignments)) {
    temp[vIdx] = [...crewAssignments[vIdx]];
  }
  setState('tempCrewAssignments', temp);
  setState('tempCrewDrivers', { ...crewDrivers });

  _selectedVehicleIdx = null;
  document.getElementById('crewPanel').classList.add('active');
  populateVehicleSelect();
  hideAgentSection();
  hideAssignedList();
  renderCrewSummary();
}

/**
 * Close the crew assignment overlay
 */
export function closeCrewSelector() {
  document.getElementById('crewPanel').classList.remove('active');
}

/**
 * Populate the vehicle dropdown
 */
function populateVehicleSelect() {
  const sel = document.getElementById('crewVehicleSelect');
  const vehicles = getActiveVehicles();
  const { tempCrewAssignments } = getState();
  sel.innerHTML = '<option value="">— Choisir un véhicule —</option>';
  vehicles.forEach((v) => {
    // Hide vehicles that already have a crew (except the currently selected one)
    const hasMembers = (tempCrewAssignments[v.idx] || []).length > 0;
    if (hasMembers && v.idx !== _selectedVehicleIdx) return;
    const label = escapeHtml(v.marque) + (v.immatriculation ? ' — ' + escapeHtml(v.immatriculation) : '');
    sel.innerHTML += `<option value="${v.idx}">${label}</option>`;
  });
}

/**
 * When a vehicle is selected from the dropdown
 */
export function onVehicleSelect() {
  const sel = document.getElementById('crewVehicleSelect');
  const val = sel.value;
  if (val === '') {
    _selectedVehicleIdx = null;
    hideAgentSection();
    hideAssignedList();
    return;
  }
  _selectedVehicleIdx = +val;
  showAgentSection();
  populateAgentSelect();
  renderAssignedList();
}

/**
 * Populate the agent dropdown with present agents not yet assigned to this vehicle
 */
function populateAgentSelect() {
  const sel = document.getElementById('crewAgentSelect');
  const presentTeam = getPresentTeam();
  const { tempCrewAssignments } = getState();
  const assigned = tempCrewAssignments[_selectedVehicleIdx] || [];

  sel.innerHTML = '<option value="">— Choisir un agent —</option>';
  presentTeam.forEach((emp) => {
    // Hide if already in THIS vehicle
    if (assigned.includes(emp.idx)) return;
    // Hide if already assigned to another vehicle
    const otherV = _getOtherVehicleFor(emp.idx, _selectedVehicleIdx, tempCrewAssignments);
    if (otherV !== null) return;
    const asvpTag = emp.asvp ? ' [ASVP]' : '';
    sel.innerHTML += `<option value="${emp.idx}">${escapeHtml(emp.nom)}${asvpTag}</option>`;
  });
}

/**
 * When an agent is selected from the dropdown → add to vehicle
 */
export function onAgentSelect() {
  const sel = document.getElementById('crewAgentSelect');
  const val = sel.value;
  if (val === '' || _selectedVehicleIdx === null) return;

  const empIdx = +val;
  const { tempCrewAssignments, tempCrewDrivers } = getState();

  // Remove from any other vehicle first
  for (const vIdx of Object.keys(tempCrewAssignments)) {
    const arr = tempCrewAssignments[vIdx];
    const j = arr.indexOf(empIdx);
    if (j >= 0) {
      arr.splice(j, 1);
      if (tempCrewDrivers[vIdx] === empIdx) {
        delete tempCrewDrivers[vIdx];
      }
    }
  }

  // Add to selected vehicle
  if (!tempCrewAssignments[_selectedVehicleIdx]) {
    tempCrewAssignments[_selectedVehicleIdx] = [];
  }
  tempCrewAssignments[_selectedVehicleIdx].push(empIdx);

  setState('tempCrewAssignments', tempCrewAssignments);
  setState('tempCrewDrivers', tempCrewDrivers);

  // Reset dropdown and refresh
  sel.value = '';
  populateAgentSelect();
  renderAssignedList();
  renderCrewSummary();
}

/**
 * Remove an agent from the currently selected vehicle
 */
function removeAgentFromCrew(empIdx) {
  const { tempCrewAssignments, tempCrewDrivers } = getState();
  const arr = tempCrewAssignments[_selectedVehicleIdx] || [];
  const i = arr.indexOf(empIdx);
  if (i >= 0) arr.splice(i, 1);

  if (tempCrewDrivers[_selectedVehicleIdx] === empIdx) {
    delete tempCrewDrivers[_selectedVehicleIdx];
  }

  setState('tempCrewAssignments', tempCrewAssignments);
  setState('tempCrewDrivers', tempCrewDrivers);

  populateAgentSelect();
  renderAssignedList();
  renderCrewSummary();
}

/**
 * Toggle driver for an agent in the selected vehicle
 */
function toggleDriver(empIdx) {
  const { tempCrewDrivers } = getState();
  if (tempCrewDrivers[_selectedVehicleIdx] === empIdx) {
    delete tempCrewDrivers[_selectedVehicleIdx];
  } else {
    tempCrewDrivers[_selectedVehicleIdx] = empIdx;
  }
  setState('tempCrewDrivers', tempCrewDrivers);
  renderAssignedList();
  renderCrewSummary();
}

/**
 * Render the list of agents assigned to the selected vehicle
 */
function renderAssignedList() {
  const container = document.getElementById('crewAssignedMembers');
  const titleEl = document.getElementById('crewAssignedTitle');
  const countEl = document.getElementById('crewCount');
  const wrapper = document.getElementById('crewAssignedList');

  if (_selectedVehicleIdx === null) { hideAssignedList(); return; }

  const { tempCrewAssignments, tempCrewDrivers, team } = getState();
  const assigned = tempCrewAssignments[_selectedVehicleIdx] || [];
  const driverIdx = tempCrewDrivers[_selectedVehicleIdx];

  wrapper.style.display = 'block';
  titleEl.textContent = 'Équipage — ' + getVehicleLabel(_selectedVehicleIdx);
  countEl.textContent = assigned.length + ' agent' + (assigned.length > 1 ? 's' : '');

  container.innerHTML = '';

  if (assigned.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:24px;">
      <div class="empty-state-icon">\uD83D\uDE94</div>
      <div class="empty-state-title">Aucun agent dans cet \u00e9quipage</div>
      <p>Choisissez un agent ci-dessus pour l'ajouter \u00e0 cet \u00e9quipage.</p>
    </div>`;
    return;
  }

  assigned.forEach((empIdx) => {
    const emp = team[empIdx];
    if (!emp) return;
    const isDriver = driverIdx === empIdx;

    const row = document.createElement('div');
    row.className = 'crew-assigned-row' + (isDriver ? ' is-driver' : '');
    row.innerHTML = `
      <div class="crew-assigned-info">
        <span class="crew-assigned-name">${escapeHtml(emp.nom)}</span>
        ${emp.matricule ? `<span class="crew-assigned-mat">Mat. ${escapeHtml(emp.matricule)}</span>` : ''}
        ${emp.asvp ? '<span class="crew-assigned-asvp">ASVP</span>' : ''}
        ${isDriver ? '<span class="crew-assigned-driver-tag">Conducteur</span>' : ''}
      </div>
      <div class="crew-assigned-actions">
        <button class="crew-driver-btn ${isDriver ? 'active' : ''}" title="${isDriver ? 'Conducteur du jour' : 'Désigner comme conducteur'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
        </button>
        <button class="crew-remove-btn" title="Retirer de l'équipage">Supprimer</button>
      </div>
    `;

    // Driver button
    row.querySelector('.crew-driver-btn').addEventListener('click', () => toggleDriver(empIdx));
    // Remove button
    row.querySelector('.crew-remove-btn').addEventListener('click', () => removeAgentFromCrew(empIdx));

    container.appendChild(row);
  });
}

/**
 * Render summary of ALL crews at the bottom
 */
function renderCrewSummary() {
  const container = document.getElementById('crewSummary');
  const { tempCrewAssignments, tempCrewDrivers, team } = getState();
  const vehicles = getActiveVehicles();

  let html = '';
  let totalCrews = 0;

  vehicles.forEach((v) => {
    const assigned = tempCrewAssignments[v.idx] || [];
    if (assigned.length === 0) return;
    totalCrews++;
    const driverIdx = tempCrewDrivers[v.idx];

    html += `<div class="crew-summary-card">
      <div class="crew-summary-vehicle">🚔 ${escapeHtml(v.marque)}${v.immatriculation ? ' — ' + escapeHtml(v.immatriculation) : ''}</div>
      <div class="crew-summary-members">`;

    assigned.forEach((empIdx) => {
      const emp = team[empIdx];
      if (!emp) return;
      const isDriver = driverIdx === empIdx;
      html += `<span class="crew-summary-member${isDriver ? ' driver' : ''}">${escapeHtml(emp.nom)}${isDriver ? ' 🏎️' : ''}</span>`;
    });

    html += `</div>
      <div class="crew-summary-actions">
        <button class="crew-summary-edit" data-vidx="${v.idx}">Modifier</button>
        <button class="crew-summary-delete" data-vidx="${v.idx}">Supprimer</button>
      </div>
    </div>`;
  });

  if (totalCrews === 0) {
    html = `<div class="empty-state" style="padding:24px;margin-top:12px;">
      <div class="empty-state-icon">\uD83D\uDE94</div>
      <div class="empty-state-title">Aucun \u00e9quipage constitu\u00e9</div>
      <p>Commencez par choisir un v\u00e9hicule ci-dessus pour constituer un \u00e9quipage.</p>
    </div>`;
  } else {
    html = `<div class="crew-summary-title">${totalCrews} équipage${totalCrews > 1 ? 's' : ''} constitué${totalCrews > 1 ? 's' : ''}</div>` + html;
  }

  container.innerHTML = html;

  // Bind edit buttons
  container.querySelectorAll('.crew-summary-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vIdx = +btn.dataset.vidx;
      editCrew(vIdx);
    });
  });

  // Bind delete buttons
  container.querySelectorAll('.crew-summary-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vIdx = +btn.dataset.vidx;
      deleteCrew(vIdx);
    });
  });
}

/**
 * Edit an existing crew — select the vehicle in the dropdown so user can modify members
 */
function editCrew(vehicleIdx) {
  _selectedVehicleIdx = vehicleIdx;

  // Update vehicle dropdown to show this vehicle selected
  const sel = document.getElementById('crewVehicleSelect');
  populateVehicleSelect();
  sel.value = String(vehicleIdx);

  // Show agent section and assigned list
  showAgentSection();
  populateAgentSelect();
  renderAssignedList();

  // Scroll to the top so user sees the editing area
  document.getElementById('crewPanel').scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Delete an entire crew (remove all members from a vehicle)
 */
function deleteCrew(vehicleIdx) {
  const { tempCrewAssignments, tempCrewDrivers } = getState();
  delete tempCrewAssignments[vehicleIdx];
  delete tempCrewDrivers[vehicleIdx];
  setState('tempCrewAssignments', tempCrewAssignments);
  setState('tempCrewDrivers', tempCrewDrivers);

  // If we were viewing this vehicle, reset selection
  if (_selectedVehicleIdx === vehicleIdx) {
    _selectedVehicleIdx = null;
    document.getElementById('crewVehicleSelect').value = '';
    hideAgentSection();
    hideAssignedList();
  }

  populateVehicleSelect();
  renderCrewSummary();
}

// UI helpers
function showAgentSection() {
  document.getElementById('crewAgentSection').style.display = 'block';
}
function hideAgentSection() {
  document.getElementById('crewAgentSection').style.display = 'none';
}
function hideAssignedList() {
  document.getElementById('crewAssignedList').style.display = 'none';
}

/**
 * Check if an employee is assigned to another vehicle
 */
function _getOtherVehicleFor(empIdx, excludeVehicleIdx, assignments) {
  for (const vIdx of Object.keys(assignments)) {
    if (+vIdx === excludeVehicleIdx) continue;
    if (assignments[vIdx].includes(empIdx)) return +vIdx;
  }
  return null;
}

/**
 * Save crew assignments + drivers and close overlay
 */
export function saveCrewAssignments() {
  const { tempCrewAssignments, tempCrewDrivers } = getState();

  // Clean empty arrays
  const clean = {};
  for (const vIdx of Object.keys(tempCrewAssignments)) {
    if (tempCrewAssignments[vIdx].length > 0) {
      clean[vIdx] = [...tempCrewAssignments[vIdx]];
    }
  }

  // Clean drivers
  const cleanDrivers = {};
  for (const vIdx of Object.keys(tempCrewDrivers)) {
    if (clean[vIdx] && clean[vIdx].includes(tempCrewDrivers[vIdx])) {
      cleanDrivers[vIdx] = tempCrewDrivers[vIdx];
    }
  }

  setState('crewAssignments', clean);
  setState('crewDrivers', cleanDrivers);
  saveDayData();
  closeCrewSelector();

  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  if (_callbacks.afterSave) _callbacks.afterSave();
  updateCrewBadge();

  const crewCount = Object.keys(clean).length;
  if (crewCount > 0) {
    showToast(crewCount + ' \u00e9quipage' + (crewCount > 1 ? 's' : '') + ' constitu\u00e9' + (crewCount > 1 ? 's' : ''), 'success');
  } else {
    showToast('\u00c9quipages enregistr\u00e9s', 'success');
  }
}

/**
 * Get the vehicle index assigned to an employee (or null)
 */
export function getCrewForEmployee(empIdx) {
  const { crewAssignments } = getState();
  for (const vIdx of Object.keys(crewAssignments)) {
    if (crewAssignments[vIdx].includes(empIdx)) return +vIdx;
  }
  return null;
}

/**
 * Check if an employee is the driver for their assigned vehicle
 */
export function isDriverForVehicle(empIdx) {
  const { crewAssignments, crewDrivers } = getState();
  for (const vIdx of Object.keys(crewAssignments)) {
    if (crewAssignments[vIdx].includes(empIdx) && crewDrivers[vIdx] === empIdx) {
      return true;
    }
  }
  return false;
}

/**
 * Remove an employee from all crew assignments
 */
export function removeCrewAssignment(empIdx) {
  const { crewAssignments, crewDrivers } = getState();
  let changed = false;
  for (const vIdx of Object.keys(crewAssignments)) {
    const arr = crewAssignments[vIdx];
    const i = arr.indexOf(empIdx);
    if (i >= 0) {
      arr.splice(i, 1);
      changed = true;
      if (crewDrivers[vIdx] === empIdx) {
        delete crewDrivers[vIdx];
      }
    }
  }
  if (changed) {
    setState('crewAssignments', crewAssignments);
    setState('crewDrivers', crewDrivers);
    saveDayData();
  }
}

/**
 * Update the crew badge display in the main page
 */
export function updateCrewBadge() {
  const { crewAssignments } = getState();
  const vehicles = getActiveVehicles();
  const area = document.getElementById('crewBadgeArea');
  const badge = document.getElementById('crewBadge');
  if (!area || !badge) return;

  const activeCrews = vehicles.filter((v) => {
    const members = crewAssignments[v.idx] || [];
    return members.length > 0;
  });

  if (activeCrews.length > 0 && vehicles.length > 0) {
    area.style.display = 'block';
    badge.textContent = activeCrews.length + ' équipage' + (activeCrews.length > 1 ? 's' : '') + ' constitué' + (activeCrews.length > 1 ? 's' : '');
  } else if (vehicles.length > 0) {
    area.style.display = 'block';
    badge.textContent = 'Aucun équipage constitué';
  } else {
    area.style.display = 'none';
  }
}

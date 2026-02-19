// Domain module: Crew assignment
// Manages assignment of present employees to vehicles (équipages)

import { getState, setState } from '../state.js';
import { getActiveVehicles, getVehicleLabel } from './crews.js';
import { getPresentTeam } from './team.js';
import { saveDayData } from './day-data.js';

// Late-binding callbacks
let _callbacks = {};
export function bindCrewCallbacks(callbacks) {
  _callbacks = callbacks;
}

/**
 * Open the crew assignment overlay
 */
export function openCrewSelector() {
  const { crewAssignments } = getState();
  // Deep copy current assignments into temp
  const temp = {};
  for (const vIdx of Object.keys(crewAssignments)) {
    temp[vIdx] = [...crewAssignments[vIdx]];
  }
  setState('tempCrewAssignments', temp);
  document.getElementById('crewPanel').classList.add('active');
  renderCrewAssignmentList();
}

/**
 * Close the crew assignment overlay
 */
export function closeCrewSelector() {
  document.getElementById('crewPanel').classList.remove('active');
}

/**
 * Render the crew assignment list inside the overlay
 * For each active vehicle, show a card with checkboxes for present employees
 */
export function renderCrewAssignmentList() {
  const container = document.getElementById('crewAssignmentList');
  container.innerHTML = '';

  const vehicles = getActiveVehicles();
  const presentTeam = getPresentTeam();
  const { tempCrewAssignments } = getState();

  if (vehicles.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Aucun véhicule configuré. Allez dans Config pour en ajouter.</div>';
    return;
  }

  if (presentTeam.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Aucun salarié présent. Sélectionnez d\'abord les présents du jour.</div>';
    return;
  }

  vehicles.forEach((v) => {
    const assigned = tempCrewAssignments[v.idx] || [];

    const card = document.createElement('div');
    card.className = 'crew-vehicle-card';
    card.innerHTML = `
      <div class="crew-vehicle-header">
        <div class="crew-vehicle-icon">🚗</div>
        <div class="crew-vehicle-info">
          <div class="crew-vehicle-name">${v.marque}</div>
          <div class="crew-vehicle-plate">${v.immatriculation || ''}</div>
          ${v.equipement ? `<div class="crew-vehicle-equip">${v.equipement}</div>` : ''}
        </div>
        <div class="crew-vehicle-count">${assigned.length}</div>
      </div>
      <div class="crew-members-list" id="crewMembers_${v.idx}"></div>
    `;
    container.appendChild(card);

    // Render checkboxes for present employees
    const membersList = card.querySelector(`#crewMembers_${v.idx}`);
    presentTeam.forEach((emp) => {
      const isAssigned = assigned.includes(emp.idx);
      // Check if this employee is assigned to ANOTHER vehicle
      const otherVehicle = _getOtherVehicleFor(emp.idx, v.idx, tempCrewAssignments);

      const memberDiv = document.createElement('div');
      memberDiv.className = 'crew-member-check' + (isAssigned ? ' selected' : '') + (otherVehicle !== null ? ' other-vehicle' : '');
      memberDiv.innerHTML = `
        <div class="crew-check-box">${isAssigned ? '✓' : ''}</div>
        <span class="crew-member-name">${emp.nom}</span>
        ${emp.matricule ? `<span class="crew-member-mat">Mat. ${emp.matricule}</span>` : ''}
        ${otherVehicle !== null && !isAssigned ? `<span class="crew-member-other">→ ${getVehicleLabel(otherVehicle)}</span>` : ''}
      `;
      memberDiv.addEventListener('click', () => {
        toggleCrewMember(v.idx, emp.idx);
      });
      membersList.appendChild(memberDiv);
    });
  });

  updateCrewCount();
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
 * Toggle employee in/out of a vehicle
 */
export function toggleCrewMember(vehicleIdx, empIdx) {
  const { tempCrewAssignments } = getState();

  if (!tempCrewAssignments[vehicleIdx]) {
    tempCrewAssignments[vehicleIdx] = [];
  }

  const arr = tempCrewAssignments[vehicleIdx];
  const i = arr.indexOf(empIdx);

  if (i >= 0) {
    // Remove from this vehicle
    arr.splice(i, 1);
  } else {
    // Remove from any other vehicle first (one vehicle at a time)
    for (const vIdx of Object.keys(tempCrewAssignments)) {
      const otherArr = tempCrewAssignments[vIdx];
      const j = otherArr.indexOf(empIdx);
      if (j >= 0) otherArr.splice(j, 1);
    }
    // Add to this vehicle
    arr.push(empIdx);
  }

  setState('tempCrewAssignments', tempCrewAssignments);
  renderCrewAssignmentList();
}

/**
 * Update the crew count display in the overlay
 */
function updateCrewCount() {
  const { tempCrewAssignments } = getState();
  let totalAssigned = 0;
  for (const vIdx of Object.keys(tempCrewAssignments)) {
    totalAssigned += tempCrewAssignments[vIdx].length;
  }
  const el = document.getElementById('crewCount');
  if (el) {
    el.innerHTML = `<span>${totalAssigned}</span> salarié${totalAssigned > 1 ? 's' : ''} affecté${totalAssigned > 1 ? 's' : ''}`;
  }
}

/**
 * Save crew assignments and close overlay
 */
export function saveCrewAssignments() {
  const { tempCrewAssignments } = getState();

  // Clean empty arrays
  const clean = {};
  for (const vIdx of Object.keys(tempCrewAssignments)) {
    if (tempCrewAssignments[vIdx].length > 0) {
      clean[vIdx] = [...tempCrewAssignments[vIdx]];
    }
  }

  setState('crewAssignments', clean);
  saveDayData();
  closeCrewSelector();

  if (_callbacks.renderEmployees) _callbacks.renderEmployees();
  if (_callbacks.updateCounts) _callbacks.updateCounts();
  updateCrewBadge();
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
 * Remove an employee from all crew assignments
 * Called when removing someone from present list
 */
export function removeCrewAssignment(empIdx) {
  const { crewAssignments } = getState();
  let changed = false;
  for (const vIdx of Object.keys(crewAssignments)) {
    const arr = crewAssignments[vIdx];
    const i = arr.indexOf(empIdx);
    if (i >= 0) {
      arr.splice(i, 1);
      changed = true;
    }
  }
  if (changed) {
    setState('crewAssignments', crewAssignments);
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

  // Count vehicles with at least one member
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

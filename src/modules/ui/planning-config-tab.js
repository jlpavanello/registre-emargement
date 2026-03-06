// =============================================
// planning-config-tab.js — Onglet Configuration du Planning
// Permet de personnaliser les horaires des créneaux
// =============================================

import { getPlanningShifts, updateShift, getShiftDuration } from '../domains/planning-shifts.js';

// Créneaux configurables (les 3 principaux)
const CONFIGURABLE_SHIFTS = ['matin', 'aprem', 'journee'];

/**
 * Calcule la durée formatée d'un créneau
 */
function formatDuration(shift) {
  const hours = getShiftDuration(shift);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

/**
 * Génère le template HTML pour un créneau configurable
 */
function shiftCardTemplate(shift) {
  const duration = formatDuration(shift);
  return `
    <div class="planning-config-card" data-shift-id="${shift.id}">
      <div class="planning-config-card-header">
        <span class="planning-config-icon" style="background:${shift.couleur}">${shift.icon}</span>
        <span class="planning-config-title">${shift.nom}</span>
        <span class="planning-config-duration" id="duration-${shift.id}">${duration}</span>
      </div>
      <div class="planning-config-fields">
        <div class="planning-config-field-group">
          <label class="planning-config-label" for="start-${shift.id}">Début</label>
          <input type="time" id="start-${shift.id}" class="planning-field planning-config-time"
                 value="${shift.heureDebut}" data-shift="${shift.id}" data-prop="heureDebut">
        </div>
        <div class="planning-config-separator">→</div>
        <div class="planning-config-field-group">
          <label class="planning-config-label" for="end-${shift.id}">Fin</label>
          <input type="time" id="end-${shift.id}" class="planning-field planning-config-time"
                 value="${shift.heureFin}" data-shift="${shift.id}" data-prop="heureFin">
        </div>
      </div>
    </div>
  `;
}

/**
 * Met à jour l'affichage de la durée quand un horaire change
 */
function updateDurationDisplay(shiftId) {
  const startInput = document.getElementById(`start-${shiftId}`);
  const endInput = document.getElementById(`end-${shiftId}`);
  const durationEl = document.getElementById(`duration-${shiftId}`);
  if (!startInput || !endInput || !durationEl) return;

  const tempShift = { heureDebut: startInput.value, heureFin: endInput.value };
  durationEl.textContent = formatDuration(tempShift);
}

/**
 * Sauvegarde les horaires modifiés
 */
function saveConfig() {
  const cards = document.querySelectorAll('.planning-config-card');
  let updated = 0;

  cards.forEach(card => {
    const shiftId = card.dataset.shiftId;
    const startInput = card.querySelector(`#start-${shiftId}`);
    const endInput = card.querySelector(`#end-${shiftId}`);
    if (!startInput || !endInput) return;

    updateShift(shiftId, {
      heureDebut: startInput.value,
      heureFin: endInput.value,
    });
    updated++;
  });

  // Feedback visuel
  const btn = document.getElementById('btnSaveConfig');
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✅ Enregistré !';
    btn.classList.add('planning-btn-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('planning-btn-success');
    }, 2000);
  }
}

/**
 * Rendu de l'onglet Config
 */
export function renderConfigTab(container) {
  const allShifts = getPlanningShifts();
  const configurableShifts = CONFIGURABLE_SHIFTS
    .map(id => allShifts.find(s => s.id === id))
    .filter(Boolean);

  container.innerHTML = `
    <div style="padding:16px;">
      <div class="planning-config-header">
        <h3>⚙️ Configuration des horaires</h3>
        <p class="planning-config-subtitle">Personnalisez les heures de début et de fin pour chaque créneau.</p>
      </div>
      ${configurableShifts.map(s => shiftCardTemplate(s)).join('')}
      <div class="planning-config-actions">
        <button class="planning-btn-primary" id="btnSaveConfig">💾 Enregistrer les horaires</button>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);

  // Mise à jour dynamique de la durée
  container.querySelectorAll('.planning-config-time').forEach(input => {
    input.addEventListener('input', () => {
      updateDurationDisplay(input.dataset.shift);
    });
  });
}

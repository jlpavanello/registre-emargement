// UI: Planning Cycles Tab — Gestion des roulements
import { getState } from '../state.js';
import { getPlanningCycles, createCycle, deleteCycle } from '../domains/planning-cycles.js';
import { getPlanningShifts, getShiftById } from '../domains/planning-shifts.js';
import { applyCycle } from '../domains/planning.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderCyclesTab(container) {
  const cycles = getPlanningCycles();
  const shifts = getPlanningShifts();
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);

  let html = '';

  // Create new cycle button
  html += '<div style="margin-bottom:12px;">';
  html += '  <button class="planning-btn planning-btn-primary" id="btnCreateCycle">+ Cr\u00e9er un roulement</button>';
  html += '</div>';

  if (cycles.length === 0) {
    html += '<div class="planning-empty"><div class="planning-empty-icon">🔄</div>Aucun roulement cr\u00e9\u00e9.<br>Cr\u00e9ez votre premier cycle de travail.</div>';
  }

  // List existing cycles
  cycles.forEach(cycle => {
    html += '<div class="planning-card">';
    html += '<div class="planning-card-header">';
    html += '  <div>';
    html += '    <div class="planning-card-title">' + escapeHtml(cycle.nom) + '</div>';
    html += '    <div class="planning-card-sub">' + cycle.dureeJours + ' jours</div>';
    html += '  </div>';
    html += '  <div style="display:flex;gap:4px;">';
    html += '    <button class="planning-btn planning-btn-secondary planning-btn-sm btn-apply-cycle" data-id="' + cycle.id + '">Appliquer</button>';
    html += '    <button class="planning-btn planning-btn-danger planning-btn-sm btn-delete-cycle" data-id="' + cycle.id + '">Suppr.</button>';
    html += '  </div>';
    html += '</div>';

    // Preview pattern
    html += '<div class="planning-cycle-preview">';
    if (cycle.pattern) {
      cycle.pattern.forEach((p, i) => {
        if (p.shiftId) {
          const s = getShiftById(p.shiftId);
          if (s) {
            html += '<div class="planning-cycle-day" style="background:' + s.couleur + ';" title="J' + (i + 1) + ': ' + escapeHtml(s.nom) + '">' + s.icon + '</div>';
          }
        } else {
          html += '<div class="planning-cycle-day repos" title="J' + (i + 1) + ': Repos">R</div>';
        }
      });
    }
    html += '</div>';
    html += '</div>';
  });

  container.innerHTML = html;

  // Bind create
  container.querySelector('#btnCreateCycle')?.addEventListener('click', () => showCreateForm(container));

  // Bind delete
  container.querySelectorAll('.btn-delete-cycle').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Supprimer ce roulement ?')) {
        deleteCycle(btn.dataset.id);
        renderCyclesTab(container);
      }
    });
  });

  // Bind apply
  container.querySelectorAll('.btn-apply-cycle').forEach(btn => {
    btn.addEventListener('click', () => showApplyForm(container, btn.dataset.id));
  });
}

function showCreateForm(container) {
  const shifts = getPlanningShifts();

  let html = '<div class="planning-card" id="cycleCreateForm">';
  html += '<div class="planning-card-title" style="margin-bottom:12px;">Nouveau roulement</div>';

  html += '<div class="planning-field"><label>Nom du roulement</label>';
  html += '<input type="text" id="cycleNom" placeholder="Ex: Roulement 3x8"></div>';

  html += '<div class="planning-field"><label>Dur\u00e9e du cycle (jours)</label>';
  html += '<input type="number" id="cycleDuree" value="7" min="1" max="60"></div>';

  html += '<div id="cyclePatternArea"></div>';

  html += '<div style="display:flex;gap:8px;margin-top:12px;">';
  html += '  <button class="planning-btn planning-btn-primary" id="btnSaveCycle">Enregistrer</button>';
  html += '  <button class="planning-btn planning-btn-secondary" id="btnCancelCycle">Annuler</button>';
  html += '</div>';
  html += '</div>';

  // Insert at top
  container.insertAdjacentHTML('afterbegin', html);

  const dureeInput = container.querySelector('#cycleDuree');
  function buildPattern() {
    const n = parseInt(dureeInput.value) || 7;
    const area = container.querySelector('#cyclePatternArea');
    let ph = '<div class="planning-section-title">Pattern jour par jour</div>';
    for (let i = 0; i < n; i++) {
      ph += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
      ph += '  <span style="font-size:11px;font-weight:700;min-width:30px;color:var(--text2);">J' + (i + 1) + '</span>';
      ph += '  <select class="cycle-day-select" data-day="' + i + '" style="flex:1;padding:6px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;">';
      ph += '    <option value="">Repos</option>';
      shifts.forEach(s => {
        ph += '    <option value="' + s.id + '">' + s.icon + ' ' + escapeHtml(s.nom) + ' (' + s.heureDebut + '-' + s.heureFin + ')</option>';
      });
      ph += '  </select>';
      ph += '</div>';
    }
    area.innerHTML = ph;
  }

  buildPattern();
  dureeInput.addEventListener('change', buildPattern);

  container.querySelector('#btnCancelCycle').addEventListener('click', () => {
    container.querySelector('#cycleCreateForm').remove();
  });

  container.querySelector('#btnSaveCycle').addEventListener('click', () => {
    const nom = container.querySelector('#cycleNom').value.trim();
    if (!nom) { alert('Veuillez saisir un nom.'); return; }

    const selects = container.querySelectorAll('.cycle-day-select');
    const pattern = [];
    selects.forEach(sel => {
      pattern.push({
        jour: parseInt(sel.dataset.day) + 1,
        shiftId: sel.value || null,
      });
    });

    createCycle(nom, pattern);
    renderCyclesTab(container);
  });
}

function showApplyForm(container, cycleId) {
  const { team } = getState();
  const activeTeam = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  const cycle = getPlanningCycles().find(c => c.id === cycleId);
  if (!cycle) return;

  let html = '<div class="planning-picker-overlay" id="planCycleApplyOverlay">';
  html += '<div class="planning-picker">';
  html += '<div class="planning-picker-title">Appliquer : ' + escapeHtml(cycle.nom) + '</div>';

  html += '<div class="planning-field"><label>Agent</label>';
  html += '<select id="cycleApplyAgent">';
  html += '<option value="">— Choisir —</option>';
  activeTeam.forEach(a => {
    html += '<option value="' + a.idx + '">' + escapeHtml(a.nom) + '</option>';
  });
  html += '</select></div>';

  html += '<div class="planning-field"><label>Date de d\u00e9but</label>';
  html += '<input type="date" id="cycleApplyStart"></div>';

  html += '<div class="planning-field"><label>Date de fin</label>';
  html += '<input type="date" id="cycleApplyEnd"></div>';

  html += '<div class="planning-picker-actions">';
  html += '  <button class="planning-btn planning-btn-primary" id="btnApplyCycleConfirm">Appliquer</button>';
  html += '  <button class="planning-picker-btn-cancel" id="btnApplyCycleCancel">Annuler</button>';
  html += '</div>';
  html += '</div></div>';

  const overlay = document.createElement('div');
  overlay.innerHTML = html;
  document.body.appendChild(overlay.firstElementChild);

  const el = document.getElementById('planCycleApplyOverlay');
  el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
  document.getElementById('btnApplyCycleCancel').addEventListener('click', () => el.remove());

  document.getElementById('btnApplyCycleConfirm').addEventListener('click', () => {
    const agentIdx = parseInt(document.getElementById('cycleApplyAgent').value);
    const start = document.getElementById('cycleApplyStart').value;
    const end = document.getElementById('cycleApplyEnd').value;
    if (isNaN(agentIdx)) { alert('Choisissez un agent.'); return; }
    if (!start || !end) { alert('Choisissez les dates.'); return; }
    if (start > end) { alert('La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but.'); return; }

    const count = applyCycle(agentIdx, cycleId, start, end);
    alert(count + ' jours affect\u00e9s.');
    el.remove();
    renderCyclesTab(container);
  });
}

// Stock — Onglet Exercices de tir
import { getState } from '../state.js';
import { addPrevision, updatePrevision, markRealise, cancelPrevision, deletePrevision, checkStockImpact } from '../domains/previsions-tir.js';
import { getMachineName } from '../domains/machines.js';
import { showToast } from '../utils/toast.js';
import { showConfirm } from '../utils/confirm-dialog.js';

export function renderPrevisionsTab(container) {
  const { previsionsTir, team, machines, presentToday } = getState();

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div class="stock-section-title">Exercices de tir</div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnAddPrevision">+ Planifier</button>
  </div>`;

  html += `<div id="previsionForm" style="display:none;margin-bottom:12px;"></div>`;

  if (previsionsTir.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">🎯</div>
      <div>Aucun exercice de tir planifié.</div>
    </div>`;
  } else {
    // Sort: planifie first (by date), then realise, then annule
    const sorted = [...previsionsTir].sort((a, b) => {
      const order = { planifie: 0, realise: 1, annule: 2 };
      const diff = (order[a.statut] || 0) - (order[b.statut] || 0);
      return diff !== 0 ? diff : a.date.localeCompare(b.date);
    });

    sorted.forEach(p => {
      const armeName = getMachineName(p.armeIdx);
      const participantNames = p.participants.map(i => team[i]?.nom || `Agent ${i + 1}`).join(', ');
      const impact = checkStockImpact(p.armeIdx, p.totalPrevu);

      html += `<div class="prevision-card">
        <div class="prevision-header">
          <div>
            <div class="prevision-date">📅 ${p.date}${p.lieu ? ' — ' + p.lieu : ''}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">${armeName}</div>
          </div>
          <div class="prevision-status ${p.statut}">${p.statut === 'planifie' ? 'Planifié' : p.statut === 'realise' ? 'Réalisé' : 'Annulé'}</div>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px;">
          ${p.participants.length} participant${p.participants.length > 1 ? 's' : ''} · ${p.munitionsParAgent} mun./agent · <strong>Total: ${p.totalPrevu}</strong>
        </div>
        ${p.participants.length <= 6 ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;">${participantNames}</div>` : ''}
        ${p.statut === 'planifie' ? `
          <div class="stock-impact">
            <div class="stock-impact-row"><span>Stock actuel:</span><span>${impact.stockActuel}</span></div>
            <div class="stock-impact-row"><span>Après exercice:</span><span${impact.stockApres < 0 ? ' class="stock-impact-deficit"' : ''}>${impact.stockApres}</span></div>
            ${impact.deficit > 0 ? `<div class="stock-impact-row stock-impact-deficit"><span>Déficit:</span><span>-${impact.deficit}</span></div>` : ''}
          </div>
          <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
            <button class="stock-btn stock-btn-primary stock-btn-sm btn-prev-realise" data-id="${p.id}">✅ Réalisé</button>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-edit" data-id="${p.id}">✏️ Modifier</button>
            <button class="stock-btn stock-btn-danger stock-btn-sm btn-prev-cancel" data-id="${p.id}">Annuler</button>
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-delete" data-id="${p.id}">🗑️</button>
          </div>` : `
          ${p.realise ? `<div style="font-size:11px;color:#166534;margin-top:6px;">✅ Réalisé le ${p.realise.dateRealisation} — ${p.realise.munitionsConsommees} munitions consommées</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button class="stock-btn stock-btn-secondary stock-btn-sm btn-prev-delete" data-id="${p.id}">🗑️ Supprimer</button>
          </div>`}
      </div>`;
    });
  }

  container.innerHTML = html;

  // Bind add button
  document.getElementById('btnAddPrevision')?.addEventListener('click', () => {
    showPrevisionForm(container);
  });

  // Bind action buttons
  container.querySelectorAll('.btn-prev-realise').forEach(btn => {
    btn.addEventListener('click', () => showRealiseForm(container, btn.dataset.id));
  });
  container.querySelectorAll('.btn-prev-cancel').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: 'Annuler cet exercice ?',
        message: 'L\'exercice sera marqué comme annulé. Aucune munition ne sera décomptée.',
        confirmText: 'Annuler l\'exercice',
        cancelText: 'Retour',
        danger: true,
      });
      if (!confirmed) return;
      cancelPrevision(btn.dataset.id);
      showToast('Exercice annulé');
      renderPrevisionsTab(container);
    });
  });
  container.querySelectorAll('.btn-prev-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      showEditPrevisionForm(container, btn.dataset.id);
    });
  });
  container.querySelectorAll('.btn-prev-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: 'Supprimer cet exercice ?',
        message: 'Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        danger: true,
      });
      if (!confirmed) return;
      deletePrevision(btn.dataset.id);
      showToast('Exercice supprimé');
      renderPrevisionsTab(container);
    });
  });
}

// --- Realise form (replaces prompt) ---

function showRealiseForm(container, prevId) {
  const { previsionsTir } = getState();
  const p = previsionsTir.find(p => p.id === prevId);
  if (!p) return;

  // Find or create an action area
  const card = container.querySelector(`.btn-prev-realise[data-id="${prevId}"]`)?.closest('.prevision-card');
  if (!card) return;

  let area = card.querySelector('.prev-realise-area');
  if (!area) {
    area = document.createElement('div');
    area.className = 'prev-realise-area';
    card.appendChild(area);
  }

  area.innerHTML = `<div class="stock-form-active" style="margin-top:10px;">
    <div class="stock-form-header">Marquer comme réalisé</div>
    <div class="stock-field"><label>Munitions réellement consommées</label>
      <input type="number" id="realiseQty_${prevId}" value="${p.totalPrevu}" min="0" inputmode="numeric">
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="realiseConfirm_${prevId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="realiseCancel_${prevId}">Annuler</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('realiseConfirm_' + prevId).addEventListener('click', () => {
    const qty = parseInt(document.getElementById('realiseQty_' + prevId).value) || 0;
    markRealise(prevId, qty);
    showToast('Exercice marqué comme réalisé');
    renderPrevisionsTab(container);
  });
  document.getElementById('realiseCancel_' + prevId).addEventListener('click', () => {
    area.innerHTML = '';
  });
}

function showPrevisionForm(container) {
  const { team, machines, presentToday } = getState();
  const form = document.getElementById('previsionForm');
  if (!form) return;

  const machOpts = machines.map((m, i) => m.nom ? `<option value="${i}">${m.nom}${m.ref ? ' (' + m.ref + ')' : ''}</option>` : '').join('');
  const today = new Date().toISOString().split('T')[0];

  // Use presentToday if available, otherwise all team with names
  const agents = presentToday.length > 0
    ? presentToday.filter(i => team[i]?.nom)
    : team.map((t, i) => t.nom ? i : -1).filter(i => i >= 0);

  const agentChips = agents.map(i =>
    `<div class="stock-chip selected" data-emp="${i}">${team[i].nom}</div>`
  ).join('');

  form.style.display = 'block';
  form.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Planifier un exercice</div>
    <div class="stock-field"><label>Date</label><input type="date" id="prevDate" value="${today}"></div>
    <div class="stock-field"><label>Lieu</label><input type="text" id="prevLieu" placeholder="Ex: Stand de tir municipal"></div>
    <div class="stock-field"><label>Arme</label><select id="prevArme"><option value="">— Choisir —</option>${machOpts}</select></div>
    <div class="stock-field"><label>Munitions par agent</label><input type="number" id="prevMunParAgent" value="50" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Participants (cliquez pour dé/sélectionner)</label>
      <div class="stock-chip-list" id="prevParticipants">${agentChips}</div>
    </div>
    <div id="prevImpact" style="margin-top:8px;"></div>
    <div style="display:flex;gap:6px;margin-top:12px;">
      <button class="stock-btn stock-btn-primary" id="prevConfirm">Créer l'exercice</button>
      <button class="stock-btn stock-btn-secondary" id="prevCancel">Annuler</button>
    </div>
  </div>`;

  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Chip toggle
  form.querySelectorAll('.stock-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updatePrevImpact();
    });
  });

  // Impact preview
  const updatePrevImpact = () => {
    const armeIdx = parseInt(document.getElementById('prevArme').value);
    const munParAgent = parseInt(document.getElementById('prevMunParAgent').value) || 0;
    const selectedCount = form.querySelectorAll('.stock-chip.selected').length;
    const total = selectedCount * munParAgent;

    if (!isNaN(armeIdx) && armeIdx >= 0) {
      const impact = checkStockImpact(armeIdx, total);
      document.getElementById('prevImpact').innerHTML = `
        <div class="stock-impact">
          <div class="stock-impact-row"><span>Participants:</span><span>${selectedCount}</span></div>
          <div class="stock-impact-row"><span>Total munitions:</span><span><strong>${total}</strong></span></div>
          <div class="stock-impact-row"><span>Stock actuel:</span><span>${impact.stockActuel}</span></div>
          <div class="stock-impact-row"><span>Stock après:</span><span${impact.stockApres < 0 ? ' class="stock-impact-deficit"' : ''}>${impact.stockApres}</span></div>
          ${impact.deficit > 0 ? `<div class="stock-impact-row stock-impact-deficit"><span>Déficit:</span><span>${impact.deficit}</span></div>` : ''}
        </div>`;
    }
  };

  document.getElementById('prevArme')?.addEventListener('change', updatePrevImpact);
  document.getElementById('prevMunParAgent')?.addEventListener('input', updatePrevImpact);

  document.getElementById('prevConfirm')?.addEventListener('click', () => {
    const date = document.getElementById('prevDate').value;
    const lieu = document.getElementById('prevLieu').value;
    const armeIdx = parseInt(document.getElementById('prevArme').value);
    const munParAgent = parseInt(document.getElementById('prevMunParAgent').value) || 0;
    const participants = Array.from(form.querySelectorAll('.stock-chip.selected')).map(c => +c.dataset.emp);

    if (!date) { showToast('Veuillez saisir une date', 'error'); return; }
    if (isNaN(armeIdx) || armeIdx < 0) { showToast('Veuillez choisir une arme', 'error'); return; }
    if (participants.length === 0) { showToast('Sélectionnez au moins un participant', 'error'); return; }
    if (munParAgent <= 0) { showToast('Saisissez un nombre de munitions par agent', 'error'); return; }

    addPrevision({ date, lieu, participants, munitionsParAgent: munParAgent, armeIdx });
    showToast('Exercice planifié');
    renderPrevisionsTab(container);
  });

  document.getElementById('prevCancel')?.addEventListener('click', () => {
    form.style.display = 'none';
  });
}

// --- Edit form ---

function showEditPrevisionForm(container, prevId) {
  const { previsionsTir, team, machines } = getState();
  const prev = previsionsTir.find(p => p.id === prevId);
  if (!prev) return;

  const form = document.getElementById('previsionForm');
  if (!form) return;

  const machOpts = machines.map((m, i) => {
    if (!m.nom) return '';
    const sel = i === prev.armeIdx ? ' selected' : '';
    return `<option value="${i}"${sel}>${m.nom}${m.ref ? ' (' + m.ref + ')' : ''}</option>`;
  }).join('');

  // All agents with names
  const allAgents = team.map((t, i) => t.nom ? i : -1).filter(i => i >= 0);

  const agentChips = allAgents.map(i => {
    const isSelected = prev.participants.includes(i);
    return `<div class="stock-chip${isSelected ? ' selected' : ''}" data-emp="${i}">${team[i].nom}</div>`;
  }).join('');

  form.style.display = 'block';
  form.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Modifier l'exercice</div>
    <div class="stock-field"><label>Date</label><input type="date" id="prevDate" value="${prev.date}"></div>
    <div class="stock-field"><label>Lieu</label><input type="text" id="prevLieu" value="${prev.lieu || ''}" placeholder="Ex: Stand de tir municipal"></div>
    <div class="stock-field"><label>Arme</label><select id="prevArme"><option value="">— Choisir —</option>${machOpts}</select></div>
    <div class="stock-field"><label>Munitions par agent</label><input type="number" id="prevMunParAgent" value="${prev.munitionsParAgent}" min="1" inputmode="numeric"></div>
    <div class="stock-field"><label>Participants (cliquez pour dé/sélectionner)</label>
      <div class="stock-chip-list" id="prevParticipants">${agentChips}</div>
    </div>
    <div id="prevImpact" style="margin-top:8px;"></div>
    <div style="display:flex;gap:6px;margin-top:12px;">
      <button class="stock-btn stock-btn-primary" id="prevConfirm">Enregistrer</button>
      <button class="stock-btn stock-btn-secondary" id="prevCancel">Annuler</button>
    </div>
  </div>`;

  // Chip toggle
  form.querySelectorAll('.stock-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updateEditImpact();
    });
  });

  // Impact preview
  const updateEditImpact = () => {
    const armeIdx = parseInt(document.getElementById('prevArme').value);
    const munParAgent = parseInt(document.getElementById('prevMunParAgent').value) || 0;
    const selectedCount = form.querySelectorAll('.stock-chip.selected').length;
    const total = selectedCount * munParAgent;

    if (!isNaN(armeIdx) && armeIdx >= 0) {
      const impact = checkStockImpact(armeIdx, total);
      document.getElementById('prevImpact').innerHTML = `
        <div class="stock-impact">
          <div class="stock-impact-row"><span>Participants:</span><span>${selectedCount}</span></div>
          <div class="stock-impact-row"><span>Total munitions:</span><span><strong>${total}</strong></span></div>
          <div class="stock-impact-row"><span>Stock actuel:</span><span>${impact.stockActuel}</span></div>
          <div class="stock-impact-row"><span>Stock après:</span><span${impact.stockApres < 0 ? ' class="stock-impact-deficit"' : ''}>${impact.stockApres}</span></div>
          ${impact.deficit > 0 ? `<div class="stock-impact-row stock-impact-deficit"><span>Déficit:</span><span>${impact.deficit}</span></div>` : ''}
        </div>`;
    }
  };

  document.getElementById('prevArme')?.addEventListener('change', updateEditImpact);
  document.getElementById('prevMunParAgent')?.addEventListener('input', updateEditImpact);

  // Trigger initial impact preview
  updateEditImpact();

  document.getElementById('prevConfirm')?.addEventListener('click', () => {
    const date = document.getElementById('prevDate').value;
    const lieu = document.getElementById('prevLieu').value;
    const armeIdx = parseInt(document.getElementById('prevArme').value);
    const munParAgent = parseInt(document.getElementById('prevMunParAgent').value) || 0;
    const participants = Array.from(form.querySelectorAll('.stock-chip.selected')).map(c => +c.dataset.emp);

    if (!date) { showToast('Veuillez saisir une date', 'error'); return; }
    if (isNaN(armeIdx) || armeIdx < 0) { showToast('Veuillez choisir une arme', 'error'); return; }
    if (participants.length === 0) { showToast('Sélectionnez au moins un participant', 'error'); return; }
    if (munParAgent <= 0) { showToast('Saisissez un nombre de munitions par agent', 'error'); return; }

    updatePrevision(prevId, { date, lieu, participants, munitionsParAgent: munParAgent, armeIdx });
    showToast('Exercice modifié');
    renderPrevisionsTab(container);
  });

  document.getElementById('prevCancel')?.addEventListener('click', () => {
    form.style.display = 'none';
  });

  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Stock — Onglet Prévisions de tir
import { getState } from '../state.js';
import { addPrevision, updatePrevision, markRealise, cancelPrevision, deletePrevision, checkStockImpact } from '../domains/previsions-tir.js';
import { getMachineName } from '../domains/machines.js';

export function renderPrevisionsTab(container) {
  const { previsionsTir, team, machines, presentToday } = getState();

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;">
    <div class="stock-section-title">🎯 Exercices de tir</div>
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
            ${impact.deficit > 0 ? `<div class="stock-impact-row stock-impact-deficit"><span>⚠️ Déficit:</span><span>-${impact.deficit}</span></div>` : ''}
          </div>
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button class="stock-btn stock-btn-primary stock-btn-sm btn-prev-realise" data-id="${p.id}">✅ Marquer réalisé</button>
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
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const p = previsionsTir.find(p => p.id === id);
      const consommees = prompt('Munitions réellement consommées:', p ? String(p.totalPrevu) : '0');
      if (consommees === null) return;
      markRealise(id, parseInt(consommees) || 0);
      renderPrevisionsTab(container);
    });
  });
  container.querySelectorAll('.btn-prev-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Annuler cet exercice ?')) return;
      cancelPrevision(btn.dataset.id);
      renderPrevisionsTab(container);
    });
  });
  container.querySelectorAll('.btn-prev-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer cette prévision ?')) return;
      deletePrevision(btn.dataset.id);
      renderPrevisionsTab(container);
    });
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
  form.innerHTML = `
    <div class="stock-card">
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
          ${impact.deficit > 0 ? `<div class="stock-impact-row stock-impact-deficit"><span>⚠️ Déficit à combler:</span><span>${impact.deficit}</span></div>` : ''}
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

    if (!date) { alert('Veuillez saisir une date'); return; }
    if (isNaN(armeIdx) || armeIdx < 0) { alert('Veuillez choisir une arme'); return; }
    if (participants.length === 0) { alert('Veuillez sélectionner au moins un participant'); return; }
    if (munParAgent <= 0) { alert('Veuillez saisir un nombre de munitions par agent'); return; }

    addPrevision({ date, lieu, participants, munitionsParAgent: munParAgent, armeIdx });
    renderPrevisionsTab(container);
  });

  document.getElementById('prevCancel')?.addEventListener('click', () => {
    form.style.display = 'none';
  });
}

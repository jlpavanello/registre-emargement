// Stock — Onglet Commandes / Demandes de devis
import { getState } from '../state.js';
import { createCommande, updateCommande, addLigne, removeLigne, changeStatut, deleteCommande, getCommandeById } from '../domains/commandes.js';
import { getActiveMachines, getMachineName } from '../domains/machines.js';
import { getStockForWeapon } from '../domains/stock-munitions.js';
import { generateOrderPDF } from '../actions/stock-pdf.js';

let _filter = 'demande_devis';

const TYPE_LABELS = {
  demande_devis: 'Demande de devis',
  commande: 'Commande',
};

const STATUS_LABELS = {
  brouillon: 'Brouillon',
  envoye: 'Envoyée',
  repondu: 'Répondu',
  accepte: 'Accepté',
  commande: 'Commandé',
  livre: 'Livré',
};

export function renderCommandesTab(container) {
  const { commandes, fournisseurs } = getState();

  const filtered = commandes.filter(c => c.type === _filter);
  const isDemandeDevis = _filter === 'demande_devis';

  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div style="display:flex;gap:4px;">
      <button class="stock-tab ${_filter === 'demande_devis' ? 'active' : ''}" id="btnFilterDevis">Demandes de devis</button>
      <button class="stock-tab ${_filter === 'commande' ? 'active' : ''}" id="btnFilterCommande">Commandes</button>
    </div>
    <button class="stock-btn stock-btn-primary stock-btn-sm" id="btnNewCommande">+ ${isDemandeDevis ? 'Nouvelle demande' : 'Nouvelle commande'}</button>
  </div>`;

  html += `<div id="commandeForm" style="display:none;margin-bottom:12px;"></div>`;

  if (filtered.length === 0) {
    html += `<div class="stock-empty">
      <div class="stock-empty-icon">${isDemandeDevis ? '📋' : '📦'}</div>
      <div>Aucune ${isDemandeDevis ? 'demande de devis' : 'commande'} pour le moment.</div>
    </div>`;
  } else {
    filtered.forEach(c => {
      html += `<div class="commande-card" data-cmd-id="${c.id}">
        <div class="commande-header">
          <div>
            <div class="commande-numero">${c.numero}</div>
            <div style="font-size:11px;color:var(--text3);">${c.date}</div>
          </div>
          <div class="commande-status ${c.statut}">${STATUS_LABELS[c.statut] || c.statut}</div>
        </div>
        <div class="commande-fournisseur">${c.fournisseurNom || 'Tous fournisseurs (à envoyer à plusieurs)'}</div>
        ${c.lignes.length > 0 ? renderLignesTable(c, isDemandeDevis) : '<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">Aucun article</div>'}
        ${c.notes ? `<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">📝 ${c.notes}</div>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          <button class="stock-btn stock-btn-secondary stock-btn-sm btn-cmd-edit" data-id="${c.id}">✏️ Articles</button>
          <button class="stock-btn stock-btn-primary stock-btn-sm btn-cmd-pdf" data-id="${c.id}">📄 PDF</button>
          ${renderStatusButtons(c, isDemandeDevis)}
          <button class="stock-btn stock-btn-danger stock-btn-sm btn-cmd-delete" data-id="${c.id}">🗑️</button>
        </div>
        <div id="cmdAction_${c.id}" style="display:none;margin-top:10px;"></div>
      </div>`;
    });
  }

  container.innerHTML = html;

  // Filter buttons
  document.getElementById('btnFilterDevis')?.addEventListener('click', () => { _filter = 'demande_devis'; renderCommandesTab(container); });
  document.getElementById('btnFilterCommande')?.addEventListener('click', () => { _filter = 'commande'; renderCommandesTab(container); });

  // New
  document.getElementById('btnNewCommande')?.addEventListener('click', () => showCommandeForm(container));

  // Edit lines
  container.querySelectorAll('.btn-cmd-edit').forEach(btn => {
    btn.addEventListener('click', () => showEditLignes(container, btn.dataset.id));
  });

  // PDF
  container.querySelectorAll('.btn-cmd-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getCommandeById(btn.dataset.id);
      if (c) generateOrderPDF(c);
    });
  });

  // Status change
  container.querySelectorAll('.btn-cmd-status').forEach(btn => {
    btn.addEventListener('click', () => {
      changeStatut(btn.dataset.id, btn.dataset.status);
      renderCommandesTab(container);
    });
  });

  // Delete
  container.querySelectorAll('.btn-cmd-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer ce document ?')) return;
      deleteCommande(btn.dataset.id);
      renderCommandesTab(container);
    });
  });
}

function renderLignesTable(c, isDemandeDevis) {
  if (isDemandeDevis) {
    // Demande de devis: seulement désignation + quantité (pas de prix)
    return `
      <table class="ligne-table">
        <thead><tr><th>Désignation</th><th>Quantité demandée</th></tr></thead>
        <tbody>${c.lignes.map(l => `<tr>
          <td>${l.designation}</td><td style="text-align:center;font-weight:700;">${l.quantite}</td>
        </tr>`).join('')}</tbody>
      </table>`;
  } else {
    // Commande: toutes les colonnes avec prix
    return `
      <table class="ligne-table">
        <thead><tr><th>Désignation</th><th>Qté</th><th>P.U. HT</th><th>Total HT</th></tr></thead>
        <tbody>${c.lignes.map(l => `<tr>
          <td>${l.designation}</td><td>${l.quantite}</td><td>${l.prixUnitaire.toFixed(2)}€</td><td>${l.total.toFixed(2)}€</td>
        </tr>`).join('')}</tbody>
      </table>
      <div class="ligne-total"><span>Total HT</span><span>${c.totalHT.toFixed(2)}€</span></div>
      <div class="ligne-total"><span>TVA ${c.tva}%</span><span>${(c.totalTTC - c.totalHT).toFixed(2)}€</span></div>
      <div class="ligne-total ttc"><span>Total TTC</span><span>${c.totalTTC.toFixed(2)}€</span></div>`;
  }
}

function renderStatusButtons(c, isDemandeDevis) {
  if (isDemandeDevis) {
    // Demande de devis workflow: brouillon → envoyée → répondu
    if (c.statut === 'brouillon') return `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="envoye" style="background:#dbeafe;color:#1e40af;">→ Envoyée</button>`;
    if (c.statut === 'envoye') return `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="repondu" style="background:#dcfce7;color:#166534;">→ Répondu</button>`;
    return '';
  } else {
    // Commande workflow: brouillon → envoyée → accepté → livré
    if (c.statut === 'brouillon') return `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="envoye" style="background:#dbeafe;color:#1e40af;">→ Envoyée</button>`;
    if (c.statut === 'envoye') return `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="accepte" style="background:#dcfce7;color:#166534;">→ Accepté</button>`;
    if (c.statut === 'accepte') return `<button class="stock-btn stock-btn-sm btn-cmd-status" data-id="${c.id}" data-status="livre" style="background:#f0fdf4;color:#14532d;">→ Livré</button>`;
    return '';
  }
}

function showCommandeForm(container) {
  const { fournisseurs, machines, stockMunitions } = getState();
  const form = document.getElementById('commandeForm');
  if (!form) return;

  const isDemandeDevis = _filter === 'demande_devis';
  const fourOpts = fournisseurs.map(f => `<option value="${f.id}" data-nom="${f.nom}">${f.nom}</option>`).join('');

  // Build list of weapons with stock info for quick add
  const activeMachines = getActiveMachines();

  form.style.display = 'block';
  form.innerHTML = `
    <div class="stock-card">
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px;">${isDemandeDevis ? '📋 Nouvelle demande de devis' : '📦 Nouvelle commande'}</div>
      ${isDemandeDevis ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5;background:#f0fdf4;padding:10px;border-radius:8px;border:1px solid #bbf7d0;">
        Ce document sera envoyé aux fournisseurs pour obtenir une offre de prix. Renseignez les armes et/ou munitions dont vous avez besoin.
      </div>` : ''}
      <div class="stock-field"><label>Fournisseur ${isDemandeDevis ? '(optionnel si envoi à plusieurs)' : ''}</label>
        <select id="cmdFournisseur">
          <option value="">${isDemandeDevis ? '— Tous fournisseurs —' : '— Choisir un fournisseur —'}</option>
          ${fourOpts}
        </select>
      </div>
      ${isDemandeDevis && activeMachines.length > 0 ? `
        <div class="stock-section-title" style="padding-top:4px;">Ajout rapide depuis les armes configurées</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;" id="quickAddArmes">
          ${activeMachines.map(m => {
            const stock = stockMunitions[m.idx];
            const stockInfo = stock ? ` (stock: ${stock.stockActuel})` : '';
            return `<button class="stock-chip" data-idx="${m.idx}" data-nom="${m.nom}" data-ref="${m.ref || ''}">${m.nom}${stockInfo}</button>`;
          }).join('')}
        </div>
        <div id="quickAddLines" style="margin-bottom:10px;"></div>
      ` : ''}
      <div class="stock-field"><label>Notes / Précisions</label>
        <textarea id="cmdNotes" rows="2" placeholder="${isDemandeDevis ? 'Précisions sur le besoin, délai souhaité...' : 'Notes internes...'}"></textarea>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="stock-btn stock-btn-primary" id="cmdConfirm">Créer</button>
        <button class="stock-btn stock-btn-secondary" id="cmdCancel">Annuler</button>
      </div>
    </div>`;

  // Quick add buttons for armes
  const quickLines = [];
  form.querySelectorAll('#quickAddArmes .stock-chip')?.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const idx = +chip.dataset.idx;
      const existing = quickLines.findIndex(l => l.armeIdx === idx);
      if (chip.classList.contains('selected')) {
        if (existing === -1) {
          quickLines.push({ armeIdx: idx, nom: chip.dataset.nom, ref: chip.dataset.ref, qty: 0, type: 'munitions' });
        }
      } else {
        if (existing >= 0) quickLines.splice(existing, 1);
      }
      renderQuickAddLines(quickLines);
    });
  });

  function renderQuickAddLines(lines) {
    const area = document.getElementById('quickAddLines');
    if (!area) return;
    if (lines.length === 0) { area.innerHTML = ''; return; }
    area.innerHTML = lines.map((l, i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:4px;">
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:600;">${l.nom}${l.ref ? ' (' + l.ref + ')' : ''}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <select class="ql-type" data-i="${i}" style="font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;">
              <option value="munitions" ${l.type === 'munitions' ? 'selected' : ''}>Munitions</option>
              <option value="arme" ${l.type === 'arme' ? 'selected' : ''}>Arme (remplacement/achat)</option>
            </select>
            <input type="number" class="ql-qty" data-i="${i}" value="${l.qty}" min="0" placeholder="Qté" inputmode="numeric"
              style="width:70px;font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;text-align:center;">
          </div>
        </div>
      </div>`).join('');

    area.querySelectorAll('.ql-type').forEach(sel => {
      sel.addEventListener('change', () => { lines[+sel.dataset.i].type = sel.value; });
    });
    area.querySelectorAll('.ql-qty').forEach(inp => {
      inp.addEventListener('input', () => { lines[+inp.dataset.i].qty = parseInt(inp.value) || 0; });
    });
  }

  document.getElementById('cmdConfirm')?.addEventListener('click', () => {
    const select = document.getElementById('cmdFournisseur');
    const fournisseurId = select.value;
    const fournisseurNom = select.selectedOptions[0]?.dataset?.nom || '';
    const notes = document.getElementById('cmdNotes').value;

    // Build lignes from quick add
    const lignes = [];
    quickLines.forEach(l => {
      if (l.type === 'munitions') {
        lignes.push({ designation: `Munitions pour ${l.nom}${l.ref ? ' (' + l.ref + ')' : ''}`, quantite: l.qty || 0, prixUnitaire: 0, total: 0 });
      } else {
        lignes.push({ designation: `Arme: ${l.nom}${l.ref ? ' (' + l.ref + ')' : ''} (remplacement/achat)`, quantite: l.qty || 1, prixUnitaire: 0, total: 0 });
      }
    });

    if (isDemandeDevis && lignes.length === 0) {
      alert('Veuillez sélectionner au moins une arme ou munition.');
      return;
    }

    createCommande({ type: _filter, fournisseurId, fournisseurNom, lignes, notes });
    renderCommandesTab(container);
  });
  document.getElementById('cmdCancel')?.addEventListener('click', () => { form.style.display = 'none'; });
}

function showEditLignes(container, commandeId) {
  const c = getCommandeById(commandeId);
  if (!c) return;
  const area = document.getElementById(`cmdAction_${commandeId}`);
  if (!area) return;
  const isDemandeDevis = c.type === 'demande_devis';

  area.style.display = 'block';
  area.innerHTML = `
    <div class="stock-section-title" style="padding-top:0;">Ajouter un article</div>
    <div class="stock-field"><label>Désignation</label><input type="text" id="ligneDesign_${commandeId}" placeholder="${isDemandeDevis ? 'Ex: Munitions 9mm, Pistolet SIG SP2022...' : 'Ex: Cartouches 9mm'}"></div>
    <div style="display:flex;gap:8px;">
      <div class="stock-field" style="flex:1;"><label>Quantité</label><input type="number" id="ligneQty_${commandeId}" value="1" min="1" inputmode="numeric"></div>
      ${!isDemandeDevis ? `<div class="stock-field" style="flex:1;"><label>Prix unitaire (€)</label><input type="number" id="lignePrix_${commandeId}" value="0" step="0.01" min="0" inputmode="decimal"></div>` : ''}
    </div>
    <div style="display:flex;gap:6px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="ligneAdd_${commandeId}">Ajouter</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="ligneClose_${commandeId}">Fermer</button>
    </div>`;

  document.getElementById(`ligneAdd_${commandeId}`).addEventListener('click', () => {
    const designation = document.getElementById(`ligneDesign_${commandeId}`).value.trim();
    if (!designation) { alert('Veuillez saisir une désignation'); return; }
    const quantite = parseInt(document.getElementById(`ligneQty_${commandeId}`).value) || 1;
    const prixEl = document.getElementById(`lignePrix_${commandeId}`);
    const prixUnitaire = prixEl ? parseFloat(prixEl.value) || 0 : 0;
    addLigne(commandeId, { designation, quantite, prixUnitaire });
    renderCommandesTab(container);
  });
  document.getElementById(`ligneClose_${commandeId}`).addEventListener('click', () => { area.style.display = 'none'; });
}

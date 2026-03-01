// Stock & Logistique — Main panel controller + Dashboard tab
import { getState } from '../state.js';
import { getMunRefsWithAlerts, getAlertLevelForRef, getMunRefById, findMunRefForWeapon } from '../domains/stock-munitions.js';
import { getWeaponsNeedingAttention } from '../domains/stock-armes.js';
import { getRecentMouvements, MOUVEMENT_TYPES } from '../domains/stock-mouvements.js';
import { logMouvement } from '../domains/stock-mouvements.js';
import { getNextPrevision } from '../domains/previsions-tir.js';
import { getMachineName } from '../domains/machines.js';
import { escapeHtml } from '../utils/sanitize.js';
import { showToast } from '../utils/toast.js';
import { renderMunitionsTab } from './stock-munitions-tab.js';
import { renderArmesTab } from './stock-armes-tab.js';
import { renderPrevisionsTab } from './stock-previsions-tab.js';
import { renderFournisseursTab } from './stock-fournisseurs-tab.js';
import { renderCommandesTab } from './stock-commandes-tab.js';

let _currentTab = 'dashboard';

export function openStock() {
  document.getElementById('stockPanel').classList.add('active');
  _currentTab = 'dashboard';
  renderStockTabs();
  renderCurrentTab();
}

export function closeStock() {
  document.getElementById('stockPanel').classList.remove('active');
}

export function switchStockTab(tab) {
  _currentTab = tab;
  renderStockTabs();
  renderCurrentTab();
}

function renderStockTabs() {
  const tabs = document.querySelectorAll('#stockPanel .stock-nav-tab');
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === _currentTab);
  });
  // Update alert badge on dashboard tab
  updateDashboardBadge();
}

function updateDashboardBadge() {
  const dashTab = document.querySelector('#stockPanel .stock-nav-tab[data-tab="dashboard"]');
  if (!dashTab) return;
  // Remove existing badge
  const existing = dashTab.querySelector('.stock-nav-badge');
  if (existing) existing.remove();
  // Count alerts
  const alertCount = getMunRefsWithAlerts().length + getWeaponsNeedingAttention().length;
  if (alertCount > 0) {
    const badge = document.createElement('span');
    badge.className = 'stock-nav-badge';
    badge.textContent = alertCount;
    dashTab.appendChild(badge);
  }
}

function renderCurrentTab() {
  const container = document.getElementById('stockTabContent');
  if (!container) return;

  switch (_currentTab) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'munitions':
      renderMunitionsTab(container);
      break;
    case 'armes':
      renderArmesTab(container);
      break;
    case 'previsions':
      renderPrevisionsTab(container);
      break;
    case 'fournisseurs':
      renderFournisseursTab(container);
      break;
    case 'commandes':
      renderCommandesTab(container);
      break;
  }
}

function renderDashboard(container) {
  const alerts = getMunRefsWithAlerts();
  const weaponIssues = getWeaponsNeedingAttention();
  const mouvements = getRecentMouvements(8);
  const nextPrev = getNextPrevision();
  const { munitionRefs } = getState();

  let html = '';

  // Section Alertes munitions — with quick action "+ Stock"
  if (alerts.length > 0) {
    html += `<div class="stock-section-title">Alertes de stock</div>`;
    alerts.forEach(a => {
      const condit = a.conditionnement || 1;
      const total = a.stockActuel * condit;
      const uniteRaw = escapeHtml(a.unite);
      const unitePluriel = total > 1 ? (uniteRaw.endsWith('s') ? uniteRaw : uniteRaw + 's') : uniteRaw;
      html += `<div class="alert-card ${a.level}">
        <div class="alert-icon">${a.level === 'critique' ? '🔴' : '🟡'}</div>
        <div class="alert-info">
          <div class="alert-name">${escapeHtml(a.nom)}${a.calibre ? ' (' + escapeHtml(a.calibre) + ')' : ''}</div>
          <div class="alert-detail">${total} ${unitePluriel} restant${total > 1 ? 's' : ''}</div>
        </div>
        <button class="stock-btn stock-btn-primary stock-btn-sm btn-dash-appro" data-ref-id="${a.id}">+ Stock</button>
      </div>`;
    });
    // Inline appro form area
    html += `<div id="dashApproArea" style="display:none;margin-bottom:10px;"></div>`;
  }

  // Section Armes en révision
  if (weaponIssues.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">Armes nécessitant attention</div>`;
    weaponIssues.forEach(w => {
      html += `<div class="alert-card alerte">
        <div class="alert-icon">🔧</div>
        <div class="alert-info">
          <div class="alert-name">${escapeHtml(w.nom)}${w.ref ? ' (' + escapeHtml(w.ref) + ')' : ''}</div>
          <div class="alert-detail">${w.etat === 'en_revision' ? 'En révision' : 'Hors service'}${w.dateRevision ? ' — Révision: ' + escapeHtml(w.dateRevision) : ''}${w.notes ? ' — ' + escapeHtml(w.notes) : ''}</div>
        </div>
      </div>`;
    });
  }

  // Niveaux de stock par référence de munition — with quick action
  if (munitionRefs.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">Niveaux de stock</div>`;
    munitionRefs.forEach(ref => {
      const level = getAlertLevelForRef(ref);
      const pct = ref.seuilAlerte > 0 ? Math.min(100, (ref.stockActuel / (ref.seuilAlerte * 2)) * 100) : (ref.stockActuel > 0 ? 100 : 0);
      const condit = ref.conditionnement || 1;
      const total = ref.stockActuel * condit;
      const uniteRaw = escapeHtml(ref.unite);
      const unitePluriel = total > 1 ? (uniteRaw.endsWith('s') ? uniteRaw : uniteRaw + 's') : uniteRaw;
      html += `<div class="stock-card" style="padding:10px 14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="mun-status-dot ${level}" style="width:10px;height:10px;"></div>
              <div class="stock-card-title" style="font-size:13px;">${escapeHtml(ref.nom)}</div>
            </div>
            <div class="stock-card-sub" style="margin-left:18px;">${ref.calibre ? escapeHtml(ref.calibre) : ''} · ${ref.armeIdxList.length} arme${ref.armeIdxList.length > 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="stock-value ${level}" style="font-size:14px;text-align:right;line-height:1.3;">
              ${condit > 1
                ? `<span style="font-size:15px;font-weight:800;">${total}</span><span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:2px;">${unitePluriel}</span>`
                : `${ref.stockActuel}<span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:2px;">${unitePluriel}</span>`}
            </div>
            <button class="stock-btn stock-btn-primary stock-btn-sm btn-dash-appro-stock" data-ref-id="${ref.id}">+ Stock</button>
          </div>
        </div>
        <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
      </div>`;
    });
    // Inline appro form area for stock cards
    if (!alerts.length) {
      html += `<div id="dashApproArea" style="display:none;margin-bottom:10px;"></div>`;
    }
  }

  // Prochaine séance de tir
  if (nextPrev) {
    const munRef = nextPrev.armeIdx !== undefined ? findMunRefForWeapon(nextPrev.armeIdx) : null;
    const unite = munRef ? munRef.unite + 's' : 'cartouches';
    html += `<div class="stock-section-title" style="margin-top:10px;">Prochaine séance de tir</div>`;
    html += `<div class="prevision-card">
      <div class="prevision-header">
        <div class="prevision-date">${nextPrev.date} — ${nextPrev.lieu || 'Lieu non défini'}</div>
        <div class="prevision-status planifie">Planifié</div>
      </div>
      <div style="font-size:12px;color:var(--text2);">${nextPrev.participants.length} participant${nextPrev.participants.length > 1 ? 's' : ''} · <strong>${nextPrev.munitionsParAgent} x ${nextPrev.participants.length} ${escapeHtml(unite)} = ${nextPrev.totalPrevu}</strong></div>
      <div style="margin-top:8px;">
        <button class="stock-btn stock-btn-secondary stock-btn-sm" id="btnDashEditPrev" data-id="${nextPrev.id}">✏️ Modifier</button>
      </div>
    </div>`;
  }

  // Derniers mouvements
  if (mouvements.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">Derniers mouvements</div>`;
    html += `<div class="stock-card">`;
    mouvements.forEach(m => {
      const typeInfo = MOUVEMENT_TYPES[m.type] || { label: m.type, icon: '📦', color: '#64748b' };
      const isPositive = m.type === 'retour' || m.type === 'approvisionnement' || (m.type === 'ajustement' && m.quantite > 0);
      let label = '';
      if (m.munRefId) {
        const ref = getMunRefById(m.munRefId);
        label = ref ? ref.nom : getMachineName(m.armeIdx);
      } else {
        label = getMachineName(m.armeIdx);
      }
      html += `<div class="mouvement-item">
        <div class="mouvement-icon">${typeInfo.icon}</div>
        <div class="mouvement-info">
          <div class="mouvement-type" style="color:${typeInfo.color};">${typeInfo.label}</div>
          <div class="mouvement-detail">${escapeHtml(label)} · ${escapeHtml(m.date)} ${escapeHtml(m.heure)}${m.motif ? ' · ' + escapeHtml(m.motif) : ''}</div>
        </div>
        <div class="mouvement-qty ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${m.quantite}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Empty state
  if (!alerts.length && !weaponIssues.length && !mouvements.length && !nextPrev && munitionRefs.length === 0) {
    html = `<div class="stock-empty">
      <div class="stock-empty-icon">📦</div>
      <div>Rien à afficher pour le moment.</div>
      <div style="margin-top:8px;">Commencez par ajouter vos munitions dans l'onglet <strong>Munitions</strong>.</div>
    </div>`;
  }

  container.innerHTML = html;

  // Bind dashboard quick action "+ Stock" buttons (from alerts and stock cards)
  container.querySelectorAll('.btn-dash-appro, .btn-dash-appro-stock').forEach(btn => {
    btn.addEventListener('click', () => {
      const refId = btn.dataset.refId;
      showDashApproForm(container, refId);
    });
  });

  // Bind dashboard "Modifier" button for next prevision
  document.getElementById('btnDashEditPrev')?.addEventListener('click', (e) => {
    const prevId = e.currentTarget.dataset.id;
    _currentTab = 'previsions';
    renderStockTabs();
    renderPrevisionsTab(container);
    setTimeout(() => {
      const editBtn = container.querySelector(`.btn-prev-edit[data-id="${prevId}"]`);
      if (editBtn) editBtn.click();
    }, 50);
  });
}

// Dashboard inline approvisionnement form
function showDashApproForm(container, refId) {
  const area = container.querySelector('#dashApproArea');
  if (!area) return;
  const ref = getMunRefById(refId);
  if (!ref) return;

  // Calculate suggested quantity
  const deficit = ref.seuilAlerte - ref.stockActuel;
  const suggestedQty = deficit > 0 ? deficit : 50;

  area.style.display = 'block';
  area.innerHTML = `<div class="stock-form-active">
    <div class="stock-form-header">Ajouter du stock — ${escapeHtml(ref.nom)}</div>
    <div style="display:flex;gap:8px;align-items:flex-end;">
      <div class="stock-field" style="flex:1;margin-bottom:0;"><label>Quantité</label>
        <input type="number" id="dashApproQty" value="${suggestedQty}" min="1" inputmode="numeric">
      </div>
      <div class="stock-field" style="flex:1.5;margin-bottom:0;"><label>Motif (optionnel)</label>
        <input type="text" id="dashApproMotif" placeholder="Livraison, réception...">
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px;">
      <button class="stock-btn stock-btn-primary stock-btn-sm" id="dashApproConfirm" data-ref-id="${refId}">Valider</button>
      <button class="stock-btn stock-btn-secondary stock-btn-sm" id="dashApproCancel">Annuler</button>
    </div>
  </div>`;

  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('dashApproConfirm').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('dashApproQty').value) || 0;
    if (qty <= 0) { showToast('Quantité invalide', 'error'); return; }
    const motif = document.getElementById('dashApproMotif').value;
    logMouvement({ type: 'approvisionnement', munRefId: refId, armeIdx: null, quantite: qty, motif, source: 'manuel' });
    showToast(`+${qty} ajoutés au stock`);
    renderDashboard(container);
    updateDashboardBadge();
  });

  document.getElementById('dashApproCancel').addEventListener('click', () => {
    area.style.display = 'none';
  });
}

export function bindStockCallbacks(_callbacks) {
  // Reserved for future callbacks
}

export function refreshStockPanel() {
  if (document.getElementById('stockPanel')?.classList.contains('active')) {
    renderCurrentTab();
  }
}

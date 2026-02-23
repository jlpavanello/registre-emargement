// Stock & Logistique — Main panel controller + Dashboard tab
import { getState } from '../state.js';
import { getMunRefsWithAlerts, getAlertLevelForRef, getMunRefById, findMunRefForWeapon } from '../domains/stock-munitions.js';
import { getWeaponsNeedingAttention } from '../domains/stock-armes.js';
import { getRecentMouvements, MOUVEMENT_TYPES } from '../domains/stock-mouvements.js';
import { getNextPrevision } from '../domains/previsions-tir.js';
import { getMachineName } from '../domains/machines.js';
import { escapeHtml } from '../utils/sanitize.js';
import { renderMunitionsTab } from './stock-munitions-tab.js';
import { renderArmesTab } from './stock-armes-tab.js';
import { renderPrevisionsTab } from './stock-previsions-tab.js';
import { renderFournisseursTab } from './stock-fournisseurs-tab.js';
import { renderCommandesTab } from './stock-commandes-tab.js';

let _currentTab = 'munitions';

export function openStock() {
  document.getElementById('stockPanel').classList.add('active');
  _currentTab = 'munitions';
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
  const tabs = document.querySelectorAll('#stockPanel .stock-tab');
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === _currentTab);
  });
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

  // Section Alertes munitions
  if (alerts.length > 0) {
    html += `<div class="stock-section-title">⚠️ Alertes de stock</div>`;
    alerts.forEach(a => {
      html += `<div class="alert-card ${a.level}">
        <div class="alert-icon">${a.level === 'critique' ? '🔴' : '🟡'}</div>
        <div class="alert-info">
          <div class="alert-name">${escapeHtml(a.nom)}${a.calibre ? ' (' + escapeHtml(a.calibre) + ')' : ''}</div>
          <div class="alert-detail">${a.stockActuel} ${escapeHtml(a.unite)}${a.stockActuel > 1 ? 's' : ''} restante${a.stockActuel > 1 ? 's' : ''} — seuil ${a.level === 'critique' ? 'critique' : "d'alerte"}: ${a.level === 'critique' ? a.seuilCritique : a.seuilAlerte}</div>
        </div>
      </div>`;
    });
  }

  // Section Armes en révision
  if (weaponIssues.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">🔧 Armes nécessitant attention</div>`;
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

  // Niveaux de stock par référence de munition
  if (munitionRefs.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">📊 Niveaux de stock</div>`;
    munitionRefs.forEach(ref => {
      const level = getAlertLevelForRef(ref);
      const pct = ref.seuilAlerte > 0 ? Math.min(100, (ref.stockActuel / (ref.seuilAlerte * 2)) * 100) : (ref.stockActuel > 0 ? 100 : 0);
      html += `<div class="stock-card" style="padding:10px 14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div><div class="stock-card-title" style="font-size:13px;">${escapeHtml(ref.nom)}</div><div class="stock-card-sub">${ref.calibre ? escapeHtml(ref.calibre) : ''} · ${ref.armeIdxList.length} arme${ref.armeIdxList.length > 1 ? 's' : ''}</div></div>
          <div class="stock-value ${level}" style="font-size:14px;text-align:right;line-height:1.3;">
            ${(ref.conditionnement || 1) > 1
              ? `${ref.stockActuel} x ${ref.conditionnement} ${escapeHtml(ref.unite)}s<br><span style="font-size:15px;font-weight:800;">= ${ref.stockActuel * ref.conditionnement}</span>`
              : `${ref.stockActuel}<span style="font-size:10px;font-weight:500;color:var(--text3);margin-left:2px;">${escapeHtml(ref.unite)}s</span>`}
          </div>
        </div>
        <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
        <div class="stock-info-row"><span>Alerte: ${ref.seuilAlerte}</span><span>Critique: ${ref.seuilCritique}</span></div>
      </div>`;
    });
  }

  // Prochaine séance de tir
  if (nextPrev) {
    const munRef = nextPrev.armeIdx !== undefined ? findMunRefForWeapon(nextPrev.armeIdx) : null;
    const unite = munRef ? munRef.unite + 's' : 'cartouches';
    html += `<div class="stock-section-title" style="margin-top:10px;">🎯 Prochaine séance de tir</div>`;
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
    html += `<div class="stock-section-title" style="margin-top:10px;">📋 Derniers mouvements</div>`;
    html += `<div class="stock-card">`;
    mouvements.forEach(m => {
      const typeInfo = MOUVEMENT_TYPES[m.type] || { label: m.type, icon: '📦', color: '#64748b' };
      const isPositive = m.type === 'retour' || m.type === 'approvisionnement' || (m.type === 'ajustement' && m.quantite > 0);
      // Show munition ref name if available, otherwise fallback to weapon name
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
      <div>Aucune donnée de stock pour le moment.</div>
      <div style="margin-top:8px;">Commencez par configurer le stock dans l'onglet <strong>Munitions</strong>.</div>
    </div>`;
  }

  container.innerHTML = html;

  // Bind dashboard "Modifier" button for next prevision
  document.getElementById('btnDashEditPrev')?.addEventListener('click', (e) => {
    const prevId = e.currentTarget.dataset.id;
    _currentTab = 'previsions';
    renderStockTabs();
    renderPrevisionsTab(container);
    // Trigger edit form after rendering
    setTimeout(() => {
      const editBtn = container.querySelector(`.btn-prev-edit[data-id="${prevId}"]`);
      if (editBtn) editBtn.click();
    }, 50);
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

// Stock & Logistique — Main panel controller + Dashboard tab
import { getState } from '../state.js';
import { getWeaponsWithAlerts } from '../domains/stock-munitions.js';
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
  const alerts = getWeaponsWithAlerts();
  const weaponIssues = getWeaponsNeedingAttention();
  const mouvements = getRecentMouvements(8);
  const nextPrev = getNextPrevision();
  const { machines, stockMunitions } = getState();

  let html = '';

  // Section Alertes
  if (alerts.length > 0) {
    html += `<div class="stock-section-title">⚠️ Alertes de stock</div>`;
    alerts.forEach(a => {
      html += `<div class="alert-card ${a.level}">
        <div class="alert-icon">${a.level === 'critique' ? '🔴' : '🟡'}</div>
        <div class="alert-info">
          <div class="alert-name">${escapeHtml(a.nom)}${a.ref ? ' (' + escapeHtml(a.ref) + ')' : ''}</div>
          <div class="alert-detail">${a.stockActuel} ${a.unite}${a.stockActuel > 1 ? 's' : ''} restante${a.stockActuel > 1 ? 's' : ''} — seuil ${a.level === 'critique' ? 'critique' : "d'alerte"}: ${a.level === 'critique' ? a.seuilCritique : a.seuilAlerte}</div>
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

  // Niveaux de stock
  const activeMachines = machines.filter(m => m.nom);
  if (activeMachines.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">📊 Niveaux de stock</div>`;
    machines.forEach((m, idx) => {
      if (!m.nom) return;
      const stock = stockMunitions[idx];
      if (!stock) {
        html += `<div class="stock-card" style="padding:10px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><div class="stock-card-title" style="font-size:13px;">${escapeHtml(m.nom)}</div><div class="stock-card-sub">${escapeHtml(m.ref || '')}</div></div>
            <div style="font-size:11px;color:var(--text3);font-style:italic;">Non configuré</div>
          </div>
        </div>`;
        return;
      }
      const pct = stock.seuilAlerte > 0 ? Math.min(100, (stock.stockActuel / (stock.seuilAlerte * 2)) * 100) : 100;
      const level = stock.stockActuel <= stock.seuilCritique ? 'critique' : stock.stockActuel <= stock.seuilAlerte ? 'alerte' : 'ok';
      html += `<div class="stock-card" style="padding:10px 14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div><div class="stock-card-title" style="font-size:13px;">${escapeHtml(m.nom)}</div><div class="stock-card-sub">${escapeHtml(m.ref || '')}</div></div>
          <div class="stock-value ${level}" style="font-size:16px;">${stock.stockActuel}</div>
        </div>
        <div class="stock-bar-container"><div class="stock-bar ${level}" style="width:${pct}%;"></div></div>
        <div class="stock-info-row"><span>Alerte: ${stock.seuilAlerte}</span><span>Critique: ${stock.seuilCritique}</span></div>
      </div>`;
    });
  }

  // Prochaine séance de tir
  if (nextPrev) {
    html += `<div class="stock-section-title" style="margin-top:10px;">🎯 Prochaine séance de tir</div>`;
    html += `<div class="prevision-card">
      <div class="prevision-header">
        <div class="prevision-date">${nextPrev.date} — ${nextPrev.lieu || 'Lieu non défini'}</div>
        <div class="prevision-status planifie">Planifié</div>
      </div>
      <div style="font-size:12px;color:var(--text2);">${nextPrev.participants.length} participant${nextPrev.participants.length > 1 ? 's' : ''} · ${nextPrev.munitionsParAgent} mun./agent · Total: ${nextPrev.totalPrevu}</div>
    </div>`;
  }

  // Derniers mouvements
  if (mouvements.length > 0) {
    html += `<div class="stock-section-title" style="margin-top:10px;">📋 Derniers mouvements</div>`;
    html += `<div class="stock-card">`;
    mouvements.forEach(m => {
      const typeInfo = MOUVEMENT_TYPES[m.type] || { label: m.type, icon: '📦', color: '#64748b' };
      const isPositive = m.type === 'retour' || m.type === 'approvisionnement' || (m.type === 'ajustement' && m.quantite > 0);
      html += `<div class="mouvement-item">
        <div class="mouvement-icon">${typeInfo.icon}</div>
        <div class="mouvement-info">
          <div class="mouvement-type" style="color:${typeInfo.color};">${typeInfo.label}</div>
          <div class="mouvement-detail">${escapeHtml(getMachineName(m.armeIdx))} · ${escapeHtml(m.date)} ${escapeHtml(m.heure)}${m.motif ? ' · ' + escapeHtml(m.motif) : ''}</div>
        </div>
        <div class="mouvement-qty ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${m.quantite}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Empty state
  if (!alerts.length && !weaponIssues.length && !mouvements.length && !nextPrev && !activeMachines.some((_, i) => stockMunitions[i])) {
    html = `<div class="stock-empty">
      <div class="stock-empty-icon">📦</div>
      <div>Aucune donnée de stock pour le moment.</div>
      <div style="margin-top:8px;">Commencez par configurer le stock dans l'onglet <strong>Munitions</strong>.</div>
    </div>`;
  }

  container.innerHTML = html;
}

export function bindStockCallbacks(_callbacks) {
  // Reserved for future callbacks
}

export function refreshStockPanel() {
  if (document.getElementById('stockPanel')?.classList.contains('active')) {
    renderCurrentTab();
  }
}

// =============================================
// stock-page.js — Page Stock & Logistique
// Navigation par onglets icônes + labels courts
// Dashboard en page d'entrée
// =============================================

import { navigate } from '../router.js';

// --- Lazy-loaded module ---

let _stockModule = null;
async function getStockModule() {
  if (!_stockModule) _stockModule = await import('../ui/stock-panel.js');
  return _stockModule;
}

// --- Template ---

function getTemplate() {
  return `
<div class="stock-overlay" id="stockPanel">
  <div class="stock-header">
    <h2>📦 Stock & Logistique</h2>
    <button class="header-btn" id="btnCloseStock" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <nav class="stock-nav" role="tablist">
    <button class="stock-nav-tab active" data-tab="dashboard" role="tab">
      <span class="stock-nav-icon">📊</span>
      <span class="stock-nav-label">Accueil</span>
    </button>
    <button class="stock-nav-tab" data-tab="munitions" role="tab">
      <span class="stock-nav-icon">🔫</span>
      <span class="stock-nav-label">Munitions</span>
    </button>
    <button class="stock-nav-tab" data-tab="armes" role="tab">
      <span class="stock-nav-icon">🛡️</span>
      <span class="stock-nav-label">Armes</span>
    </button>
    <button class="stock-nav-tab" data-tab="previsions" role="tab">
      <span class="stock-nav-icon">🎯</span>
      <span class="stock-nav-label">Tir</span>
    </button>
    <button class="stock-nav-tab" data-tab="fournisseurs" role="tab">
      <span class="stock-nav-icon">🏪</span>
      <span class="stock-nav-label">Fournisseurs</span>
    </button>
    <button class="stock-nav-tab" data-tab="commandes" role="tab">
      <span class="stock-nav-icon">📋</span>
      <span class="stock-nav-label">Commandes</span>
    </button>
  </nav>
  <div id="stockTabContent"></div>
  <div style="height:20px;"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseStock').addEventListener('click', () => navigate('/'));
  document.querySelectorAll('#stockPanel .stock-nav-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      (await getStockModule()).switchStockTab(tab.dataset.tab);
    });
  });
}

// --- Page export ---

export const stockPage = {
  title: 'Stock & Armement',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    (await getStockModule()).openStock();
  },
  unmount() {},
};

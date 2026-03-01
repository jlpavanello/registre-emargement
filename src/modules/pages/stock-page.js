// =============================================
// stock-page.js — Page Stock & Logistique
// Munitions, Armes, Exercices de tir,
// Fournisseurs, Commandes, Dashboard
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
    <h2>\uD83D\uDCE6 Stock & Logistique</h2>
    <button class="header-btn" id="btnCloseStock" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="stock-tabs">
    <button class="stock-tab active" data-tab="munitions">Configuration des Munitions</button>
    <button class="stock-tab" data-tab="armes">\u00c9tat des Armes</button>
    <button class="stock-tab" data-tab="previsions">Programmation des exercices de tir</button>
    <button class="stock-tab" data-tab="fournisseurs">Cr\u00e9ation des fournisseurs</button>
    <button class="stock-tab" data-tab="commandes">Devis Commande</button>
  </div>
  <div class="stock-tabs stock-tabs-center">
    <button class="stock-tab" data-tab="dashboard">Dashboard</button>
  </div>
  <div id="stockTabContent"></div>
  <div style="height:20px;"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseStock').addEventListener('click', () => navigate('/'));
  document.querySelectorAll('#stockPanel .stock-tab').forEach(tab => {
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

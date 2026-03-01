// =============================================
// planning-page.js — Page Planning
// Mois, Semaine, Cycles, Congés, Compteurs
// =============================================

import { navigate } from '../router.js';

// --- Lazy-loaded module ---

let _planningModule = null;
async function getPlanningModule() {
  if (!_planningModule) _planningModule = await import('../ui/planning-panel.js');
  return _planningModule;
}

// --- Template ---

function getTemplate() {
  return `
<div class="planning-overlay" id="planningPanel">
  <div class="planning-header">
    <h2>\uD83D\uDCC5 Planning</h2>
    <button class="header-btn" id="btnClosePlanning" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="planning-tabs">
    <button class="planning-tab active" data-tab="month">\uD83D\uDCC6 Mois</button>
    <button class="planning-tab" data-tab="week">\uD83D\uDCCB Semaine</button>
    <button class="planning-tab" data-tab="cycles">\uD83D\uDD04 Cycles</button>
    <button class="planning-tab" data-tab="leaves">\uD83C\uDF34 Cong\u00e9s</button>
    <button class="planning-tab" data-tab="counters">\uD83D\uDCCA Compteurs</button>
  </div>
  <div id="planningTabContent"></div>
  <div style="height:20px;"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnClosePlanning').addEventListener('click', () => navigate('/'));
  document.querySelectorAll('#planningPanel .planning-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      (await getPlanningModule()).switchPlanningTab(tab.dataset.tab);
    });
  });
}

// --- Page export ---

export const planningPage = {
  title: 'Planning',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    (await getPlanningModule()).openPlanning();
  },
  unmount() {},
};

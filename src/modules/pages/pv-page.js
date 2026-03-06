// =============================================
// pv-page.js — Page Procès-Verbaux
// Modèles, Mes PV, Éditeur
// =============================================

// --- Lazy-loaded module ---

let _pvModule = null;
async function getPvModule() {
  if (!_pvModule) _pvModule = await import('../ui/pv-panel.js');
  return _pvModule;
}

// --- Template ---

function getTemplate() {
  return `
<div class="pv-overlay" id="pvPanel">
  <div class="pv-header">
    <h2>\uD83D\uDCCB Proc\u00e8s-Verbaux</h2>
  </div>
  <div class="pv-tabs">
    <button class="pv-tab active" data-tab="templates">Mod\u00e8les</button>
    <button class="pv-tab" data-tab="mespv">Mes PV</button>
    <button class="pv-tab" data-tab="editor" style="display:none;">\u00c9diteur</button>
  </div>
  <div id="pvTabContent"></div>
  <div style="height:20px;"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.querySelectorAll('#pvPanel .pv-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      (await getPvModule()).switchPvTab(tab.dataset.tab);
    });
  });
}

// --- Page export ---

export const pvPage = {
  title: 'Procès-Verbaux',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    (await getPvModule()).openPV();
  },
  unmount() {},
};

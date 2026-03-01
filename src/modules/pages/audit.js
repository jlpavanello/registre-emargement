// =============================================
// audit.js — Page Audit & Incidents
// Journal d'activité + rapports d'incidents
// =============================================

import { navigate } from '../router.js';

// --- Lazy-loaded module ---

let _auditModule = null;
async function getAuditModule() {
  if (!_auditModule) _auditModule = await import('../ui/audit-panel.js');
  return _auditModule;
}

// --- Template ---

function getTemplate() {
  return `
<div class="audit-overlay" id="auditPanel">
  <div class="audit-header">
    <h2>\uD83D\uDEE1\uFE0F Audit & Incidents</h2>
    <button class="header-btn" id="btnCloseAudit" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="audit-tabs">
    <button class="audit-tab active" data-tab="audit">\uD83D\uDCCB Journal</button>
    <button class="audit-tab" data-tab="incidents">\uD83D\uDEA8 Incidents</button>
  </div>
  <div id="auditTabContent"></div>
  <div style="height:20px;"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseAudit').addEventListener('click', () => navigate('/'));
  document.querySelectorAll('#auditPanel .audit-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      (await getAuditModule()).switchAuditTab(tab.dataset.tab);
    });
  });
}

// --- Page export ---

export const auditPage = {
  title: 'Audit & Incidents',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    (await getAuditModule()).openAuditPanel();
  },
  unmount() {},
};

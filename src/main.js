// =============================================
// main.js — Point d'entrée de l'application
// Importe les CSS, les modules, lie les événements
// =============================================

// --- CSS Imports ---
import './styles/variables.css';
import './styles/base.css';
import './styles/header.css';
import './styles/sections.css';
import './styles/period-tabs.css';
import './styles/employees.css';
import './styles/modal.css';
import './styles/visa.css';
import './styles/config.css';
import './styles/presence.css';
import './styles/bottom-bar.css';
import './styles/utilities.css';
import './styles/vocal-report.css';
import './styles/crew.css';
import './styles/stock.css';
import './styles/pv.css';

// --- Module Imports ---
// Domains
import { init, bindInitCallbacks } from './modules/domains/init.js';
import { addCategory } from './modules/domains/categories.js';
import { onArmurierSelectChange, onVisaSignerChange } from './modules/domains/responsables.js';
import { openPresenceSelector, closePresenceSelector, selectAllPresence, selectNonePresence, savePresence, removeFromPresent, bindPresenceCallbacks } from './modules/domains/presence.js';
import { openCrewSelector, closeCrewSelector, saveCrewAssignments, updateCrewBadge, bindCrewCallbacks } from './modules/domains/crew-assignment.js';

// UI
import { renderEmployees, switchPeriod, updateCounts, updateSoirTabState, bindRendererCallbacks } from './modules/ui/renderer.js';
import { openConfig, closeConfig, renderConfig, addItem, saveConfig, bindConfigCallbacks } from './modules/ui/config-panel.js';
import { openSignModal, closeModal, confirmSignature, onCatChange, onMachineChange, changeQty, onQtyInput, addMachineToList, goToAddAnotherMachine, goToSignStep, bindSignModalCallbacks } from './modules/ui/sign-modal.js';
import { clearCanvas } from './modules/ui/canvas.js';
import { openVisaSign, updateVisaButtonState, bindVisaCallbacks } from './modules/ui/visa.js';

// Actions
import { resetSignatures, fullReset, bindResetCallbacks } from './modules/actions/reset.js';
import { generatePDF } from './modules/actions/pdf.js';
// Vocal report
import { openVocalPanel, closeVocalPanel, startRecording, clearForm as clearVocalForm, saveCurrentReport, updateSaveButton, bindVocalCallbacks } from './modules/ui/vocal-panel.js';
import { generateVocalPDF } from './modules/actions/vocal-pdf.js';
// Stock & Logistique
import { openStock, closeStock, switchStockTab } from './modules/ui/stock-panel.js';
// PV (Procès-Verbaux)
import { openPV, closePV, switchPvTab } from './modules/ui/pv-panel.js';

// Phase 4: Sync engine
import { initSyncEngine } from './modules/supabase/sync-engine.js';
import { initSyncStatusUI } from './modules/supabase/sync-status.js';

// Phase 5: Auth
import { initAuth, onAuthStateChange } from './modules/auth/auth-state.js';
import { applyRoleGuards } from './modules/auth/auth-guard.js';
import { createLoginScreen, showRoleScreen } from './modules/auth/login-screen.js';

// Phase 6: Accessibility
import { initAccessibility } from './modules/a11y/accessibility.js';

// =============================================
// Late-binding callbacks to avoid circular deps
// =============================================

bindInitCallbacks({
  openConfig,
  renderEmployees,
  updateCounts,
  updateSoirTabState,
  updateVisaButtonState,
  openPresenceSelector,
});

bindRendererCallbacks({
  openSignModal,
  openConfig,
  openPresenceSelector,
  removeFromPresent,
});

bindSignModalCallbacks({
  renderEmployees,
  updateCounts,
  updateSoirTabState,
  updateVisaButtonState,
});

bindConfigCallbacks({
  renderEmployees,
  updateCounts,
});

bindPresenceCallbacks({
  renderEmployees,
  updateCounts,
  updateVisaButtonState,
});

bindVisaCallbacks({
  openSignModal,
});

bindResetCallbacks({
  renderEmployees,
  updateCounts,
  updateSoirTabState,
  closeConfig,
});

bindVocalCallbacks({
  generateVocalPDF,
});

bindCrewCallbacks({
  renderEmployees,
  updateCounts,
});

// =============================================
// Event Bindings (replacing inline onclick)
// =============================================

// Header
document.getElementById('btnOpenConfig').addEventListener('click', openConfig);
document.getElementById('btnChangeRole').addEventListener('click', () => {
  if (confirm('Changer le profil de cet appareil ?')) showRoleScreen();
});

// Period tabs
document.getElementById('tabMatin').addEventListener('click', () => switchPeriod('matin'));
document.getElementById('tabSoir').addEventListener('click', () => switchPeriod('soir'));

// Presence
document.getElementById('btnEditPresence').addEventListener('click', openPresenceSelector);
document.getElementById('btnClosePresence').addEventListener('click', closePresenceSelector);
document.getElementById('btnPresenceAll').addEventListener('click', selectAllPresence);
document.getElementById('btnPresenceNone').addEventListener('click', selectNonePresence);
document.getElementById('btnPresenceSave').addEventListener('click', savePresence);

// Visa
document.getElementById('visaSignerSelect').addEventListener('change', onVisaSignerChange);
document.getElementById('visaMatinBtn').addEventListener('click', () => openVisaSign('visaMatin'));
document.getElementById('visaSoirBtn').addEventListener('click', () => openVisaSign('visaSoir'));

// Bottom bar
document.getElementById('btnReset').addEventListener('click', resetSignatures);
document.getElementById('btnPDF').addEventListener('click', generatePDF);

// Modal signature
document.getElementById('btnModalCancel').addEventListener('click', closeModal);
document.getElementById('btnClear').addEventListener('click', clearCanvas);
document.getElementById('btnModalConfirm').addEventListener('click', confirmSignature);
document.getElementById('catSelect').addEventListener('change', onCatChange);
document.getElementById('machineSelect').addEventListener('change', onMachineChange);
document.getElementById('btnQtyMinus').addEventListener('click', () => changeQty(-1));
document.getElementById('btnQtyPlus').addEventListener('click', () => changeQty(+1));
document.getElementById('qtyValue').addEventListener('change', function () { onQtyInput(this); });
document.getElementById('qtyValue').addEventListener('input', function () { onQtyInput(this); });
document.getElementById('btnAddMachine').addEventListener('click', addMachineToList);
document.getElementById('btnAddAnother').addEventListener('click', goToAddAnotherMachine);
document.getElementById('btnGoToSign').addEventListener('click', goToSignStep);

// Config panel
document.getElementById('btnCloseConfig').addEventListener('click', closeConfig);
document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
document.getElementById('btnAddEmp').addEventListener('click', () => addItem('emp'));
document.getElementById('btnAddCat').addEventListener('click', addCategory);
document.getElementById('btnAddMach').addEventListener('click', () => addItem('mach'));
document.getElementById('configArmurierSelect').addEventListener('change', onArmurierSelectChange);

// Full reset (inside config panel)
document.getElementById('btnFullReset').addEventListener('click', fullReset);

// Vocal report panel
document.getElementById('btnOpenVocal').addEventListener('click', openVocalPanel);
document.getElementById('btnCloseVocal').addEventListener('click', closeVocalPanel);
document.getElementById('btnMic').addEventListener('click', startRecording);
document.getElementById('btnVocalClear').addEventListener('click', clearVocalForm);
document.getElementById('btnVocalSave').addEventListener('click', saveCurrentReport);
document.getElementById('vocalContenu').addEventListener('input', updateSaveButton);

// Crew (Équipages) panel
document.getElementById('btnEditCrew').addEventListener('click', openCrewSelector);
document.getElementById('btnCloseCrew').addEventListener('click', closeCrewSelector);
document.getElementById('btnSaveCrew').addEventListener('click', saveCrewAssignments);

// Config: Vehicles
document.getElementById('btnAddVeh').addEventListener('click', () => addItem('veh'));

// PV (Procès-Verbaux) panel
document.getElementById('btnOpenPV').addEventListener('click', openPV);
document.getElementById('btnClosePV').addEventListener('click', closePV);
document.querySelectorAll('#pvPanel .pv-tab').forEach(tab => {
  tab.addEventListener('click', () => switchPvTab(tab.dataset.tab));
});

// Stock & Logistique panel
document.getElementById('btnOpenStock').addEventListener('click', openStock);
document.getElementById('btnCloseStock').addEventListener('click', closeStock);
document.querySelectorAll('#stockPanel .stock-tab').forEach(tab => {
  tab.addEventListener('click', () => switchStockTab(tab.dataset.tab));
});

// =============================================
// PWA: Service Worker Registration
// =============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js?v=16')
      .then((reg) => console.log('SW enregistré:', reg.scope))
      .catch((err) => console.log('SW erreur:', err));
  });
}

// =============================================
// PWA: Install Prompt
// =============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (document.getElementById('pwa-install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText =
    'position:fixed;bottom:80px;left:12px;right:12px;background:linear-gradient(135deg,#1e293b,#0f172a);color:white;padding:14px 16px;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999;display:flex;align-items:center;gap:12px;animation:slideUp 0.4s ease;';
  banner.innerHTML = `
    <div style="flex:1">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;">📱 Installer l'application</div>
      <div style="font-size:11px;color:#94a3b8;">Accédez au registre depuis votre écran d'accueil</div>
    </div>
    <button id="pwa-install-btn" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">Installer</button>
    <button id="pwa-dismiss-btn" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:4px;">✕</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('pwa-install-btn').addEventListener('click', installPWA);
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => banner.remove());
}

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((result) => {
    if (result.outcome === 'accepted') {
      console.log('PWA installée');
    }
    deferredPrompt = null;
    const b = document.getElementById('pwa-install-banner');
    if (b) b.remove();
  });
}

window.addEventListener('appinstalled', () => {
  console.log('PWA installée avec succès');
  const b = document.getElementById('pwa-install-banner');
  if (b) b.remove();
});

// =============================================
// Initialize the application
// =============================================

async function bootstrap() {
  // Phase 6: Accessibility enhancements
  initAccessibility();

  // Phase 5: Create role selection screen (shown on first launch)
  createLoginScreen();

  // Phase 2+: init() is async (awaits IndexedDB initialization)
  await init();

  // Phase 5: Initialize auth and apply role guards
  await initAuth();
  onAuthStateChange(() => applyRoleGuards());
  applyRoleGuards();

  // Phase 4: Start sync engine
  initSyncEngine();
  initSyncStatusUI();
}

bootstrap().catch((err) => console.error('Init error:', err));

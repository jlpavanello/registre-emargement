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

// --- Module Imports ---
// Domains
import { init, bindInitCallbacks } from './modules/domains/init.js';
import { addCategory, removeCategory } from './modules/domains/categories.js';
import { onArmurierSelectChange, onVisaSignerChange } from './modules/domains/responsables.js';
import { openPresenceSelector, closePresenceSelector, selectAllPresence, selectNonePresence, savePresence, bindPresenceCallbacks } from './modules/domains/presence.js';

// UI
import { renderEmployees, switchPeriod, updateCounts, updateSoirTabState, bindRendererCallbacks } from './modules/ui/renderer.js';
import { openConfig, closeConfig, renderConfig, addItem, removeItem, saveConfig, bindConfigCallbacks } from './modules/ui/config-panel.js';
import { openSignModal, closeModal, confirmSignature, onCatChange, onMachineChange, changeQty, onQtyInput, addMachineToList, goToAddAnotherMachine, goToSignStep, bindSignModalCallbacks } from './modules/ui/sign-modal.js';
import { clearCanvas } from './modules/ui/canvas.js';
import { openVisaSign, updateVisaButtonState, bindVisaCallbacks } from './modules/ui/visa.js';

// Actions
import { resetSignatures, fullReset, bindResetCallbacks } from './modules/actions/reset.js';
import { generatePDF } from './modules/actions/pdf.js';
import { exportConfig, importConfig, bindExportImportCallbacks } from './modules/actions/export-import.js';

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

bindExportImportCallbacks({
  saveConfig,
  renderConfig,
  renderEmployees,
  updateCounts,
});

// =============================================
// Event Bindings (replacing inline onclick)
// =============================================

// Header
document.getElementById('btnOpenConfig').addEventListener('click', openConfig);

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
document.getElementById('btnRemEmp').addEventListener('click', () => removeItem('emp'));
document.getElementById('btnAddCat').addEventListener('click', addCategory);
document.getElementById('btnRemCat').addEventListener('click', removeCategory);
document.getElementById('btnAddMach').addEventListener('click', () => addItem('mach'));
document.getElementById('btnRemMach').addEventListener('click', () => removeItem('mach'));
document.getElementById('configArmurierSelect').addEventListener('change', onArmurierSelectChange);

// Export/Import
document.getElementById('btnExportConfig').addEventListener('click', exportConfig);
document.getElementById('btnImportConfig').addEventListener('click', () => document.getElementById('importFileInput').click());
document.getElementById('importFileInput').addEventListener('change', importConfig);

// Full reset (inside config panel)
document.getElementById('btnFullReset').addEventListener('click', fullReset);

// =============================================
// PWA: Service Worker Registration
// =============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
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
init();

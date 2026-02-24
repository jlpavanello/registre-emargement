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
import './styles/chat.css';
import './styles/audit.css';

// --- Module Imports ---
// Domains
import { init, bindInitCallbacks } from './modules/domains/init.js';
import { addCategory } from './modules/domains/categories.js';
import { onArmurierSelectChange, onVisaSignerChange, populateArmurierSelect } from './modules/domains/responsables.js';
import { getState, subscribe } from './modules/state.js';
import { openPresenceSelector, closePresenceSelector, selectAllPresence, selectNonePresence, savePresence, removeFromPresent, bindPresenceCallbacks } from './modules/domains/presence.js';
import { openCrewSelector, closeCrewSelector, saveCrewAssignments, updateCrewBadge, bindCrewCallbacks, onVehicleSelect, onAgentSelect } from './modules/domains/crew-assignment.js';

// UI
import { renderEmployees, switchPeriod, updateCounts, updateSoirTabState, bindRendererCallbacks } from './modules/ui/renderer.js';
import { openConfig, closeConfig, renderConfig, addItem, saveConfig, bindConfigCallbacks } from './modules/ui/config-panel.js';
import { openSignModal, closeModal, confirmSignature, onCatChange, onMachineChange, changeQty, onQtyInput, addMachineToList, goToAddAnotherMachine, goToSignStep, bindSignModalCallbacks } from './modules/ui/sign-modal.js';
import { clearCanvas } from './modules/ui/canvas.js';
import { openVisaSign, updateVisaButtonState, bindVisaCallbacks } from './modules/ui/visa.js';

// Actions
import { resetSignatures, fullReset, bindResetCallbacks } from './modules/actions/reset.js';
import { exportAllData, importAllData, bindExportImportCallbacks } from './modules/actions/export-import.js';

// --- Lazy-loaded modules (code-splitting) ---
// PDF, Vocal, Stock, PV, Chat sont chargés à la demande pour réduire le bundle initial

async function generatePDF() {
  const { generatePDF: gen } = await import('./modules/actions/pdf.js');
  return gen();
}

// Vocal report — lazy
let _vocalModule = null;
async function getVocalModule() {
  if (!_vocalModule) _vocalModule = await import('./modules/ui/vocal-panel.js');
  return _vocalModule;
}
async function openVocalPanel() {
  const mod = await getVocalModule();
  mod.bindVocalCallbacks({ generateVocalPDF });
  mod.openVocalPanel();
}
async function closeVocalPanel() { (await getVocalModule()).closeVocalPanel(); }
async function startRecording() { (await getVocalModule()).startRecording(); }
async function clearVocalForm() { (await getVocalModule()).clearForm(); }
async function saveCurrentReport() { (await getVocalModule()).saveCurrentReport(); }
async function updateSaveButton() { (await getVocalModule()).updateSaveButton(); }

let _vocalPdfModule = null;
async function generateVocalPDF(report) {
  if (!_vocalPdfModule) _vocalPdfModule = await import('./modules/actions/vocal-pdf.js');
  return _vocalPdfModule.generateVocalPDF(report);
}

// Stock & Logistique — lazy
let _stockModule = null;
async function getStockModule() {
  if (!_stockModule) _stockModule = await import('./modules/ui/stock-panel.js');
  return _stockModule;
}
async function openStock() { (await getStockModule()).openStock(); }
async function closeStock() { (await getStockModule()).closeStock(); }
async function switchStockTab(tab) { (await getStockModule()).switchStockTab(tab); }

// PV (Procès-Verbaux) — lazy
let _pvModule = null;
async function getPvModule() {
  if (!_pvModule) _pvModule = await import('./modules/ui/pv-panel.js');
  return _pvModule;
}
async function openPV() { (await getPvModule()).openPV(); }
async function closePV() { (await getPvModule()).closePV(); }
async function switchPvTab(tab) { (await getPvModule()).switchPvTab(tab); }

// Chat d'équipe — lazy
let _chatModule = null;
async function getChatModule() {
  if (!_chatModule) _chatModule = await import('./modules/ui/chat-widget.js');
  return _chatModule;
}
async function openChat() { (await getChatModule()).openChat(); }
async function closeChat() { (await getChatModule()).closeChat(); }
async function sendChatMessage() { (await getChatModule()).sendChatMessage(); }
async function initChatKeyboard() { (await getChatModule()).initChatKeyboard(); }
async function initNotifButton() { (await getChatModule()).initNotifButton(); }
async function onChatDataUpdated() { const m = await getChatModule(); m.onChatDataUpdated(); }

// Audit & Incidents — lazy
let _auditModule = null;
async function getAuditModule() {
  if (!_auditModule) _auditModule = await import('./modules/ui/audit-panel.js');
  return _auditModule;
}
async function openAuditPanel() { (await getAuditModule()).openAuditPanel(); }
async function closeAuditPanel() { (await getAuditModule()).closeAuditPanel(); }
async function switchAuditTab(tab) { (await getAuditModule()).switchAuditTab(tab); }

// Phase 4: Sync engine
import { initSyncEngine, schedulePush } from './modules/supabase/sync-engine.js';
import { initSyncStatusUI } from './modules/supabase/sync-status.js';

// Phase 5: Auth
import { initAuth, onAuthStateChange } from './modules/auth/auth-state.js';
import { applyRoleGuards } from './modules/auth/auth-guard.js';
import { createLoginScreen, showRoleScreen } from './modules/auth/login-screen.js';

// Phase 6: Accessibility
import { initAccessibility } from './modules/a11y/accessibility.js';

// Phase 7: Push Notifications
import { isPushSupported, getPushPermission, subscribeToPush } from './modules/push/push-notifications.js';

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
  afterSave: () => {
    populateMainArmurierSelect();
    updateShortcutCounts();
  },
});

bindPresenceCallbacks({
  renderEmployees,
  updateCounts,
  updateVisaButtonState,
  afterSave: () => {
    updatePresenceShortcutSub();
  },
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

// bindVocalCallbacks is now called lazily in openVocalPanel()

bindCrewCallbacks({
  renderEmployees,
  updateCounts,
  afterSave: () => { updateCrewPromptStats(); },
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
// btnEditPresence supprimé — la présence se gère via le pavé vert btnPresenceShortcut
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

// Export / Import (inside config panel)
document.getElementById('btnExportAll').addEventListener('click', exportAllData);
document.getElementById('btnImportAll').addEventListener('click', () => document.getElementById('fileImportAll').click());
document.getElementById('fileImportAll').addEventListener('change', importAllData);

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
document.getElementById('btnCrewShortcut').addEventListener('click', openCrewSelector);
document.getElementById('btnCloseCrew').addEventListener('click', closeCrewSelector);
document.getElementById('btnSaveCrew').addEventListener('click', saveCrewAssignments);
document.getElementById('crewVehicleSelect').addEventListener('change', onVehicleSelect);
document.getElementById('crewAgentSelect').addEventListener('change', onAgentSelect);

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

// Audit & Incidents panel
document.getElementById('btnOpenAudit').addEventListener('click', openAuditPanel);
document.getElementById('btnCloseAudit').addEventListener('click', closeAuditPanel);
document.querySelectorAll('#auditPanel .audit-tab').forEach(tab => {
  tab.addEventListener('click', () => switchAuditTab(tab.dataset.tab));
});

// Chat d'équipe
document.getElementById('chatFab').addEventListener('click', openChat);
document.getElementById('btnCloseChat').addEventListener('click', closeChat);
document.getElementById('btnSendChat').addEventListener('click', sendChatMessage);
initChatKeyboard();
initNotifButton();

// =============================================
// PWA: Service Worker Registration
// =============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(base + 'sw.js?v=20')
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
    'position:fixed;bottom:80px;left:12px;right:12px;background:linear-gradient(135deg,#2563eb,#1e3a8a);color:white;padding:14px 16px;border-radius:14px;box-shadow:0 10px 40px rgba(30,58,138,0.3);z-index:9999;display:flex;align-items:center;gap:12px;animation:slideUp 0.4s ease;';
  banner.innerHTML = `
    <div style="flex:1">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;">📱 Installer l'application</div>
      <div style="font-size:11px;color:#94a3b8;">Accédez à l'application depuis votre écran d'accueil</div>
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
// Main page: Armurier du jour + Config shortcuts
// =============================================

/**
 * Populate the "Armurier du jour" dropdown on the main page
 * using the team list (agents with names only)
 */
function populateMainArmurierSelect() {
  const { team, responsables } = getState();
  const sel = document.getElementById('armurierDuJour');
  const info = document.getElementById('armurierDuJourInfo');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Choisir l\'armurier —</option>';
  const active = team.map((t, i) => ({ ...t, idx: i })).filter(t => t.nom);
  active.forEach(t => {
    sel.innerHTML += `<option value="${t.idx}">${t.nom}${t.matricule ? ' — Mat. ' + t.matricule : ''}</option>`;
  });
  // Pre-select current armurier if set
  if (responsables.armurier.nom) {
    const match = active.find(
      t => t.nom === responsables.armurier.nom &&
        (!responsables.armurier.matricule || t.matricule === responsables.armurier.matricule)
    );
    if (match) {
      sel.value = match.idx;
      info.textContent = '✓ ' + match.nom + (match.matricule ? ' (Mat. ' + match.matricule + ')' : '');
    } else {
      info.textContent = responsables.armurier.nom + ' (non trouvé)';
    }
  } else {
    info.textContent = '';
  }
}

/** Handle main page armurier selection change */
function onMainArmurierChange() {
  const { team, responsables } = getState();
  const sel = document.getElementById('armurierDuJour');
  const info = document.getElementById('armurierDuJourInfo');
  const idx = parseInt(sel.value);
  if (isNaN(idx) || !team[idx]) {
    responsables.armurier = { nom: '', matricule: '' };
    info.textContent = '';
  } else {
    responsables.armurier = { nom: team[idx].nom, matricule: team[idx].matricule || '' };
    info.textContent = '✓ ' + team[idx].nom + (team[idx].matricule ? ' (Mat. ' + team[idx].matricule + ')' : '');
  }
  // Also sync with config panel armurier if open, and save
  import('./modules/domains/responsables.js').then(mod => {
    mod.saveResponsables();
    mod.populateVisaSignerSelect();
  });
}

/** Update shortcut count badges */
function updateShortcutCounts() {
  const { team, vehicles, categories, machines } = getState();
  const agentEl = document.getElementById('shortcutAgentCount');
  const vehiculeEl = document.getElementById('shortcutVehiculeCount');
  const categorieEl = document.getElementById('shortcutCategorieCount');
  const armeEl = document.getElementById('shortcutArmeCount');
  if (agentEl) agentEl.textContent = team.filter(t => t.nom).length;
  if (vehiculeEl) vehiculeEl.textContent = vehicles.length;
  if (categorieEl) categorieEl.textContent = categories.length;
  if (armeEl) armeEl.textContent = machines.filter(m => m.nom).length;
}

/** Open config and scroll to a specific section */
function openConfigToSection(section) {
  openConfig();
  // Wait for overlay to be visible before scrolling
  requestAnimationFrame(() => {
    setTimeout(() => {
      const panel = document.getElementById('configPanel');
      let target = null;
      switch (section) {
        case 'agents':
          target = document.getElementById('configEmpList');
          break;
        case 'vehicules':
          target = document.getElementById('configVehiclesList');
          break;
        case 'categories':
          target = document.getElementById('configCatList');
          break;
        case 'armes':
          target = document.getElementById('configMachList');
          break;
      }
      if (target && panel) {
        const offset = target.offsetTop - 80;
        panel.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }, 150);
  });
}

// Event: main page armurier select
document.getElementById('armurierDuJour').addEventListener('change', onMainArmurierChange);

// Event: config shortcut buttons
document.getElementById('btnShortcutAgents').addEventListener('click', () => openConfigToSection('agents'));
document.getElementById('btnShortcutVehicules').addEventListener('click', () => openConfigToSection('vehicules'));
document.getElementById('btnShortcutCategories').addEventListener('click', () => openConfigToSection('categories'));
document.getElementById('btnShortcutArmes').addEventListener('click', () => openConfigToSection('armes'));

// Event: presence shortcut button
document.getElementById('btnPresenceShortcut').addEventListener('click', openPresenceSelector);

/** Update the presence shortcut subtitle and stat badges (PM + ASVP) */
function updatePresenceShortcutSub() {
  const { presentToday, team } = getState();
  const sub = document.getElementById('presenceShortcutSub');
  const statPM = document.getElementById('presenceStatPM');
  const statASVP = document.getElementById('presenceStatASVP');
  if (!sub) return;

  const count = presentToday.length;
  const total = team.filter(t => t.nom).length;

  // Count present ASVP vs non-ASVP (PM)
  let asvpCount = 0;
  let pmCount = 0;
  presentToday.forEach(idx => {
    if (team[idx] && team[idx].nom) {
      if (team[idx].asvp) asvpCount++;
      else pmCount++;
    }
  });

  if (count === 0) {
    sub.textContent = 'Aucun agent sélectionné';
  } else {
    sub.textContent = count + ' agent' + (count > 1 ? 's' : '') + ' présent' + (count > 1 ? 's' : '') + ' sur un effectif de ' + total;
  }

  // Update stat badges
  if (statPM) {
    statPM.textContent = pmCount + ' agent' + (pmCount > 1 ? 's' : '');
  }
  if (statASVP) {
    statASVP.textContent = asvpCount + ' ASVP';
  }
}

/** Update the "Configurer la journée du ..." label with current date */
function updateDayConfigLabel() {
  const el = document.getElementById('dayConfigLabel');
  if (!el) return;
  const ds = document.getElementById('dateJour').value;
  if (ds) {
    const dateStr = new Date(ds + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    el.textContent = 'Configurer la journ\u00e9e du ' + dateStr;
  } else {
    el.textContent = 'Configurer la journ\u00e9e du \u2014';
  }
}

/** Update the crew prompt stats badges (équipages constitués + véhicules) */
function updateCrewPromptStats() {
  const { crewAssignments } = getState();
  const sub = document.getElementById('crewShortcutSub');
  const statEquip = document.getElementById('crewStatEquip');

  // Count vehicles with at least one member assigned
  let activeCrews = 0;
  let totalMembers = 0;
  for (const vIdx of Object.keys(crewAssignments)) {
    const members = crewAssignments[vIdx];
    if (members && members.length > 0) {
      activeCrews++;
      totalMembers += members.length;
    }
  }

  if (sub) {
    if (activeCrews === 0) {
      sub.textContent = 'Aucun équipage constitué';
    } else {
      sub.textContent = activeCrews + ' équipage' + (activeCrews > 1 ? 's' : '') + ' — ' + totalMembers + ' agent' + (totalMembers > 1 ? 's' : '') + ' affecté' + (totalMembers > 1 ? 's' : '');
    }
  }
  if (statEquip) {
    statEquip.textContent = activeCrews + ' équipage' + (activeCrews > 1 ? 's' : '');
  }
}

// Update day config label when date changes
document.getElementById('dateJour').addEventListener('change', updateDayConfigLabel);

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

  // Phase 4: Auto-sync — schedule push on any state change
  const syncKeys = [
    'team', 'machines', 'categories', 'responsables', 'vehicles', 'pageNumber',
    'dayData', 'presentToday', 'visaMatin', 'visaSoir',
    'visaMatinSigner', 'visaSoirSigner',
    'lockedMatinPresents', 'lockedSoirPresents',
    'crewAssignments', 'crewDrivers',
    'munitionRefs', 'stockArmes', 'stockMouvements',
    'previsionsTir', 'fournisseurs', 'commandes',
    'pvTemplates', 'pvDocuments',
    'vocalReports', 'chatMessages', 'auditLog', 'incidents',
  ];
  syncKeys.forEach(key => subscribe(key, () => schedulePush()));

  // Phase 7: Auto-subscribe to push if permission already granted
  if (isPushSupported() && getPushPermission() === 'granted') {
    subscribeToPush().catch(err => console.warn('Push auto-subscribe:', err));
  }

  // Populate main page elements
  populateMainArmurierSelect();
  updateShortcutCounts();
  updatePresenceShortcutSub();
  updateCrewPromptStats();
  updateDayConfigLabel();
}

bootstrap().catch((err) => console.error('Init error:', err));

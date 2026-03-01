// =============================================
// main.js — Point d'entree de l'application
// Bootstrap: CSS, routeur, auth, sync, PWA
// =============================================

// --- CSS Imports ---
import './styles/variables.css';
import './styles/base.css';
import './styles/page-shell.css';
import './styles/homepage.css';
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
import './styles/planning.css';

// --- Module Imports ---
import { init, bindInitCallbacks } from './modules/domains/init.js';
import { subscribe } from './modules/state.js';
import { openPresenceSelector, removeFromPresent } from './modules/domains/presence.js';

// UI (pour les callback bindings generiques)
import { renderEmployees, updateCounts, updateSoirTabState, bindRendererCallbacks } from './modules/ui/renderer.js';
import { openConfig, closeConfig, renderConfig, saveConfig } from './modules/ui/config-panel.js';
import { openSignModal, bindSignModalCallbacks } from './modules/ui/sign-modal.js';
import { updateVisaButtonState, bindVisaCallbacks } from './modules/ui/visa.js';

// Actions (callback bindings)
import { bindResetCallbacks } from './modules/actions/reset.js';
import { bindExportImportCallbacks } from './modules/actions/export-import.js';

// Sync engine
import { initSyncEngine, schedulePush } from './modules/supabase/sync-engine.js';
import { initSyncStatusUI } from './modules/supabase/sync-status.js';

// Auth
import { initAuth, onAuthStateChange } from './modules/auth/auth-state.js';
import { applyRoleGuards } from './modules/auth/auth-guard.js';
import { createLoginScreen } from './modules/auth/login-screen.js';

// Accessibility
import { initAccessibility } from './modules/a11y/accessibility.js';

// Push Notifications
import { isPushSupported, getPushPermission, subscribeToPush } from './modules/push/push-notifications.js';

// Routeur & Pages
import { initRouter, registerRoute } from './modules/router.js';
import { homepage } from './modules/pages/homepage.js';
import { registre, setPendingOverlay } from './modules/pages/registre.js';

// =============================================
// Late-binding callbacks (generiques, sans ref registre)
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
// PWA: Service Worker Registration
// =============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(base + 'sw.js?v=20')
      .then((reg) => console.log('SW enregistr\u00e9:', reg.scope))
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
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;">\uD83D\uDCF1 Installer l'application</div>
      <div style="font-size:11px;color:#94a3b8;">Acc\u00e9dez \u00e0 l'application depuis votre \u00e9cran d'accueil</div>
    </div>
    <button id="pwa-install-btn" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">Installer</button>
    <button id="pwa-dismiss-btn" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:4px;">\u2715</button>
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
      console.log('PWA install\u00e9e');
    }
    deferredPrompt = null;
    const b = document.getElementById('pwa-install-banner');
    if (b) b.remove();
  });
}

window.addEventListener('appinstalled', () => {
  console.log('PWA install\u00e9e avec succ\u00e8s');
  const b = document.getElementById('pwa-install-banner');
  if (b) b.remove();
});

// =============================================
// Enregistrement des routes
// =============================================

function registerRoutes() {
  // Page d'accueil
  registerRoute('/', homepage);

  // Page registre
  registerRoute('/registre', registre);

  // Routes outils — montent le registre avec auto-open overlay
  const overlayRoutes = [
    { path: '/presence', title: 'Pr\u00e9sence', overlay: 'presence' },
    { path: '/equipages', title: '\u00c9quipages', overlay: 'equipages' },
    { path: '/stock', title: 'Stock & Armement', overlay: 'stock' },
    { path: '/planning', title: 'Planning', overlay: 'planning' },
    { path: '/pv', title: 'Proc\u00e8s-Verbaux', overlay: 'pv' },
    { path: '/vocal', title: 'Comptes-rendus', overlay: 'vocal' },
    { path: '/audit', title: 'Audit & Incidents', overlay: 'audit' },
    { path: '/chat', title: 'Chat', overlay: 'chat' },
    { path: '/config', title: 'Configuration', overlay: 'config' },
  ];

  for (const route of overlayRoutes) {
    registerRoute(route.path, {
      title: route.title,
      mount(container) {
        setPendingOverlay(route.overlay);
        registre.mount(container);
      },
      unmount() {
        registre.unmount();
      },
    });
  }
}

// =============================================
// Bootstrap
// =============================================

async function bootstrap() {
  // Accessibility
  initAccessibility();

  // Role selection screen
  createLoginScreen();

  // Init data (IndexedDB + Supabase sync)
  await init();

  // Auth
  await initAuth();
  onAuthStateChange(() => applyRoleGuards());
  applyRoleGuards();

  // Sync engine
  initSyncEngine();
  initSyncStatusUI();

  // Auto-sync on state change
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
    'planningEntries', 'planningShifts', 'planningCycles', 'planningLeaves',
  ];
  syncKeys.forEach(key => subscribe(key, () => schedulePush()));

  // Push notifications
  if (isPushSupported() && getPushPermission() === 'granted') {
    subscribeToPush().catch(err => console.warn('Push auto-subscribe:', err));
  }

  // Routeur
  registerRoutes();
  const appContainer = document.getElementById('app');
  initRouter(appContainer);
}

bootstrap().catch((err) => console.error('Init error:', err));

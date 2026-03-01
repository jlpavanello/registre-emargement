// =============================================
// registre.js — Page Registre d'Emargement
// Signatures matin/soir, armes, visa, PDF
// =============================================

// --- Imports Domains ---
import { getState } from '../state.js';
import { addCategory } from '../domains/categories.js';
import { onArmurierSelectChange, onVisaSignerChange } from '../domains/responsables.js';
import { openPresenceSelector, closePresenceSelector, selectAllPresence, selectNonePresence, savePresence, removeFromPresent, bindPresenceCallbacks } from '../domains/presence.js';
import { openCrewSelector, closeCrewSelector, saveCrewAssignments, bindCrewCallbacks, onVehicleSelect, onAgentSelect } from '../domains/crew-assignment.js';
import { saveInfoFields } from '../domains/info-fields.js';
import { updatePageNumberDisplay } from '../domains/page-number.js';

// --- Imports UI ---
import { renderEmployees, switchPeriod, updateCounts, updateSoirTabState } from '../ui/renderer.js';
import { openConfig, closeConfig, addItem, saveConfig, bindConfigCallbacks } from '../ui/config-panel.js';
import { openVisaSign, updateVisaButtonState } from '../ui/visa.js';
import { openSignModal } from '../ui/sign-modal.js';

// --- Imports Actions ---
import { resetSignatures, fullReset } from '../actions/reset.js';

// --- Imports Auth ---
import { showRoleScreen } from '../auth/login-screen.js';

// =============================================
// Lazy-loaded modules (code-splitting)
// =============================================

async function generatePDF() {
  const { generatePDF: gen } = await import('../actions/pdf.js');
  return gen();
}

// Vocal report
let _vocalModule = null;
async function getVocalModule() {
  if (!_vocalModule) _vocalModule = await import('../ui/vocal-panel.js');
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
  if (!_vocalPdfModule) _vocalPdfModule = await import('../actions/vocal-pdf.js');
  return _vocalPdfModule.generateVocalPDF(report);
}

// Stock & Logistique
let _stockModule = null;
async function getStockModule() {
  if (!_stockModule) _stockModule = await import('../ui/stock-panel.js');
  return _stockModule;
}
async function openStock() { (await getStockModule()).openStock(); }
async function closeStock() { (await getStockModule()).closeStock(); }
async function switchStockTab(tab) { (await getStockModule()).switchStockTab(tab); }

// PV (Proces-Verbaux)
let _pvModule = null;
async function getPvModule() {
  if (!_pvModule) _pvModule = await import('../ui/pv-panel.js');
  return _pvModule;
}
async function openPV() { (await getPvModule()).openPV(); }
async function closePV() { (await getPvModule()).closePV(); }
async function switchPvTab(tab) { (await getPvModule()).switchPvTab(tab); }

// Chat d'equipe
let _chatModule = null;
async function getChatModule() {
  if (!_chatModule) _chatModule = await import('../ui/chat-widget.js');
  return _chatModule;
}
async function openChat() { (await getChatModule()).openChat(); }
async function closeChat() { (await getChatModule()).closeChat(); }
async function sendChatMessage() { (await getChatModule()).sendChatMessage(); }
async function initChatKeyboard() { (await getChatModule()).initChatKeyboard(); }
async function initNotifButton() { (await getChatModule()).initNotifButton(); }

// Audit & Incidents
let _auditModule = null;
async function getAuditModule() {
  if (!_auditModule) _auditModule = await import('../ui/audit-panel.js');
  return _auditModule;
}
async function openAuditPanel() { (await getAuditModule()).openAuditPanel(); }
async function closeAuditPanel() { (await getAuditModule()).closeAuditPanel(); }
async function switchAuditTab(tab) { (await getAuditModule()).switchAuditTab(tab); }

// Planning
let _planningModule = null;
async function getPlanningModule() {
  if (!_planningModule) _planningModule = await import('../ui/planning-panel.js');
  return _planningModule;
}
async function openPlanning() { (await getPlanningModule()).openPlanning(); }
async function closePlanning() { (await getPlanningModule()).closePlanning(); }
async function switchPlanningTab(tab) { (await getPlanningModule()).switchPlanningTab(tab); }

// =============================================
// Fonctions specifiques au registre
// =============================================

/** Remplir le select "Armurier du jour" */
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
  if (responsables.armurier.nom) {
    const match = active.find(
      t => t.nom === responsables.armurier.nom &&
        (!responsables.armurier.matricule || t.matricule === responsables.armurier.matricule)
    );
    if (match) {
      sel.value = match.idx;
      info.textContent = '\u2713 ' + match.nom + (match.matricule ? ' (Mat. ' + match.matricule + ')' : '');
    } else {
      info.textContent = responsables.armurier.nom + ' (non trouv\u00e9)';
    }
  } else {
    info.textContent = '';
  }
}

/** Handler changement armurier */
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
    info.textContent = '\u2713 ' + team[idx].nom + (team[idx].matricule ? ' (Mat. ' + team[idx].matricule + ')' : '');
  }
  import('../domains/responsables.js').then(mod => {
    mod.saveResponsables();
    mod.populateVisaSignerSelect();
  });
}

/** Mettre a jour les badges des raccourcis config */
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

/** Ouvrir config et scroller a une section */
function openConfigToSection(section) {
  openConfig();
  requestAnimationFrame(() => {
    setTimeout(() => {
      const panel = document.getElementById('configPanel');
      let target = null;
      switch (section) {
        case 'agents': target = document.getElementById('configEmpList'); break;
        case 'vehicules': target = document.getElementById('configVehiclesList'); break;
        case 'categories': target = document.getElementById('configCatList'); break;
        case 'armes': target = document.getElementById('configMachList'); break;
      }
      if (target && panel) {
        const offset = target.offsetTop - 80;
        panel.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }, 150);
  });
}

/** Mettre a jour le sous-titre presence + badges PM/ASVP */
function updatePresenceShortcutSub() {
  const { presentToday, team } = getState();
  const sub = document.getElementById('presenceShortcutSub');
  const statPM = document.getElementById('presenceStatPM');
  const statASVP = document.getElementById('presenceStatASVP');
  if (!sub) return;

  const count = presentToday.length;
  const total = team.filter(t => t.nom).length;

  let asvpCount = 0;
  let pmCount = 0;
  presentToday.forEach(idx => {
    if (team[idx] && team[idx].nom) {
      if (team[idx].asvp) asvpCount++;
      else pmCount++;
    }
  });

  if (count === 0) {
    sub.textContent = 'Aucun agent s\u00e9lectionn\u00e9';
  } else {
    sub.textContent = count + ' agent' + (count > 1 ? 's' : '') + ' pr\u00e9sent' + (count > 1 ? 's' : '') + ' sur un effectif de ' + total;
  }
  if (statPM) statPM.textContent = pmCount + ' agent' + (pmCount > 1 ? 's' : '');
  if (statASVP) statASVP.textContent = asvpCount + ' ASVP';
}

/** Mettre a jour le label "Configurer la journee du ..." */
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

/** Mettre a jour les stats equipages */
function updateCrewPromptStats() {
  const { crewAssignments } = getState();
  const sub = document.getElementById('crewShortcutSub');
  const statEquip = document.getElementById('crewStatEquip');

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
      sub.textContent = 'Aucun \u00e9quipage constitu\u00e9';
    } else {
      sub.textContent = activeCrews + ' \u00e9quipage' + (activeCrews > 1 ? 's' : '') + ' \u2014 ' + totalMembers + ' agent' + (totalMembers > 1 ? 's' : '') + ' affect\u00e9' + (totalMembers > 1 ? 's' : '');
    }
  }
  if (statEquip) {
    statEquip.textContent = activeCrews + ' \u00e9quipage' + (activeCrews > 1 ? 's' : '');
  }
}

// =============================================
// Overlay auto-open (phase de transition)
// =============================================

let _pendingOverlay = null;

/**
 * Marque un overlay a ouvrir apres le mount du registre.
 * Utilise par les routes /config, /vocal, etc.
 */
export function setPendingOverlay(overlayId) {
  _pendingOverlay = overlayId;
}

const OVERLAY_MAP = {
  config: openConfig,
  vocal: openVocalPanel,
  stock: openStock,
  pv: openPV,
  chat: openChat,
  audit: openAuditPanel,
  planning: openPlanning,
  presence: openPresenceSelector,
  equipages: openCrewSelector,
};

// =============================================
// Template HTML
// =============================================

function getTemplate() {
  return `
<header>
  <h1>GESTION OP\u00c9RATIONNELLE PM</h1>
  <div style="display:flex;align-items:center;gap:6px;">
    <button class="header-btn" id="btnChangeRole" title="Changer de profil" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
      Profil
    </button>
    <button class="header-btn" id="btnOpenAudit" title="Audit & Incidents" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      \uD83D\uDEE1\uFE0F
    </button>
    <button class="header-btn" id="btnOpenPV" title="Proc\u00e8s-Verbaux" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      \uD83D\uDCCB PV
    </button>
    <button class="header-btn" id="btnOpenPlanning" title="Planning" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      \uD83D\uDCC5 Planning
    </button>
    <button class="header-btn" id="btnOpenStock" title="Stock & Logistique" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      \uD83D\uDCE6 Stock
    </button>
    <button class="header-btn" id="btnOpenConfig">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      Config
    </button>
  </div>
</header>

<div class="section">
  <div class="pm-identity">
    <img src="/logo-police-municipale.png" alt="Police Municipale" class="pm-logo">
    <div class="pm-text">
      <div class="pm-title">Police Municipale</div>
      <div class="pm-ville-field">
        <span>de</span>
        <input type="text" id="entreprise" placeholder="Nom de la ville" class="pm-ville-input">
      </div>
    </div>
  </div>
  <h2 class="info-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Informations du jour</h2>
  <div class="info-grid">
    <div class="info-field"><label>Date</label><input type="date" id="dateJour"></div>
    <div class="info-field"><label>Responsable</label><input type="text" id="responsable" placeholder="Nom"></div>
  </div>
  <div class="info-grid" style="margin-top:10px;">
    <div class="info-armurier">
      <label>Armurier du jour</label>
      <select id="armurierDuJour" class="armurier-select">
        <option value="">— Choisir l'armurier —</option>
      </select>
      <div class="armurier-info" id="armurierDuJourInfo"></div>
    </div>
    <div class="info-folio">
      <label>Folio</label>
      <div class="folio-badge" id="pageNumberBadge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span id="pageNumberText">Page n\u00B0 \u2014</span>
      </div>
    </div>
  </div>
  <input type="hidden" id="refChantier" value="">
  <input type="hidden" id="adresseChantier" value="">
</div>

<!-- CONFIGURATION RAPIDE -->
<div class="section config-shortcuts" id="sectionConfigMoyens">
  <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> Configuration des moyens</h2>
  <div class="config-shortcut-grid">
    <button class="config-shortcut-btn" id="btnShortcutAgents" data-section="agents">
      <div class="shortcut-icon agent-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <span class="shortcut-label">Agents</span>
      <span class="shortcut-count" id="shortcutAgentCount">0</span>
    </button>
    <button class="config-shortcut-btn" id="btnShortcutVehicules" data-section="vehicules">
      <div class="shortcut-icon vehicule-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
      </div>
      <span class="shortcut-label">V\u00e9hicules</span>
      <span class="shortcut-count" id="shortcutVehiculeCount">0</span>
    </button>
    <button class="config-shortcut-btn" id="btnShortcutCategories" data-section="categories">
      <div class="shortcut-icon categorie-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </div>
      <span class="shortcut-label">Cat\u00e9gories Arme</span>
      <span class="shortcut-count" id="shortcutCategorieCount">0</span>
    </button>
    <button class="config-shortcut-btn" id="btnShortcutArmes" data-section="armes">
      <div class="shortcut-icon arme-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
      </div>
      <span class="shortcut-label">Armes</span>
      <span class="shortcut-count" id="shortcutArmeCount">0</span>
    </button>
  </div>
</div>

<!-- TEXTE JOURNEE -->
<div class="day-config-label" id="dayConfigLabel">Configurer la journ\u00e9e du \u2014</div>

<!-- SELECTION DES PRESENTS (raccourci) -->
<div class="presence-prompt-box" id="presencePromptBox">
  <div class="presence-prompt-left">
    <svg viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2" style="width:32px;height:32px;flex-shrink:0;">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
    <div class="presence-prompt-info">
      <p id="presenceShortcutSub">S\u00e9lectionnez les agents pr\u00e9sents aujourd'hui</p>
      <button id="btnPresenceShortcut">Choisir / modifier la liste des pr\u00e9sents</button>
    </div>
  </div>
  <div class="presence-prompt-stats">
    <span class="presence-stat-badge pm" id="presenceStatPM">0 agent</span>
    <span class="presence-stat-badge asvp" id="presenceStatASVP">ASVP 0</span>
  </div>
</div>

<!-- CONSTITUTION DES EQUIPAGES -->
<div class="crew-prompt-box" id="crewPromptBox">
  <div class="crew-prompt-left">
    <svg viewBox="0 0 24 24" fill="none" stroke="#4c1d95" stroke-width="1.8" style="width:36px;height:36px;flex-shrink:0;">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h1"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
    <div class="crew-prompt-info">
      <p id="crewShortcutSub">Aucun \u00e9quipage constitu\u00e9</p>
      <button id="btnCrewShortcut">Constituer les \u00e9quipages v\u00e9hicules</button>
    </div>
  </div>
  <div class="crew-prompt-stats">
    <span class="crew-stat-badge equip" id="crewStatEquip">0 \u00e9quipage</span>
  </div>
</div>

<div class="period-tabs">
  <button class="period-tab active" id="tabMatin">SORTIE DES ARMES<span class="count" id="countMatin">0/0</span></button>
  <button class="period-tab" id="tabSoir">RETOUR DES ARMES<span class="count" id="countSoir">0/0</span></button>
</div>

<div id="presenceBadgeArea" style="display:none;">
  <div class="presence-badge" id="presenceBadge" style="display:none;"></div>
</div>
<div id="crewBadgeArea" style="display:none;">
  <div class="crew-badge" id="crewBadge" style="display:none;"></div>
</div>
<div id="employeesList" class="employees-list"></div>

<div id="lockedBanner" class="locked-banner" style="display:none;">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  <span id="lockedText"></span>
</div>

<div class="section">
  <h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Visa du responsable</h2>
  <div class="visa-signer-info">Qui signe le registre ?</div>
  <select class="visa-signer-select" id="visaSignerSelect">
    <option value="">— Choisir le signataire —</option>
  </select>
  <div class="visa-row">
    <div class="visa-block">
      <label class="matin-label">Sortie des armes</label>
      <div class="visa-sign-btn mini" id="visaMatinBtn">Signer</div>
      <div class="visa-signed-by" id="visaMatinSignedBy" style="display:none;"></div>
    </div>
    <div class="visa-block">
      <label class="soir-label">Retour des armes</label>
      <div class="visa-sign-btn mini" id="visaSoirBtn">Signer</div>
      <div class="visa-signed-by" id="visaSoirSignedBy" style="display:none;"></div>
    </div>
  </div>
</div>

<div class="bottom-bar">
  <button class="btn-secondary btn-danger" id="btnReset">Effacer</button>
  <button class="btn-secondary" id="btnOpenVocal" style="background:linear-gradient(135deg,#059669,#047857);color:white;border:none;">\uD83C\uDFA4 Rapport</button>
  <button class="btn-main" id="btnPDF">G\u00e9n\u00e9rer le PDF</button>
</div>

<!-- SELECTION DES PRESENTS -->
<div class="presence-overlay" id="presencePanel">
  <div class="presence-header">
    <h2>Pr\u00e9sents du jour</h2>
    <button class="header-btn" id="btnClosePresence" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="presence-info">Cochez les agents de service aujourd'hui. Seuls les agents s\u00e9lectionn\u00e9s pourront signer et prendre du mat\u00e9riel.</div>
  <div class="presence-actions">
    <button class="btn-all" id="btnPresenceAll">Tous</button>
    <button class="btn-none" id="btnPresenceNone">Aucun</button>
  </div>
  <div class="presence-count" id="presenceCount">0 s\u00e9lectionn\u00e9s</div>
  <div id="presenceList"></div>
  <div style="height:90px;"></div>
  <div class="presence-bottom"><button class="btn-presence-save" id="btnPresenceSave">Valider la s\u00e9lection</button></div>
</div>

<!-- CONFIG -->
<div class="config-overlay" id="configPanel">
  <div class="config-header">
    <h2>Configuration</h2>
    <button class="header-btn" id="btnCloseConfig" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="config-info">Configurez votre \u00e9quipe, vos responsables et vos machines. Ces donn\u00e9es sont sauvegard\u00e9es et pr\u00e9-remplies chaque jour.</div>
  <div class="config-section-title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    Responsables / Signataires
  </div>
  <div class="config-card">
    <div class="cnum resp-bg"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width:16px;height:16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
    <div class="fields">
      <input class="name-input" type="text" placeholder="Nom du Chef d'unit\u00e9" id="configChefUnite">
      <input class="sub-input" type="text" placeholder="Matricule (optionnel)" id="configChefMat">
    </div>
  </div>
  <div class="config-card">
    <div class="cnum resp-bg"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width:16px;height:16px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
    <div class="fields">
      <select class="cat-select" id="configArmurierSelect" style="font-weight:600; font-size:13px;">
        <option value="">— Choisir l'Armurier parmi les agents —</option>
      </select>
      <div id="configArmurierInfo" style="font-size:11px; color:#94a3b8; font-weight:500; padding:2px 4px;"></div>
    </div>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    Agents
  </div>
  <div id="configEmpList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddEmp">+ Agent</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
    Cat\u00e9gories d'armes
  </div>
  <div class="config-info" style="background:linear-gradient(135deg,#eff6ff,#dbeafe); border-color:#93c5fd; color:#1e40af;">
    Cr\u00e9ez vos cat\u00e9gories ici. Elles appara\u00eetront dans le menu d\u00e9roulant lors de la signature et dans la config des armes.
  </div>
  <div id="configCatList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddCat">+ Cat\u00e9gorie</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
    Armes
  </div>
  <div id="configMachList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddMach">+ Arme</button>
  </div>
  <div class="config-section-title" style="margin-top:6px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    V\u00e9hicules
  </div>
  <div id="configVehiclesList"></div>
  <div class="config-add-row">
    <button class="config-add-btn" id="btnAddVeh">+ V\u00e9hicule</button>
  </div>
  <div class="config-section-title" style="margin-top:16px; color: var(--red);">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    Zone de remise \u00e0 z\u00e9ro
  </div>
  <div style="margin:6px 12px; padding:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:14px;">
    <p style="font-size:12px; color:#991b1b; margin-bottom:10px; line-height:1.5;">
      Utilisez ce bouton uniquement lorsque le registre du jour est <strong>finalis\u00e9</strong> (PDF g\u00e9n\u00e9r\u00e9).
      Cela efface toutes les signatures, les visas, la s\u00e9lection des pr\u00e9sents et remet le compteur de page \u00e0 z\u00e9ro.
    </p>
    <button id="btnFullReset" style="width:100%; padding:12px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
      Remise \u00e0 z\u00e9ro compl\u00e8te
    </button>
  </div>
  <div style="height:90px;"></div>
  <div class="config-bottom"><button class="btn-config-save" id="btnSaveConfig">Enregistrer</button></div>
</div>

<!-- COMPTE-RENDU VOCAL -->
<div class="vocal-overlay" id="vocalPanel">
  <div class="vocal-header">
    <h2>\uD83C\uDFA4 Compte-rendu de mission</h2>
    <button class="header-btn" id="btnCloseVocal" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="vocal-form">
    <label>Lieu de la mission</label>
    <input type="text" id="vocalLieu" placeholder="Ex: 12 rue de la Paix, Place du march\u00e9...">
    <label>Objet de la mission</label>
    <input type="text" id="vocalObjet" placeholder="Ex: Contr\u00f4le routier, Patrouille...">
    <label>Famille de mission</label>
    <select id="vocalFamille">
      <option value="">— Choisir la famille —</option>
      <option value="Stationnement">Stationnement</option>
      <option value="Circulation">Circulation</option>
      <option value="Tranquillit\u00e9 publique">Tranquillit\u00e9 publique</option>
      <option value="Propret\u00e9 urbaine">Propret\u00e9 urbaine</option>
      <option value="Animaux">Animaux</option>
      <option value="Domaine public">Domaine public</option>
      <option value="March\u00e9s / Commerce">March\u00e9s / Commerce</option>
      <option value="Arr\u00eat\u00e9s Municipaux">Arr\u00eat\u00e9s Municipaux</option>
      <option value="Divers">Divers</option>
    </select>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;"><label>Heure de la mission</label><input type="time" id="vocalHeureMission"></div>
      <div style="flex:1;"><label>Dur\u00e9e</label><input type="text" id="vocalDuree" placeholder="Ex: 2h30, 45 min..."></div>
    </div>
    <label>Compte-rendu</label>
    <div class="vocal-mic-area">
      <button class="btn-mic" id="btnMic" title="Dicter le rapport">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>
      <div>
        <div class="vocal-mic-status" id="vocalMicStatus">Appuyez pour dicter</div>
        <div class="vocal-interim" id="vocalInterim"></div>
      </div>
    </div>
    <textarea id="vocalContenu" placeholder="Dictez ou saisissez votre compte-rendu ici..."></textarea>
    <div class="vocal-form-actions">
      <button class="btn-vocal-clear" id="btnVocalClear">Effacer</button>
      <button class="btn-vocal-save" id="btnVocalSave" disabled>Enregistrer le rapport</button>
    </div>
  </div>
  <div class="vocal-section-title" style="margin-top:4px;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    Rapports enregistr\u00e9s
  </div>
  <div id="vocalReportsList"></div>
  <div class="vocal-spacer"></div>
</div>

<!-- EQUIPAGES (Crew Assignment) -->
<div class="crew-overlay" id="crewPanel">
  <div class="crew-header">
    <h2>\uD83D\uDE97 \u00c9quipages v\u00e9hicules</h2>
    <button class="header-btn" id="btnCloseCrew" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="crew-info">Choisissez un v\u00e9hicule, puis ajoutez les agents de l'\u00e9quipage.</div>
  <div class="crew-select-section">
    <label class="crew-select-label">V\u00e9hicule</label>
    <select id="crewVehicleSelect" class="crew-select">
      <option value="">— Choisir un v\u00e9hicule —</option>
    </select>
  </div>
  <div class="crew-select-section" id="crewAgentSection" style="display:none;">
    <label class="crew-select-label">Ajouter un agent \u00e0 l'\u00e9quipage</label>
    <select id="crewAgentSelect" class="crew-select">
      <option value="">— Choisir un agent —</option>
    </select>
  </div>
  <div id="crewAssignedList" style="display:none;">
    <div class="crew-assigned-header">
      <span id="crewAssignedTitle">\u00c9quipage</span>
      <span class="crew-count" id="crewCount">0 agent</span>
    </div>
    <div id="crewAssignedMembers"></div>
  </div>
  <div id="crewSummary"></div>
  <div style="height:90px;"></div>
  <div class="crew-bottom"><button class="btn-crew-save" id="btnSaveCrew">Valider les \u00e9quipages</button></div>
</div>

<!-- PV (PROCES-VERBAUX) -->
<div class="pv-overlay" id="pvPanel">
  <div class="pv-header">
    <h2>\uD83D\uDCCB Proc\u00e8s-Verbaux</h2>
    <button class="header-btn" id="btnClosePV" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="pv-tabs">
    <button class="pv-tab active" data-tab="templates">Mod\u00e8les</button>
    <button class="pv-tab" data-tab="mespv">Mes PV</button>
    <button class="pv-tab" data-tab="editor" style="display:none;">\u00c9diteur</button>
  </div>
  <div id="pvTabContent"></div>
  <div style="height:20px;"></div>
</div>

<!-- STOCK & LOGISTIQUE -->
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

<!-- AUDIT & INCIDENTS -->
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

<!-- CHAT D'EQUIPE (Widget flottant) -->
<button class="chat-fab" id="chatFab" title="Chat d'\u00e9quipe">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span class="chat-fab-badge" id="chatBadge" style="display:none;">0</span>
</button>

<div class="chat-overlay" id="chatPanel">
  <div class="chat-widget">
    <div class="chat-header">
      <span class="chat-header-title">\uD83D\uDCAC Chat d'\u00e9quipe</span>
      <button class="chat-notif-btn notif-default" id="btnChatNotif" title="Activer les notifications">\uD83D\uDD14</button>
      <button class="chat-header-btn" id="btnCloseChat" title="Fermer">\u2715</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-bar">
      <input type="text" id="chatInput" placeholder="Message..." maxlength="500">
      <button id="btnSendChat">Envoyer</button>
    </div>
  </div>
</div>

<!-- PLANNING -->
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

// =============================================
// Event Bindings
// =============================================

function bindEvents() {
  // Header
  document.getElementById('btnOpenConfig').addEventListener('click', openConfig);
  document.getElementById('btnChangeRole').addEventListener('click', () => {
    if (confirm('Changer le profil de cet appareil ?')) showRoleScreen();
  });

  // Period tabs
  document.getElementById('tabMatin').addEventListener('click', () => switchPeriod('matin'));
  document.getElementById('tabSoir').addEventListener('click', () => switchPeriod('soir'));

  // Presence overlay
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

  // Config panel
  document.getElementById('btnCloseConfig').addEventListener('click', closeConfig);
  document.getElementById('btnSaveConfig').addEventListener('click', saveConfig);
  document.getElementById('btnAddEmp').addEventListener('click', () => addItem('emp'));
  document.getElementById('btnAddCat').addEventListener('click', addCategory);
  document.getElementById('btnAddMach').addEventListener('click', () => addItem('mach'));
  document.getElementById('configArmurierSelect').addEventListener('change', onArmurierSelectChange);
  document.getElementById('btnFullReset').addEventListener('click', fullReset);
  document.getElementById('btnAddVeh').addEventListener('click', () => addItem('veh'));

  // Vocal report panel
  document.getElementById('btnOpenVocal').addEventListener('click', openVocalPanel);
  document.getElementById('btnCloseVocal').addEventListener('click', closeVocalPanel);
  document.getElementById('btnMic').addEventListener('click', startRecording);
  document.getElementById('btnVocalClear').addEventListener('click', clearVocalForm);
  document.getElementById('btnVocalSave').addEventListener('click', saveCurrentReport);
  document.getElementById('vocalContenu').addEventListener('input', updateSaveButton);

  // Crew (Equipages) panel
  document.getElementById('btnCrewShortcut').addEventListener('click', openCrewSelector);
  document.getElementById('btnCloseCrew').addEventListener('click', closeCrewSelector);
  document.getElementById('btnSaveCrew').addEventListener('click', saveCrewAssignments);
  document.getElementById('crewVehicleSelect').addEventListener('change', onVehicleSelect);
  document.getElementById('crewAgentSelect').addEventListener('change', onAgentSelect);

  // PV panel
  document.getElementById('btnOpenPV').addEventListener('click', openPV);
  document.getElementById('btnClosePV').addEventListener('click', closePV);
  document.querySelectorAll('#pvPanel .pv-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPvTab(tab.dataset.tab));
  });

  // Planning panel
  document.getElementById('btnOpenPlanning').addEventListener('click', openPlanning);
  document.getElementById('btnClosePlanning').addEventListener('click', closePlanning);
  document.querySelectorAll('#planningPanel .planning-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPlanningTab(tab.dataset.tab));
  });

  // Stock panel
  document.getElementById('btnOpenStock').addEventListener('click', openStock);
  document.getElementById('btnCloseStock').addEventListener('click', closeStock);
  document.querySelectorAll('#stockPanel .stock-tab').forEach(tab => {
    tab.addEventListener('click', () => switchStockTab(tab.dataset.tab));
  });

  // Audit panel
  document.getElementById('btnOpenAudit').addEventListener('click', openAuditPanel);
  document.getElementById('btnCloseAudit').addEventListener('click', closeAuditPanel);
  document.querySelectorAll('#auditPanel .audit-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuditTab(tab.dataset.tab));
  });

  // Chat
  document.getElementById('chatFab').addEventListener('click', openChat);
  document.getElementById('btnCloseChat').addEventListener('click', closeChat);
  document.getElementById('btnSendChat').addEventListener('click', sendChatMessage);
  initChatKeyboard();
  initNotifButton();

  // Config shortcuts
  document.getElementById('btnShortcutAgents').addEventListener('click', () => openConfigToSection('agents'));
  document.getElementById('btnShortcutVehicules').addEventListener('click', () => openConfigToSection('vehicules'));
  document.getElementById('btnShortcutCategories').addEventListener('click', () => openConfigToSection('categories'));
  document.getElementById('btnShortcutArmes').addEventListener('click', () => openConfigToSection('armes'));

  // Presence shortcut
  document.getElementById('btnPresenceShortcut').addEventListener('click', openPresenceSelector);

  // Armurier du jour
  document.getElementById('armurierDuJour').addEventListener('change', onMainArmurierChange);

  // Date change
  document.getElementById('dateJour').addEventListener('change', updateDayConfigLabel);

  // Info fields save on input (moved from init.js)
  ['entreprise', 'dateJour', 'refChantier', 'responsable', 'adresseChantier'].forEach(id => {
    document.getElementById(id).addEventListener('input', saveInfoFields);
  });
  document.getElementById('dateJour').addEventListener('change', updatePageNumberDisplay);
}

// =============================================
// Init Registre UI (called after mount)
// =============================================

function initRegistreUI() {
  // Callback bindings (reference registre-specific functions)
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

  bindCrewCallbacks({
    renderEmployees,
    updateCounts,
    afterSave: () => {
      updateCrewPromptStats();
    },
  });

  // Populate registre-specific UI
  populateMainArmurierSelect();
  updateShortcutCounts();
  updatePresenceShortcutSub();
  updateCrewPromptStats();
  updateDayConfigLabel();

  // Render employees and counts (data already loaded by init())
  renderEmployees();
  updateCounts();
  updateSoirTabState();
  updateVisaButtonState();

  // Auto-open presence selector if no one selected (moved from init.js)
  const { presentToday, team } = getState();
  if (presentToday.length === 0 && team.some(t => t.nom)) {
    setTimeout(() => openPresenceSelector(), 500);
  }
}

// =============================================
// Mount / Unmount
// =============================================

function mount(container) {
  container.innerHTML = getTemplate();
  bindEvents();
  initRegistreUI();

  // Auto-open overlay si on arrive d'une tuile outil
  if (_pendingOverlay && OVERLAY_MAP[_pendingOverlay]) {
    const openFn = OVERLAY_MAP[_pendingOverlay];
    _pendingOverlay = null;
    // Petit delai pour que le DOM soit pret
    setTimeout(() => openFn(), 50);
  }
}

function unmount() {
  // Les elements DOM sont detruits par le router (container.innerHTML = '')
  // Les event listeners sur ces elements sont automatiquement GC
}

// =============================================
// Export
// =============================================

export const registre = {
  mount,
  unmount,
  title: 'Registre',
};

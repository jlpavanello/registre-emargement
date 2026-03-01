// =============================================
// registre.js — Page Registre d'Emargement
// Signatures matin/soir, armes, visa, PDF
// =============================================

// --- Imports Router ---
import { navigate } from '../router.js';

// --- Imports Domains ---
import { getState } from '../state.js';
import { onVisaSignerChange, populateVisaSignerSelect } from '../domains/responsables.js';
import { bindPresenceCallbacks } from '../domains/presence.js';
import { bindCrewCallbacks } from '../domains/crew-assignment.js';
import { loadInfoFields, saveInfoFields } from '../domains/info-fields.js';
import { updatePageNumberDisplay } from '../domains/page-number.js';
import { todayStr } from '../utils/date.js';

// --- Imports UI ---
import { renderEmployees, switchPeriod, updateCounts, updateSoirTabState } from '../ui/renderer.js';
import { bindConfigCallbacks } from '../ui/config-panel.js';
import { openVisaSign, updateVisaButtonState } from '../ui/visa.js';
import { openSignModal } from '../ui/sign-modal.js';

// --- Imports Actions ---
import { resetSignatures } from '../actions/reset.js';

// --- Imports Auth ---
import { showRoleScreen } from '../auth/login-screen.js';
import { applyRoleGuards } from '../auth/auth-guard.js';

// =============================================
// Lazy-loaded modules (code-splitting)
// =============================================

async function generatePDF() {
  const { generatePDF: gen } = await import('../actions/pdf.js');
  return gen();
}


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
// Template HTML
// =============================================

function getTemplate() {
  return `
<header>
  <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
    <button class="header-btn" id="btnBackHome" title="Retour accueil" style="font-size:16px;padding:6px 10px;background:rgba(255,255,255,0.15);border-radius:8px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </button>
    <h1 style="margin:0;font-size:11px;line-height:1.3;">REGISTRE D'ATTRIBUTION<br>DES ARMES ET DES MUNITIONS</h1>
  </div>
  <div style="display:flex;align-items:center;gap:6px;">
    <button class="header-btn" id="btnChangeRole" title="Changer de profil" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
      Profil
    </button>
    <button class="header-btn" id="btnOpenConfig" title="Configuration" style="font-size:11px;padding:6px 10px;background:rgba(255,255,255,0.12);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
  </div>
</header>

<div class="section">
  <div class="pm-identity">
    <img src="/logo-police-municipale.png" alt="Police Municipale" class="pm-logo">
    <div class="pm-text">
      <div class="pm-title">Police Municipale de Monistrol-sur-Loire</div>
      <input type="hidden" id="entreprise" value="Monistrol-sur-Loire">
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
  <button class="btn-main" id="btnPDF">G\u00e9n\u00e9rer le Registre d'attribution en PDF</button>
</div>


<!-- CHAT D'EQUIPE (Widget flottant) -->
<button class="chat-fab" id="chatFab" title="Chat d'\u00e9quipe">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span class="chat-fab-badge" id="chatBadge" style="display:none;">0</span>
</button>


`;
}

// =============================================
// Event Bindings
// =============================================

function bindEvents() {
  // Header — Retour accueil
  document.getElementById('btnBackHome').addEventListener('click', () => navigate('/'));

  // Header — Config navigue vers la page dédiée
  document.getElementById('btnOpenConfig').addEventListener('click', () => navigate('/config'));
  document.getElementById('btnChangeRole').addEventListener('click', () => {
    if (confirm('Changer le profil de cet appareil ?')) showRoleScreen();
  });

  // Period tabs
  document.getElementById('tabMatin').addEventListener('click', () => switchPeriod('matin'));
  document.getElementById('tabSoir').addEventListener('click', () => switchPeriod('soir'));


  // Visa
  document.getElementById('visaSignerSelect').addEventListener('change', onVisaSignerChange);
  document.getElementById('visaMatinBtn').addEventListener('click', () => openVisaSign('visaMatin'));
  document.getElementById('visaSoirBtn').addEventListener('click', () => openVisaSign('visaSoir'));

  // Bottom bar
  document.getElementById('btnReset').addEventListener('click', resetSignatures);
  document.getElementById('btnPDF').addEventListener('click', generatePDF);

  // Equipages — navigue vers la page dédiée
  document.getElementById('btnCrewShortcut').addEventListener('click', () => navigate('/equipages'));

  // Chat — navigue vers la page dédiée
  document.getElementById('chatFab').addEventListener('click', () => navigate('/chat'));

  // Presence — navigue vers la page dédiée
  document.getElementById('btnPresenceShortcut').addEventListener('click', () => navigate('/presence'));

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

  // Set today's date (must happen BEFORE other calls that read dateJour)
  const dateEl = document.getElementById('dateJour');
  if (dateEl && !dateEl.value) dateEl.value = todayStr();

  // Load saved info fields (entreprise, responsable, etc.)
  loadInfoFields();

  // Populate selects
  populateMainArmurierSelect();
  populateVisaSignerSelect();

  // Update registre-specific displays
  updatePresenceShortcutSub();
  updateCrewPromptStats();
  updateDayConfigLabel();
  updatePageNumberDisplay();

  // Render employees and counts (data already loaded by init())
  renderEmployees();
  updateCounts();
  updateSoirTabState();
  updateVisaButtonState();

  // Apply role-based visibility guards
  applyRoleGuards();

  // Auto-navigate to presence page if no one selected
  const { presentToday, team } = getState();
  if (presentToday.length === 0 && team.some(t => t.nom)) {
    setTimeout(() => navigate('/presence'), 500);
  }
}

// =============================================
// Mount / Unmount
// =============================================

function mount(container) {
  container.innerHTML = getTemplate();
  bindEvents();
  initRegistreUI();
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

// =============================================
// vocal.js — Page Comptes-rendus de mission
// Dictée vocale + formulaire + liste rapports
// =============================================

import { navigate } from '../router.js';

// --- Lazy-loaded modules ---

let _vocalModule = null;
async function getVocalModule() {
  if (!_vocalModule) _vocalModule = await import('../ui/vocal-panel.js');
  return _vocalModule;
}

let _vocalPdfModule = null;
async function generateVocalPDF(report) {
  if (!_vocalPdfModule) _vocalPdfModule = await import('../actions/vocal-pdf.js');
  return _vocalPdfModule.generateVocalPDF(report);
}

// --- Template ---

function getTemplate() {
  return `
<div class="vocal-overlay active" id="vocalPanel">
  <div class="vocal-header">
    <h2>\uD83C\uDFA4 Compte-rendu de mission</h2>
    <button class="header-btn" id="btnCloseVocal" style="background:rgba(255,255,255,0.2);">Fermer</button>
  </div>
  <div class="vocal-form">
    <label>Lieu de la mission</label>
    <input type="text" id="vocalLieu" placeholder="Ex: 12 rue de la Paix, Place du marché...">
    <label>Objet de la mission</label>
    <input type="text" id="vocalObjet" placeholder="Ex: Contrôle routier, Patrouille...">
    <label>Famille de mission</label>
    <select id="vocalFamille">
      <option value="">— Choisir la famille —</option>
      <option value="Stationnement">Stationnement</option>
      <option value="Circulation">Circulation</option>
      <option value="Tranquillité publique">Tranquillité publique</option>
      <option value="Propreté urbaine">Propreté urbaine</option>
      <option value="Animaux">Animaux</option>
      <option value="Domaine public">Domaine public</option>
      <option value="Marchés / Commerce">Marchés / Commerce</option>
      <option value="Arrêtés Municipaux">Arrêtés Municipaux</option>
      <option value="Divers">Divers</option>
    </select>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;"><label>Heure de la mission</label><input type="time" id="vocalHeureMission"></div>
      <div style="flex:1;"><label>Durée</label><input type="text" id="vocalDuree" placeholder="Ex: 2h30, 45 min..."></div>
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
    Rapports enregistrés
  </div>
  <div id="vocalReportsList"></div>
  <div class="vocal-spacer"></div>
</div>
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseVocal').addEventListener('click', () => navigate('/'));
  document.getElementById('btnMic').addEventListener('click', async () => {
    (await getVocalModule()).startRecording();
  });
  document.getElementById('btnVocalClear').addEventListener('click', async () => {
    (await getVocalModule()).clearForm();
  });
  document.getElementById('btnVocalSave').addEventListener('click', async () => {
    (await getVocalModule()).saveCurrentReport();
  });
  document.getElementById('vocalContenu').addEventListener('input', async () => {
    (await getVocalModule()).updateSaveButton();
  });
}

// --- Page export ---

export const vocalPage = {
  title: 'Comptes-rendus',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    const mod = await getVocalModule();
    mod.bindVocalCallbacks({ generateVocalPDF });
    mod.openVocalPanel();
  },
  unmount() {},
};

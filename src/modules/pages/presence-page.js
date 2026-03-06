// =============================================
// presence-page.js — Page Sélection des Présents
// Cocher les agents de service du jour
// =============================================

import { navigate } from '../router.js';
import {
  openPresenceSelector, closePresenceSelector,
  selectAllPresence, selectNonePresence, savePresence,
} from '../domains/presence.js';

// --- Template ---

function getTemplate() {
  return `
<div class="presence-overlay" id="presencePanel">
  <div class="presence-header">
    <h2>Pr\u00e9sents du jour</h2>
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
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnPresenceAll').addEventListener('click', selectAllPresence);
  document.getElementById('btnPresenceNone').addEventListener('click', selectNonePresence);
  document.getElementById('btnPresenceSave').addEventListener('click', () => {
    savePresence();
    navigate('/registre');
  });
}

// --- Page export ---

export const presencePage = {
  title: 'Pr\u00e9sence',
  mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    openPresenceSelector();
  },
  unmount() {},
};

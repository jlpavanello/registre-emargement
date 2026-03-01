// =============================================
// chat.js — Page Chat d'équipe
// Messagerie temps réel entre agents
// =============================================

import { navigate } from '../router.js';

// --- Lazy-loaded module ---

let _chatModule = null;
async function getChatModule() {
  if (!_chatModule) _chatModule = await import('../ui/chat-widget.js');
  return _chatModule;
}

// --- Template ---

function getTemplate() {
  return `
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
`;
}

// --- Event bindings ---

function bindEvents() {
  document.getElementById('btnCloseChat').addEventListener('click', () => navigate('/'));
  document.getElementById('btnSendChat').addEventListener('click', async () => {
    (await getChatModule()).sendChatMessage();
  });
}

// --- Page export ---

export const chatPage = {
  title: 'Chat',
  async mount(container) {
    container.innerHTML = getTemplate();
    bindEvents();
    const mod = await getChatModule();
    mod.openChat();
    mod.initChatKeyboard();
    mod.initNotifButton();
  },
  unmount() {},
};

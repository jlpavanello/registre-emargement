// Chat d'équipe — Widget flottant + panneau déployable
import { getState } from '../state.js';
import {
  getChatIdentity, setChatIdentity, hasChatIdentity,
  getChatMessages, addMessage, clearOldMessages,
} from '../domains/chat-data.js';
import { getActiveTeam } from '../domains/team.js';

let _isOpen = false;
let _lastReadCount = 0;

// ── Public API ──────────────────────────────────────────────

export function openChat() {
  if (!hasChatIdentity()) {
    showIdentitySelector();
    return;
  }
  _isOpen = true;
  clearOldMessages();
  const panel = document.getElementById('chatPanel');
  panel.classList.add('active');
  renderMessages();
  _updateBadge(0);
  _lastReadCount = getChatMessages().length;

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }, 100);
}

export function closeChat() {
  _isOpen = false;
  document.getElementById('chatPanel').classList.remove('active');
}

export function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value;
  if (!text.trim()) return;
  addMessage(text);
  input.value = '';
  renderMessages();
  _lastReadCount = getChatMessages().length;
}

/**
 * Called when chat data is reloaded from sync
 * Updates badge if chat is closed, re-renders if open
 */
export function onChatDataUpdated() {
  const msgs = getChatMessages();
  if (_isOpen) {
    renderMessages();
    _lastReadCount = msgs.length;
  } else {
    const newCount = msgs.length - _lastReadCount;
    if (newCount > 0) _updateBadge(newCount);
  }
}

// ── Identity Selector ───────────────────────────────────────

function showIdentitySelector() {
  const team = getActiveTeam();
  if (team.length === 0) {
    alert("Aucun agent configuré. Configurez d'abord l'équipe dans les paramètres.");
    return;
  }

  const container = document.getElementById('chatMessages');
  const panel = document.getElementById('chatPanel');
  panel.classList.add('active');

  let html = '<div class="chat-identity-selector">';
  html += '<div class="chat-identity-title">Qui êtes-vous ?</div>';
  html += '<div class="chat-identity-subtitle">Choisissez votre nom pour le chat d\'équipe</div>';
  html += '<div class="chat-identity-list">';
  team.forEach(t => {
    html += `<button class="chat-identity-item" data-idx="${t.idx}">
      <span class="chat-identity-name">${t.nom}</span>
      ${t.matricule ? `<span class="chat-identity-matricule">${t.matricule}</span>` : ''}
    </button>`;
  });
  html += '</div></div>';

  container.innerHTML = html;

  // Hide input bar during selection
  const inputBar = panel.querySelector('.chat-input-bar');
  if (inputBar) inputBar.style.display = 'none';

  container.querySelectorAll('.chat-identity-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      setChatIdentity(idx);
      if (inputBar) inputBar.style.display = '';
      _isOpen = true;
      clearOldMessages();
      renderMessages();
      _lastReadCount = getChatMessages().length;
      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }, 100);
    });
  });
}

// ── Render ───────────────────────────────────────────────────

function renderMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const messages = getChatMessages();
  const identity = getChatIdentity();

  if (messages.length === 0) {
    container.innerHTML = `<div class="chat-empty">
      <div class="chat-empty-icon">💬</div>
      <div>Aucun message pour le moment.</div>
      <div class="chat-empty-hint">Envoyez le premier message à l'équipe !</div>
    </div>`;
    return;
  }

  let html = '';
  let lastDate = '';

  messages.forEach(msg => {
    // Date separator
    const msgDate = new Date(msg.timestamp);
    const dateStr = _formatDate(msgDate);
    if (dateStr !== lastDate) {
      html += `<div class="chat-date-sep">${dateStr}</div>`;
      lastDate = dateStr;
    }

    const isOwn = identity && msg.senderMatricule === identity.matricule
      && msg.senderName === identity.nom;
    const timeStr = msgDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    html += `<div class="chat-msg ${isOwn ? 'own' : 'other'}">`;
    if (!isOwn) {
      html += `<div class="chat-msg-sender">${_escapeHtml(msg.senderName)}</div>`;
    }
    html += `<div class="chat-bubble">${_escapeHtml(msg.text)}</div>`;
    html += `<div class="chat-msg-time">${timeStr}</div>`;
    html += `</div>`;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// ── Helpers ──────────────────────────────────────────────────

function _formatDate(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const d = date.toLocaleDateString('fr-FR');
  if (d === today.toLocaleDateString('fr-FR')) return "Aujourd'hui";
  if (d === yesterday.toLocaleDateString('fr-FR')) return 'Hier';
  return d;
}

function _updateBadge(count) {
  const badge = document.getElementById('chatBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function _escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Keyboard shortcut (Enter to send) ───────────────────────

export function initChatKeyboard() {
  document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

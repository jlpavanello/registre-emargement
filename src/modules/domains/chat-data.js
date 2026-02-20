// Domain module: Chat messages (team canal unique)
// Storage key: 'reg_chat_messages'
// Identity key (localStorage): 'reg_chat_identity'

import { getState, setState } from '../state.js';
import { storage } from '../storage/storage-interface.js';

const STORAGE_KEY = 'reg_chat_messages';
const IDENTITY_KEY = 'reg_chat_identity';

// ── Identity ────────────────────────────────────────────────

export function getChatIdentity() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setChatIdentity(empIdx) {
  const { team } = getState();
  const emp = team[empIdx];
  if (!emp || !emp.nom) return null;
  const identity = { empIdx, nom: emp.nom, matricule: emp.matricule || '' };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function hasChatIdentity() {
  return getChatIdentity() !== null;
}

// ── Messages CRUD ───────────────────────────────────────────

export function loadChatMessages() {
  const data = storage.get(STORAGE_KEY);
  if (data && Array.isArray(data)) {
    setState('chatMessages', data);
  }
}

export function saveChatMessages() {
  const { chatMessages } = getState();
  storage.set(STORAGE_KEY, chatMessages);
}

export function getChatMessages() {
  const { chatMessages } = getState();
  return (chatMessages || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function addMessage(text) {
  if (!text || !text.trim()) return null;
  const identity = getChatIdentity();
  if (!identity) return null;

  const { chatMessages } = getState();
  const msg = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    senderName: identity.nom,
    senderMatricule: identity.matricule,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  chatMessages.push(msg);
  setState('chatMessages', chatMessages);
  saveChatMessages();
  return msg;
}

export function clearOldMessages(days = 30) {
  const { chatMessages } = getState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = chatMessages.filter(m => new Date(m.timestamp) >= cutoff);
  if (filtered.length < chatMessages.length) {
    setState('chatMessages', filtered);
    saveChatMessages();
  }
}

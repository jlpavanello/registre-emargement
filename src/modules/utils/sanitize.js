// =============================================
// sanitize.js — Protection XSS
// Échappe les caractères HTML dangereux dans les chaînes utilisateur
// =============================================

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Échappe les caractères HTML spéciaux pour éviter les injections XSS.
 * @param {string} str — Chaîne potentiellement dangereuse
 * @returns {string} — Chaîne sécurisée pour insertion dans innerHTML
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

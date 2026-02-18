// Phase 4: Sync status UI indicator
// Shows a small badge in the header to indicate sync status

import { onSyncStatusChange } from './sync-engine.js';
import { isSupabaseEnabled } from './client.js';

let badgeEl = null;

/**
 * Initialize the sync status badge in the header
 */
export function initSyncStatusUI() {
  if (!isSupabaseEnabled()) return;

  // Create badge element
  badgeEl = document.createElement('div');
  badgeEl.id = 'syncBadge';
  badgeEl.style.cssText = `
    position: fixed;
    top: 8px;
    right: 60px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.3s ease;
    pointer-events: none;
    opacity: 0;
  `;
  document.body.appendChild(badgeEl);

  // Listen for status changes
  onSyncStatusChange((status, pending) => {
    updateBadge(status, pending);
  });
}

function updateBadge(status, pending) {
  if (!badgeEl) return;

  switch (status) {
    case 'syncing':
      badgeEl.style.background = '#dbeafe';
      badgeEl.style.color = '#1e40af';
      badgeEl.style.opacity = '1';
      badgeEl.innerHTML = '🔄 Sync...';
      break;

    case 'error':
      badgeEl.style.background = '#fee2e2';
      badgeEl.style.color = '#dc2626';
      badgeEl.style.opacity = '1';
      badgeEl.innerHTML = `⚠️ ${pending} en attente`;
      // Auto-hide after 5s
      setTimeout(() => {
        if (badgeEl) badgeEl.style.opacity = '0';
      }, 5000);
      break;

    case 'offline':
      badgeEl.style.background = '#f1f5f9';
      badgeEl.style.color = '#64748b';
      badgeEl.style.opacity = pending > 0 ? '1' : '0';
      badgeEl.innerHTML = `📴 ${pending} en file`;
      break;

    case 'idle':
    default:
      badgeEl.style.opacity = '0';
      break;
  }
}

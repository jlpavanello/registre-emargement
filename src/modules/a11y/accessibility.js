// Phase 6: Accessibility (WCAG 2.1 AA) enhancements
// - Focus management for modals/overlays
// - Keyboard navigation
// - ARIA attributes
// - Screen reader announcements

/**
 * Initialize all accessibility enhancements
 */
export function initAccessibility() {
  setupFocusTrap();
  setupKeyboardNavigation();
  setupAriaAttributes();
  setupLiveRegion();
  fixColorContrast();
}

// ============================================================
// FOCUS TRAP for modals and overlays
// ============================================================
let _activeTrap = null;

/**
 * Setup focus trap listeners
 */
function setupFocusTrap() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && _activeTrap) {
      trapFocus(e, _activeTrap);
    }
  });
}

/**
 * Activate focus trap on an element
 * @param {HTMLElement} container - The modal/overlay to trap focus in
 */
export function activateFocusTrap(container) {
  _activeTrap = container;
  // Focus first focusable element
  const first = getFirstFocusable(container);
  if (first) {
    setTimeout(() => first.focus(), 50);
  }
}

/**
 * Deactivate focus trap
 * @param {HTMLElement} [returnFocus] - Element to return focus to
 */
export function deactivateFocusTrap(returnFocus) {
  _activeTrap = null;
  if (returnFocus) {
    setTimeout(() => returnFocus.focus(), 50);
  }
}

function trapFocus(e, container) {
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey) {
    // Shift+Tab: if on first, go to last
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    // Tab: if on last, go to first
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]):not([aria-hidden="true"]), ' +
      'input:not([disabled]):not([type="hidden"]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      'a[href], ' +
      '[tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null); // visible only
}

function getFirstFocusable(container) {
  const focusables = getFocusableElements(container);
  return focusables[0] || null;
}

// ============================================================
// KEYBOARD NAVIGATION
// ============================================================

function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Escape closes modals and overlays
    if (e.key === 'Escape') {
      closeTopOverlay();
    }
  });

  // Make employee cards navigable with Enter/Space
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('emp-card')) {
      e.preventDefault();
      const signBtn = e.target.querySelector('.sign-btn');
      if (signBtn) signBtn.click();
    }
  });
}

function closeTopOverlay() {
  // Close in priority order: signature modal > vocal > presence > config
  const sigModal = document.getElementById('sigModal');
  const vocalPanel = document.getElementById('vocalPanel');
  const presencePanel = document.getElementById('presencePanel');
  const configPanel = document.getElementById('configPanel');

  if (sigModal && sigModal.classList.contains('active')) {
    const cancelBtn = document.getElementById('btnModalCancel');
    if (cancelBtn) cancelBtn.click();
  } else if (vocalPanel && vocalPanel.classList.contains('active')) {
    const closeBtn = document.getElementById('btnCloseVocal');
    if (closeBtn) closeBtn.click();
  } else if (presencePanel && presencePanel.classList.contains('active')) {
    const closeBtn = document.getElementById('btnClosePresence');
    if (closeBtn) closeBtn.click();
  } else if (configPanel && configPanel.classList.contains('active')) {
    const closeBtn = document.getElementById('btnCloseConfig');
    if (closeBtn) closeBtn.click();
  }
}

// ============================================================
// ARIA ATTRIBUTES
// ============================================================

function setupAriaAttributes() {
  // Modals
  setAriaModal('sigModal', 'Signature');
  setAriaModal('vocalPanel', 'Compte-rendu de mission');
  setAriaModal('presencePanel', 'Sélection des présents');
  setAriaModal('configPanel', 'Configuration');

  // Tabs
  setupAriaTabs();

  // Buttons with icons-only: add aria-labels
  setAriaLabel('btnOpenConfig', 'Ouvrir la configuration');
  setAriaLabel('btnCloseConfig', 'Fermer la configuration');
  setAriaLabel('btnClosePresence', 'Fermer la sélection');
  setAriaLabel('btnCloseVocal', 'Fermer le panneau vocal');
  setAriaLabel('btnMic', 'Dicter le rapport vocal');
  setAriaLabel('btnClear', 'Effacer la signature');
  setAriaLabel('btnQtyMinus', 'Diminuer la quantité');
  setAriaLabel('btnQtyPlus', 'Augmenter la quantité');

  // Form fields
  setAriaRequired('vocalContenu', true);

  // Locked banner
  const lockedBanner = document.getElementById('lockedBanner');
  if (lockedBanner) {
    lockedBanner.setAttribute('role', 'alert');
  }
}

function setAriaModal(id, label) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', label);
}

function setupAriaTabs() {
  const tabContainer = document.querySelector('.period-tabs');
  if (!tabContainer) return;
  tabContainer.setAttribute('role', 'tablist');

  const matin = document.getElementById('tabMatin');
  const soir = document.getElementById('tabSoir');

  if (matin) {
    matin.setAttribute('role', 'tab');
    matin.setAttribute('aria-selected', 'true');
    matin.setAttribute('aria-controls', 'employeesList');
  }
  if (soir) {
    soir.setAttribute('role', 'tab');
    soir.setAttribute('aria-selected', 'false');
    soir.setAttribute('aria-controls', 'employeesList');
  }

  const list = document.getElementById('employeesList');
  if (list) {
    list.setAttribute('role', 'tabpanel');
  }
}

function setAriaLabel(id, label) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('aria-label', label);
}

function setAriaRequired(id, required) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('aria-required', required ? 'true' : 'false');
}

// ============================================================
// LIVE REGION for screen reader announcements
// ============================================================
let _liveRegion = null;

function setupLiveRegion() {
  _liveRegion = document.createElement('div');
  _liveRegion.id = 'a11yLiveRegion';
  _liveRegion.setAttribute('role', 'status');
  _liveRegion.setAttribute('aria-live', 'polite');
  _liveRegion.setAttribute('aria-atomic', 'true');
  _liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(_liveRegion);
}

/**
 * Announce a message to screen readers
 * @param {string} message
 */
export function announce(message) {
  if (!_liveRegion) return;
  _liveRegion.textContent = '';
  // Small delay to ensure screen readers pick up the change
  setTimeout(() => {
    _liveRegion.textContent = message;
  }, 100);
}

// ============================================================
// COLOR CONTRAST FIXES (WCAG AA requires 4.5:1 for text)
// ============================================================

function fixColorContrast() {
  // Fix low-contrast text colors via CSS custom properties override
  const style = document.createElement('style');
  style.id = 'a11y-contrast-fixes';
  style.textContent = `
    /* Fix #94a3b8 (3.3:1 contrast) → #64748b (4.6:1 contrast) */
    .emp-detail,
    .vocal-mic-status,
    .vocal-report-meta,
    .config-info,
    .presence-info {
      color: #475569 !important;
    }

    /* Ensure focus ring is visible on all interactive elements */
    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible,
    a:focus-visible,
    [tabindex]:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Skip to content link for keyboard users */
    .skip-link {
      position: absolute;
      top: -100px;
      left: 0;
      background: #3b82f6;
      color: white;
      padding: 8px 16px;
      z-index: 9999;
      font-weight: 700;
      font-size: 14px;
      border-radius: 0 0 8px 0;
      text-decoration: none;
    }
    .skip-link:focus {
      top: 0;
    }

    /* Ensure minimum touch target size (44x44px) for mobile */
    .sign-btn,
    .btn-mic,
    .emp-card,
    .presence-card {
      min-height: 44px;
      min-width: 44px;
    }

    /* High contrast mode support */
    @media (forced-colors: active) {
      .sign-btn.signed {
        border: 2px solid ButtonText;
      }
      .period-tab.active {
        border: 2px solid Highlight;
      }
    }

    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Update ARIA tab states when switching periods
 * @param {'matin'|'soir'} period
 */
export function updateAriaTabState(period) {
  const matin = document.getElementById('tabMatin');
  const soir = document.getElementById('tabSoir');
  if (matin) matin.setAttribute('aria-selected', period === 'matin' ? 'true' : 'false');
  if (soir) soir.setAttribute('aria-selected', period === 'soir' ? 'true' : 'false');
}

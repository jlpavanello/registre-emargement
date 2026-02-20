// PV (Procès-Verbaux) — Main panel controller
import { renderTemplatesTab } from './pv-templates-tab.js';
import { renderMesPvTab } from './pv-mes-pv-tab.js';
import { renderEditorTab } from './pv-editor-tab.js';

let _currentTab = 'templates';
let _currentDocId = null;

export function openPV() {
  document.getElementById('pvPanel').classList.add('active');
  _currentTab = 'templates';
  _currentDocId = null;
  renderPvTabs();
  renderCurrentTab();
}

export function closePV() {
  document.getElementById('pvPanel').classList.remove('active');
}

export function switchPvTab(tab, docId) {
  _currentTab = tab;
  if (docId !== undefined) _currentDocId = docId;
  renderPvTabs();
  renderCurrentTab();
}

export function openEditor(docId) {
  _currentDocId = docId;
  _currentTab = 'editor';
  renderPvTabs();
  renderCurrentTab();
}

export function getCurrentDocId() {
  return _currentDocId;
}

function renderPvTabs() {
  const tabs = document.querySelectorAll('#pvPanel .pv-tab');
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === _currentTab);
  });
  const editorTab = document.querySelector('#pvPanel .pv-tab[data-tab="editor"]');
  if (editorTab) {
    editorTab.style.display = _currentDocId ? '' : 'none';
  }
}

function renderCurrentTab() {
  const container = document.getElementById('pvTabContent');
  if (!container) return;

  switch (_currentTab) {
    case 'templates':
      renderTemplatesTab(container);
      break;
    case 'mespv':
      renderMesPvTab(container);
      break;
    case 'editor':
      if (_currentDocId) renderEditorTab(container, _currentDocId);
      break;
  }
}

export function refreshPvPanel() {
  if (document.getElementById('pvPanel')?.classList.contains('active')) {
    renderCurrentTab();
  }
}

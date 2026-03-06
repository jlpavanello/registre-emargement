// UI Controller: Planning Panel — open/close/switch tabs
import { renderMonthTab } from './planning-month-tab.js';
import { renderWeekTab } from './planning-week-tab.js';
import { renderCyclesTab } from './planning-cycles-tab.js';
import { renderLeavesTab } from './planning-leaves-tab.js';
import { renderCountersTab } from './planning-counters-tab.js';
import { renderConfigTab } from './planning-config-tab.js';

let _currentTab = 'month';

export function openPlanning() {
  document.getElementById('planningPanel').classList.add('active');
  _currentTab = 'month';
  renderTabs();
  renderCurrentTab();
}

export function closePlanning() {
  document.getElementById('planningPanel').classList.remove('active');
}

export function switchPlanningTab(tab) {
  _currentTab = tab;
  renderTabs();
  renderCurrentTab();
}

function renderTabs() {
  document.querySelectorAll('#planningPanel .planning-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === _currentTab);
  });
}

function renderCurrentTab() {
  const container = document.getElementById('planningTabContent');
  if (!container) return;

  switch (_currentTab) {
    case 'month':
      renderMonthTab(container);
      break;
    case 'week':
      renderWeekTab(container);
      break;
    case 'cycles':
      renderCyclesTab(container);
      break;
    case 'leaves':
      renderLeavesTab(container);
      break;
    case 'counters':
      renderCountersTab(container);
      break;
    case 'config':
      renderConfigTab(container);
      break;
    default:
      container.innerHTML = '<div class="planning-empty"><div class="planning-empty-icon">🚧</div>Onglet en construction</div>';
  }
}

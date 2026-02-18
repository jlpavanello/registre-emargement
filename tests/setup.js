// Vitest global setup
// jsdom environment is configured in vitest.config.js
import { vi } from 'vitest';

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] || null),
  setItem: vi.fn((key, value) => { store[key] = String(value); }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Clean state between tests
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();

  // Minimal DOM structure for modules that access DOM
  document.body.innerHTML = `
    <header><h1>REGISTRE</h1></header>
    <input type="date" id="dateJour" value="2025-01-15">
    <input type="text" id="entreprise" value="">
    <input type="text" id="refChantier" value="">
    <input type="text" id="responsable" value="">
    <input type="text" id="adresseChantier" value="">
    <span id="pageNumberText"></span>
    <div id="employeesList"></div>
    <div id="presenceBadgeArea" style="display:none;"><div id="presenceBadge"></div></div>
    <span id="countMatin">0/0</span>
    <span id="countSoir">0/0</span>
    <button id="tabMatin" class="period-tab active"></button>
    <button id="tabSoir" class="period-tab"></button>
    <select id="visaSignerSelect"><option value="">—</option></select>
    <div id="visaMatinBtn">Signer</div>
    <div id="visaSoirBtn">Signer</div>
    <div id="visaMatinSignedBy" style="display:none;"></div>
    <div id="visaSoirSignedBy" style="display:none;"></div>
    <div id="lockedBanner" style="display:none;"><span id="lockedText"></span></div>
    <div class="presence-overlay" id="presencePanel"><div id="presenceList"></div></div>
    <span id="presenceCount">0</span>
    <button id="btnPresenceSave"></button>
    <div class="config-overlay" id="configPanel"></div>
    <div id="configEmpList"></div>
    <div id="configMachList"></div>
    <div id="configCatList"></div>
    <input id="configChefUnite" value="">
    <input id="configChefMat" value="">
    <select id="configArmurierSelect"><option value="">—</option></select>
    <div id="configArmurierInfo"></div>
    <div class="modal-overlay" id="sigModal"><canvas id="sigCanvas" width="300" height="150"></canvas></div>
    <div class="vocal-overlay" id="vocalPanel"></div>
    <textarea id="vocalContenu"></textarea>
    <button id="btnVocalSave" disabled></button>
    <div id="vocalReportsList"></div>
    <div id="vocalMicStatus">Appuyez pour dicter</div>
    <div id="vocalInterim"></div>
    <button id="btnMic"></button>
    <input id="vocalLieu" value="">
    <input id="vocalObjet" value="">
    <div id="pageNumberBadge"></div>
    <select id="catSelect"><option value="">—</option></select>
    <div id="machSelectSub" style="display:none;"><select id="machineSelect"><option value="">—</option></select></div>
    <div id="machSelectArea" style="display:none;"></div>
    <div id="machineListArea" style="display:none;"></div>
    <div id="machineListContent"></div>
    <div id="soirReturnArea" style="display:none;"></div>
    <div id="sigCanvasArea"><canvas id="sigCanvas" width="300" height="150"></canvas></div>
    <div id="stepIndicator" style="display:none;">
      <div id="step1dot"></div><div id="step1line"></div>
      <div id="step2dot"></div><div id="step2line"></div>
      <div id="step3dot"></div>
    </div>
    <h3 id="modalTitle"></h3>
    <p id="modalSubtitle"></p>
    <button id="btnAddMachine" disabled></button>
    <input id="qtyValue" value="0" type="number">
  `;
});

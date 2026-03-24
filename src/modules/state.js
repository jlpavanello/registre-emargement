// Centralized state store with pub/sub for reactivity
// Replaces all global variables from the original monolithic app

const state = {
  currentPeriod: 'matin',
  currentSignTarget: null,
  visaMatin: null,
  visaSoir: null,
  accQty: 0,
  selectedMachines: [], // [{machineIdx, acc}]
  team: [],
  machines: [],
  dayData: [],
  categories: [
    { id: 'portatif', nom: 'Outil portatif', emoji: '\u{1F527}' },
    { id: 'atelier', nom: "Machine d'atelier", emoji: '\u{2699}\u{FE0F}' },
    { id: 'transport', nom: 'Machine de transport', emoji: '\u{1F69B}' },
  ],
  responsables: {
    chef: { nom: '', matricule: '' },
    armurier: { nom: '', matricule: '' },
  },
  visaMatinSigner: null,
  visaSoirSigner: null,
  lockedMatinPresents: [],
  lockedSoirPresents: [],
  presentToday: [],
  tempPresenceSelection: [],
  // Vehicles / Crews
  vehicles: [],
  crewAssignments: {},       // {vehicleIdx: [empIdx, ...]}
  crewDrivers: {},           // {vehicleIdx: empIdx} — conducteur du jour
  tempCrewAssignments: {},   // Temp copy during selection
  tempCrewDrivers: {},       // Temp copy during selection
  pageNumber: 1,
  // Vocal reports
  vocalReports: [],
  // Stock & Logistique
  munitionRefs: [],
  stockArmes: {},
  stockMouvements: [],
  previsionsTir: [],
  fournisseurs: [],
  commandes: [],
  // PV (Procès-Verbaux)
  pvTemplates: [],
  pvDocuments: [],
  // Chat d'équipe
  chatMessages: [],
  // Piste d'audit
  auditLog: [],
  // Incidents
  incidents: [],
  // Planning
  planningEntries: {},
  planningShifts: [],
  planningCycles: [],
  planningLeaves: [],
  // Canvas state
  isDrawing: false,
  sigCtx: null,
  sigCanvas: null,
  currentStep: 1,
};

const listeners = new Map();

// --- Batching mechanism ---
let _batchDepth = 0;
const _pendingKeys = new Set();

/**
 * Begin a batch: listeners won't fire until endBatch().
 */
export function beginBatch() {
  _batchDepth++;
}

/**
 * End a batch: fire all pending listeners once.
 */
export function endBatch() {
  _batchDepth--;
  if (_batchDepth <= 0) {
    _batchDepth = 0;
    const keys = [..._pendingKeys];
    _pendingKeys.clear();
    for (const key of keys) {
      if (listeners.has(key)) {
        listeners.get(key).forEach((fn) => fn(state[key]));
      }
    }
  }
}

export function getState() {
  return state;
}

/**
 * Fast shallow comparison for dedup
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  // Objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function setState(key, value) {
  // Skip if value hasn't changed (dedup)
  const prev = state[key];
  if (prev === value) return;
  if (typeof value === 'object' && value !== null && shallowEqual(prev, value)) return;

  state[key] = value;

  if (_batchDepth > 0) {
    _pendingKeys.add(key);
  } else {
    if (listeners.has(key)) {
      listeners.get(key).forEach((fn) => fn(value));
    }
  }
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

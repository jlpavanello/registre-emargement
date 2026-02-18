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
  pageNumber: 1,
  // Vocal reports
  vocalReports: [],
  // Canvas state
  isDrawing: false,
  sigCtx: null,
  sigCanvas: null,
  currentStep: 1,
};

const listeners = new Map();

export function getState() {
  return state;
}

export function setState(key, value) {
  state[key] = value;
  if (listeners.has(key)) {
    listeners.get(key).forEach((fn) => fn(value));
  }
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

// Vitest global setup
// jsdom environment is configured in vitest.config.js

// Mock localStorage
const store = {};
const mockLocalStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage });

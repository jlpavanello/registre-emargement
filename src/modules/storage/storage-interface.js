import { LocalStorageAdapter } from './local-storage.js';

// Phase 1: uses localStorage. Phase 2 will swap to IndexedDB.
export const storage = new LocalStorageAdapter();

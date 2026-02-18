// Unit tests for visa module
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { isMatinLocked, isSoirLocked, hasUncoveredSignatures } from '../../src/modules/ui/visa.js';

describe('Visa Module', () => {
  beforeEach(() => {
    setState('visaMatin', null);
    setState('visaSoir', null);
    setState('team', []);
    setState('presentToday', []);
    setState('dayData', []);
    setState('lockedMatinPresents', []);
    setState('lockedSoirPresents', []);
  });

  it('isMatinLocked should be false when no visa', () => {
    expect(isMatinLocked()).toBe(false);
  });

  it('isMatinLocked should be true when visa signed', () => {
    setState('visaMatin', 'data:image/png;base64,abc');
    expect(isMatinLocked()).toBe(true);
  });

  it('isSoirLocked should be false when no visa', () => {
    expect(isSoirLocked()).toBe(false);
  });

  it('isSoirLocked should be true when visa signed', () => {
    setState('visaSoir', 'data:image/png;base64,def');
    expect(isSoirLocked()).toBe(true);
  });

  it('hasUncoveredSignatures should return false when not locked', () => {
    expect(hasUncoveredSignatures('matin')).toBe(false);
    expect(hasUncoveredSignatures('soir')).toBe(false);
  });

  it('hasUncoveredSignatures should detect new signatures after lock', () => {
    // Lock matin
    setState('visaMatin', 'sig');
    setState('lockedMatinPresents', [0]); // Employee 0 was locked
    setState('presentToday', [0, 1]);
    setState('team', [
      { nom: 'A', matricule: '' },
      { nom: 'B', matricule: '' },
    ]);
    setState('dayData', [
      { matin: { signature: 'sig_a', heure: '08:00', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
      { matin: { signature: 'sig_b', heure: '08:30', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
    ]);

    // Employee 1 is present, has signed, but was NOT in lockedMatinPresents
    expect(hasUncoveredSignatures('matin')).toBe(true);
  });

  it('hasUncoveredSignatures should return false when all covered', () => {
    setState('visaMatin', 'sig');
    setState('lockedMatinPresents', [0, 1]);
    setState('presentToday', [0, 1]);
    setState('team', [
      { nom: 'A', matricule: '' },
      { nom: 'B', matricule: '' },
    ]);
    setState('dayData', [
      { matin: { signature: 'sig_a', heure: '08:00', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
      { matin: { signature: 'sig_b', heure: '08:30', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
    ]);

    expect(hasUncoveredSignatures('matin')).toBe(false);
  });
});

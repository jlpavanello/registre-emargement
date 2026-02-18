// Unit tests for machines domain module
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadMachines, saveMachines, getActiveMachines, getMachineName, getMachinesInUse } from '../../src/modules/domains/machines.js';

describe('Machines Domain', () => {
  beforeEach(() => {
    setState('machines', []);
    setState('dayData', []);
    setState('categories', [
      { id: 'portatif', nom: 'Outil portatif', emoji: '🔧' },
    ]);
  });

  it('should save and load machines', () => {
    const machines = [
      { nom: 'Perceuse', ref: 'P001', cat: 'portatif' },
      { nom: 'Camion', ref: 'C001', cat: 'transport' },
    ];
    setState('machines', machines);
    saveMachines();

    setState('machines', []);
    loadMachines();

    const loaded = getState().machines;
    expect(loaded).toHaveLength(2);
    expect(loaded[0].nom).toBe('Perceuse');
    expect(loaded[0].cat).toBe('portatif');
  });

  it('loadMachines should add cat field if missing', () => {
    localStorage.setItem('reg_machines', JSON.stringify([
      { nom: 'Old Machine', ref: 'O1' },
    ]));
    loadMachines();
    const loaded = getState().machines;
    expect(loaded[0].cat).toBe('');
  });

  it('getActiveMachines should filter out empty entries', () => {
    setState('machines', [
      { nom: 'Perceuse', ref: 'P001', cat: 'portatif' },
      { nom: '', ref: '', cat: '' },
      { nom: 'Camion', ref: 'C001', cat: 'transport' },
    ]);

    const active = getActiveMachines();
    expect(active).toHaveLength(2);
    expect(active[0].idx).toBe(0);
    expect(active[1].idx).toBe(2);
  });

  it('getMachineName should return name with ref', () => {
    setState('machines', [
      { nom: 'Perceuse', ref: 'P001', cat: 'portatif' },
    ]);
    expect(getMachineName(0)).toBe('Perceuse (P001)');
  });

  it('getMachineName should return name without ref', () => {
    setState('machines', [
      { nom: 'Perceuse', ref: '', cat: 'portatif' },
    ]);
    expect(getMachineName(0)).toBe('Perceuse');
  });

  it('getMachineName should return empty for null/undefined index', () => {
    expect(getMachineName(null)).toBe('');
    expect(getMachineName(undefined)).toBe('');
  });

  it('getMachinesInUse should track machines in use', () => {
    setState('dayData', [
      {
        matin: { signature: 'data:image/png;base64,abc', heure: '08:00', machines: [{ machineIdx: 0, acc: 1 }] },
        soir: { signature: null, heure: null, returns: {} },
      },
      {
        matin: { signature: null, heure: null, machines: [] },
        soir: { signature: null, heure: null, returns: {} },
      },
    ]);

    const inUse = getMachinesInUse();
    expect(inUse[0]).toBe(0); // Machine 0 used by employee 0
    expect(inUse[1]).toBeUndefined(); // Machine 1 not in use
  });
});

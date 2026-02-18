// Unit tests for day-data domain module
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadDayData, syncDayData, saveDayData } from '../../src/modules/domains/day-data.js';

// Mock todayStr to return a fixed date
vi.mock('../../src/modules/utils/date.js', () => ({
  todayStr: () => '2025-01-15',
  nowTime: () => '09:00',
}));

describe('Day Data Domain', () => {
  beforeEach(() => {
    setState('dayData', []);
    setState('visaMatin', null);
    setState('visaSoir', null);
    setState('visaMatinSigner', null);
    setState('visaSoirSigner', null);
    setState('presentToday', []);
    setState('lockedMatinPresents', []);
    setState('lockedSoirPresents', []);
    setState('team', []);
  });

  it('should load day data for today', () => {
    const dayData = [
      { matin: { signature: 'sig1', heure: '08:00', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
    ];
    localStorage.setItem('reg_day', JSON.stringify({
      date: '2025-01-15',
      data: dayData,
      visaMatin: null,
      visaSoir: null,
      presentToday: [0],
    }));

    loadDayData();

    expect(getState().dayData).toHaveLength(1);
    expect(getState().dayData[0].matin.signature).toBe('sig1');
    expect(getState().presentToday).toEqual([0]);
  });

  it('should reset day data if date is different', () => {
    localStorage.setItem('reg_day', JSON.stringify({
      date: '2025-01-14', // Yesterday
      data: [{ matin: { signature: 'old' } }],
    }));

    loadDayData();

    expect(getState().dayData).toEqual([]);
    expect(getState().visaMatin).toBeNull();
    expect(getState().presentToday).toEqual([]);
  });

  it('should handle empty storage', () => {
    loadDayData();

    expect(getState().dayData).toEqual([]);
    expect(getState().visaMatin).toBeNull();
  });

  it('syncDayData should extend dayData to match team size', () => {
    setState('team', [
      { nom: 'A', matricule: '', telephone: '', asvp: false },
      { nom: 'B', matricule: '', telephone: '', asvp: false },
      { nom: 'C', matricule: '', telephone: '', asvp: false },
    ]);
    setState('dayData', []);

    syncDayData();

    const { dayData } = getState();
    expect(dayData).toHaveLength(3);
    expect(dayData[0]).toHaveProperty('matin');
    expect(dayData[0]).toHaveProperty('soir');
    expect(dayData[0].matin.machines).toEqual([]);
    expect(dayData[0].soir.returns).toEqual({});
  });

  it('saveDayData should persist all relevant state', () => {
    setState('dayData', [
      { matin: { signature: 'test', heure: '08:00', machines: [] }, soir: { signature: null, heure: null, returns: {} } },
    ]);
    setState('visaMatin', 'visa_sig');
    setState('presentToday', [0]);

    saveDayData();

    const saved = JSON.parse(localStorage.getItem('reg_day'));
    expect(saved.date).toBe('2025-01-15');
    expect(saved.data[0].matin.signature).toBe('test');
    expect(saved.visaMatin).toBe('visa_sig');
    expect(saved.presentToday).toEqual([0]);
  });

  it('syncDayData should migrate old format (machine → machines)', () => {
    setState('team', [{ nom: 'A', matricule: '', telephone: '', asvp: false }]);
    setState('dayData', [
      {
        matin: { signature: 'sig', heure: '08:00', machine: 2, acc: 3 },
        soir: { signature: null, heure: null, accRetour: 1 },
      },
    ]);

    syncDayData();

    const { dayData } = getState();
    expect(dayData[0].matin.machines).toEqual([{ machineIdx: 2, acc: 3 }]);
    expect(dayData[0].matin.machine).toBeUndefined();
    expect(dayData[0].soir.returns).toBeDefined();
  });
});

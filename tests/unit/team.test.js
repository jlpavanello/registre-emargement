// Unit tests for team domain module
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadTeam, saveTeam, getActiveTeam, getPresentTeam } from '../../src/modules/domains/team.js';

describe('Team Domain', () => {
  beforeEach(() => {
    // Reset team state
    setState('team', []);
    setState('presentToday', []);
  });

  it('should save and load team from storage', () => {
    const team = [
      { nom: 'Dupont', matricule: '001', telephone: '', asvp: false },
      { nom: 'Martin', matricule: '002', telephone: '', asvp: true },
    ];
    setState('team', team);
    saveTeam();

    // Reset and reload
    setState('team', []);
    loadTeam();

    const loaded = getState().team;
    expect(loaded).toHaveLength(2);
    expect(loaded[0].nom).toBe('Dupont');
    expect(loaded[1].matricule).toBe('002');
  });

  it('getActiveTeam should filter out empty entries', () => {
    setState('team', [
      { nom: 'Dupont', matricule: '001', telephone: '', asvp: false },
      { nom: '', matricule: '', telephone: '', asvp: false },
      { nom: 'Martin', matricule: '002', telephone: '', asvp: false },
    ]);

    const active = getActiveTeam();
    expect(active).toHaveLength(2);
    expect(active[0].nom).toBe('Dupont');
    expect(active[0].idx).toBe(0);
    expect(active[1].nom).toBe('Martin');
    expect(active[1].idx).toBe(2);
  });

  it('getPresentTeam should filter by presentToday', () => {
    setState('team', [
      { nom: 'Dupont', matricule: '001', telephone: '', asvp: false },
      { nom: 'Martin', matricule: '002', telephone: '', asvp: false },
      { nom: 'Durand', matricule: '003', telephone: '', asvp: false },
    ]);
    setState('presentToday', [0, 2]); // Dupont and Durand present

    const present = getPresentTeam();
    expect(present).toHaveLength(2);
    expect(present[0].nom).toBe('Dupont');
    expect(present[1].nom).toBe('Durand');
  });

  it('getPresentTeam should return empty if no one present', () => {
    setState('team', [
      { nom: 'Dupont', matricule: '001', telephone: '', asvp: false },
    ]);
    setState('presentToday', []);

    expect(getPresentTeam()).toHaveLength(0);
  });

  it('loadTeam should not crash with empty storage', () => {
    expect(() => loadTeam()).not.toThrow();
    expect(getState().team).toEqual([]);
  });
});

// Unit tests for the centralized state store
import { describe, it, expect, vi } from 'vitest';
import { getState, setState, subscribe } from '../../src/modules/state.js';

describe('State Store', () => {
  it('should return initial state', () => {
    const state = getState();
    expect(state).toBeDefined();
    expect(state.currentPeriod).toBe('matin');
    expect(state.team).toBeInstanceOf(Array);
    expect(state.dayData).toBeInstanceOf(Array);
    expect(state.vocalReports).toBeInstanceOf(Array);
  });

  it('should update state with setState', () => {
    setState('currentPeriod', 'soir');
    expect(getState().currentPeriod).toBe('soir');
    // Reset
    setState('currentPeriod', 'matin');
  });

  it('should notify subscribers on state change', () => {
    const callback = vi.fn();
    const unsubscribe = subscribe('currentPeriod', callback);

    setState('currentPeriod', 'soir');
    expect(callback).toHaveBeenCalledWith('soir');
    expect(callback).toHaveBeenCalledTimes(1);

    // Cleanup
    unsubscribe();
    setState('currentPeriod', 'matin');
  });

  it('should allow unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = subscribe('currentPeriod', callback);

    unsubscribe();
    setState('currentPeriod', 'soir');
    expect(callback).not.toHaveBeenCalled();

    // Reset
    setState('currentPeriod', 'matin');
  });

  it('should handle multiple subscribers', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = subscribe('team', cb1);
    const unsub2 = subscribe('team', cb2);

    const newTeam = [{ nom: 'Test', matricule: '001' }];
    setState('team', newTeam);

    expect(cb1).toHaveBeenCalledWith(newTeam);
    expect(cb2).toHaveBeenCalledWith(newTeam);

    unsub1();
    unsub2();
    setState('team', []);
  });

  it('should have default categories', () => {
    const { categories } = getState();
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories[0]).toHaveProperty('id');
    expect(categories[0]).toHaveProperty('nom');
    expect(categories[0]).toHaveProperty('emoji');
  });

  it('should have default responsables structure', () => {
    const { responsables } = getState();
    expect(responsables).toHaveProperty('chef');
    expect(responsables).toHaveProperty('armurier');
    expect(responsables.chef).toHaveProperty('nom');
    expect(responsables.chef).toHaveProperty('matricule');
  });
});

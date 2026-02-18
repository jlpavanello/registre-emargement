// Unit tests for responsables domain module
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadResponsables, saveResponsables, populateVisaSignerSelect, getSignerInfo } from '../../src/modules/domains/responsables.js';

describe('Responsables Domain', () => {
  beforeEach(() => {
    setState('responsables', {
      chef: { nom: '', matricule: '' },
      armurier: { nom: '', matricule: '' },
    });
  });

  it('should save and load responsables', () => {
    setState('responsables', {
      chef: { nom: 'Chef Dupont', matricule: 'CD01' },
      armurier: { nom: 'Armurier Martin', matricule: 'AM01' },
    });
    saveResponsables();

    setState('responsables', { chef: { nom: '', matricule: '' }, armurier: { nom: '', matricule: '' } });
    loadResponsables();

    const { responsables } = getState();
    expect(responsables.chef.nom).toBe('Chef Dupont');
    expect(responsables.armurier.nom).toBe('Armurier Martin');
  });

  it('populateVisaSignerSelect should populate options', () => {
    setState('responsables', {
      chef: { nom: 'Chef X', matricule: '01' },
      armurier: { nom: 'Armurier Y', matricule: '02' },
    });

    populateVisaSignerSelect();

    const sel = document.getElementById('visaSignerSelect');
    expect(sel.options.length).toBe(3); // default + chef + armurier
    expect(sel.options[1].value).toBe('chef');
    expect(sel.options[2].value).toBe('armurier');
  });

  it('populateVisaSignerSelect should show message when no responsables', () => {
    populateVisaSignerSelect();

    const sel = document.getElementById('visaSignerSelect');
    // Should have default + disabled message
    expect(sel.options.length).toBe(2);
    expect(sel.options[1].disabled).toBe(true);
  });

  it('getSignerInfo should return null when none selected', () => {
    expect(getSignerInfo()).toBeNull();
  });

  it('getSignerInfo should return info when chef selected', () => {
    setState('responsables', {
      chef: { nom: 'Chef X', matricule: '01' },
      armurier: { nom: '', matricule: '' },
    });
    populateVisaSignerSelect();

    const sel = document.getElementById('visaSignerSelect');
    sel.value = 'chef';

    const info = getSignerInfo();
    expect(info).not.toBeNull();
    expect(info.role).toBe('chef');
    expect(info.nom).toBe('Chef X');
    expect(info.label).toBe("Chef d'unité");
  });

  it('loadResponsables should handle empty storage', () => {
    loadResponsables();
    const { responsables } = getState();
    expect(responsables.chef.nom).toBe('');
  });
});

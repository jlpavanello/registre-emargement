// Integration tests for the storage layer
// Tests the full flow: storage-interface → LocalStorageAdapter
import { describe, it, expect, beforeEach } from 'vitest';

// We import directly from local-storage since IndexedDB isn't available in jsdom
import { LocalStorageAdapter } from '../../src/modules/storage/local-storage.js';

describe('Storage Integration', () => {
  let storage;

  beforeEach(() => {
    storage = new LocalStorageAdapter();
  });

  it('should persist team data end-to-end', () => {
    const team = [
      { nom: 'Agent Dupont', matricule: '001', telephone: '0600000001', asvp: false },
      { nom: 'Agent Martin', matricule: '002', telephone: '', asvp: true },
    ];

    storage.set('reg_team', team);
    const loaded = storage.get('reg_team');

    expect(loaded).toEqual(team);
    expect(loaded[1].asvp).toBe(true);
  });

  it('should persist day data with signatures', () => {
    const dayData = {
      date: '2025-01-15',
      data: [
        {
          matin: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANS',
            heure: '08:15',
            machines: [{ machineIdx: 0, acc: 2 }],
          },
          soir: { signature: null, heure: null, returns: {} },
        },
      ],
      visaMatin: 'data:image/png;base64,visa_matin_data',
      visaSoir: null,
      presentToday: [0],
    };

    storage.set('reg_day', dayData);
    const loaded = storage.get('reg_day');

    expect(loaded.date).toBe('2025-01-15');
    expect(loaded.data[0].matin.signature).toContain('base64');
    expect(loaded.visaMatin).toContain('base64');
  });

  it('should persist vocal reports', () => {
    const vocalData = {
      reports: [
        {
          id: 'vr_1234',
          date: '2025-01-15',
          heure: '14:30',
          lieu: 'Centre-ville',
          objet: 'Contrôle routier',
          contenu: 'Contrôle effectué sans incident. 15 véhicules contrôlés.',
          agent: 'Agent Dupont',
          matricule: '001',
        },
      ],
    };

    storage.set('reg_vocal', vocalData);
    const loaded = storage.get('reg_vocal');

    expect(loaded.reports).toHaveLength(1);
    expect(loaded.reports[0].contenu).toContain('15 véhicules');
  });

  it('should persist categories with emoji', () => {
    const cats = [
      { id: 'arme', nom: 'Arme de service', emoji: '🔫' },
      { id: 'radio', nom: 'Radio/Communication', emoji: '📻' },
    ];

    storage.set('reg_categories', cats);
    const loaded = storage.get('reg_categories');

    expect(loaded[0].emoji).toBe('🔫');
    expect(loaded[1].nom).toBe('Radio/Communication');
  });

  it('should handle large data (multiple signatures)', () => {
    // Simulate storing multiple base64 signatures
    const bigSig = 'data:image/png;base64,' + 'A'.repeat(50000);
    const dayData = {
      date: '2025-01-15',
      data: Array.from({ length: 20 }, () => ({
        matin: { signature: bigSig, heure: '08:00', machines: [] },
        soir: { signature: bigSig, heure: '17:00', returns: {} },
      })),
    };

    storage.set('reg_day', dayData);
    const loaded = storage.get('reg_day');

    expect(loaded.data).toHaveLength(20);
    expect(loaded.data[0].matin.signature.length).toBeGreaterThan(50000);
  });

  it('should handle config export/import flow', () => {
    // Simulate saving all config data
    storage.set('reg_team', [{ nom: 'Agent A', matricule: '001' }]);
    storage.set('reg_machines', [{ nom: 'Radio', ref: 'R1', cat: 'radio' }]);
    storage.set('reg_categories', [{ id: 'radio', nom: 'Radio', emoji: '📻' }]);
    storage.set('reg_resp', { chef: { nom: 'Chef', matricule: 'C1' }, armurier: { nom: '', matricule: '' } });

    // Simulate export
    const exportData = {
      team: storage.get('reg_team'),
      machines: storage.get('reg_machines'),
      categories: storage.get('reg_categories'),
      responsables: storage.get('reg_resp'),
    };

    // Clear and reimport
    storage.remove('reg_team');
    storage.remove('reg_machines');
    storage.remove('reg_categories');
    storage.remove('reg_resp');

    expect(storage.get('reg_team')).toBeNull();

    // Import
    storage.set('reg_team', exportData.team);
    storage.set('reg_machines', exportData.machines);
    storage.set('reg_categories', exportData.categories);
    storage.set('reg_resp', exportData.responsables);

    expect(storage.get('reg_team')[0].nom).toBe('Agent A');
    expect(storage.get('reg_resp').chef.nom).toBe('Chef');
  });
});

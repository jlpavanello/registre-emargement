// Unit tests for vocal-data domain module
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadVocalReports, saveVocalReports, addReport, deleteReport, getReportsForToday, getAllReports } from '../../src/modules/domains/vocal-data.js';

// Mock date functions
vi.mock('../../src/modules/utils/date.js', () => ({
  todayStr: () => '2025-01-15',
  nowTime: () => '14:30',
}));

describe('Vocal Data Domain', () => {
  beforeEach(() => {
    setState('vocalReports', []);
    setState('responsables', {
      chef: { nom: 'Chef Dupont', matricule: 'CD01' },
      armurier: { nom: '', matricule: '' },
    });
    setState('team', []);
  });

  it('should add a report', () => {
    const report = addReport({
      lieu: 'Place du Marché',
      objet: 'Patrouille',
      contenu: 'RAS dans le secteur.',
    });

    expect(report).toBeDefined();
    expect(report.id).toMatch(/^vr_/);
    expect(report.date).toBe('2025-01-15');
    expect(report.heure).toBe('14:30');
    expect(report.lieu).toBe('Place du Marché');
    expect(report.contenu).toBe('RAS dans le secteur.');
    expect(report.agent).toBe('Chef Dupont');
    expect(report.matricule).toBe('CD01');
  });

  it('should persist reports in state', () => {
    addReport({ lieu: '', objet: 'Test', contenu: 'Content' });
    expect(getState().vocalReports).toHaveLength(1);
  });

  it('should get all reports', () => {
    addReport({ lieu: '', objet: '', contenu: 'Report 1' });
    addReport({ lieu: '', objet: '', contenu: 'Report 2' });

    const all = getAllReports();
    expect(all).toHaveLength(2);
  });

  it('should get reports for today', () => {
    addReport({ lieu: '', objet: '', contenu: 'Today report' });

    // Manually add an old report
    const { vocalReports } = getState();
    vocalReports.push({
      id: 'vr_old',
      date: '2025-01-14',
      heure: '10:00',
      lieu: '',
      objet: '',
      contenu: 'Yesterday',
      agent: '',
      matricule: '',
    });
    setState('vocalReports', vocalReports);

    const todayReports = getReportsForToday();
    expect(todayReports).toHaveLength(1);
    expect(todayReports[0].contenu).toBe('Today report');
  });

  it('should delete a report', () => {
    const report = addReport({ lieu: '', objet: '', contenu: 'To delete' });
    expect(getAllReports()).toHaveLength(1);

    deleteReport(report.id);
    expect(getAllReports()).toHaveLength(0);
  });

  it('should save and load reports from storage', () => {
    addReport({ lieu: 'Test', objet: 'Test', contenu: 'Test content' });
    saveVocalReports();

    // Reset and reload
    setState('vocalReports', []);
    loadVocalReports();

    const loaded = getState().vocalReports;
    expect(loaded).toHaveLength(1);
    expect(loaded[0].contenu).toBe('Test content');
  });

  it('loadVocalReports should handle empty storage', () => {
    loadVocalReports();
    expect(getState().vocalReports).toEqual([]);
  });

  it('should handle report with empty fields', () => {
    const report = addReport({ lieu: '', objet: '', contenu: 'Just content' });
    expect(report.lieu).toBe('');
    expect(report.objet).toBe('');
    expect(report.contenu).toBe('Just content');
  });
});

// Unit tests for categories domain module
import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState } from '../../src/modules/state.js';
import { loadCategories, saveCategories, getCatById, getCatLabel, getCatEmoji } from '../../src/modules/domains/categories.js';

describe('Categories Domain', () => {
  const defaultCats = [
    { id: 'portatif', nom: 'Outil portatif', emoji: '🔧' },
    { id: 'atelier', nom: "Machine d'atelier", emoji: '⚙️' },
    { id: 'transport', nom: 'Machine de transport', emoji: '🚛' },
  ];

  beforeEach(() => {
    setState('categories', [...defaultCats]);
  });

  it('should save and load categories', () => {
    saveCategories();
    setState('categories', []);
    loadCategories();

    const cats = getState().categories;
    expect(cats).toHaveLength(3);
    expect(cats[0].id).toBe('portatif');
  });

  it('getCatById should return correct category', () => {
    const cat = getCatById('atelier');
    expect(cat).not.toBeNull();
    expect(cat.nom).toBe("Machine d'atelier");
  });

  it('getCatById should return null for unknown id', () => {
    expect(getCatById('unknown')).toBeNull();
  });

  it('getCatLabel should return category name', () => {
    expect(getCatLabel('portatif')).toBe('Outil portatif');
  });

  it('getCatLabel should return empty string for unknown id', () => {
    expect(getCatLabel('unknown')).toBe('');
  });

  it('getCatEmoji should return category emoji', () => {
    expect(getCatEmoji('transport')).toBe('🚛');
  });

  it('getCatEmoji should return empty string for unknown id', () => {
    expect(getCatEmoji('unknown')).toBe('');
  });
});

import { describe, it, expect } from 'vitest';
import { paginationDemandee, lirePagination, enveloppe } from '../utils/pagination';

/**
 * Pagination opt-in : garantit la rétrocompatibilité (aucun paramètre → pas de
 * pagination) et des bornes sûres (pas de limit démesurée / page négative).
 */
describe('paginationDemandee', () => {
  it('faux sans page ni limit (comportement historique préservé)', () => {
    expect(paginationDemandee({})).toBe(false);
  });
  it('vrai dès que page ou limit est présent', () => {
    expect(paginationDemandee({ page: '2' })).toBe(true);
    expect(paginationDemandee({ limit: '10' })).toBe(true);
  });
});

describe('lirePagination', () => {
  it('applique les valeurs par défaut sûres', () => {
    expect(lirePagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
  });
  it('calcule correctement l’offset', () => {
    expect(lirePagination({ page: '3', limit: '15' })).toEqual({ page: 3, limit: 15, offset: 30 });
  });
  it('borne la limite à 100 et corrige les entrées invalides', () => {
    expect(lirePagination({ limit: '9999' }).limit).toBe(100);
    expect(lirePagination({ page: '-5' }).page).toBe(1);
    expect(lirePagination({ page: 'abc' }).page).toBe(1);
  });
});

describe('enveloppe', () => {
  it('calcule totalPages (arrondi supérieur, minimum 1)', () => {
    expect(enveloppe([], 0, 1, 20).totalPages).toBe(1);
    expect(enveloppe([], 41, 1, 20).totalPages).toBe(3);
    expect(enveloppe([], 40, 1, 20).totalPages).toBe(2);
  });
});

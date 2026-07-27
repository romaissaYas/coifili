import { describe, it, expect } from 'vitest';
import { getValidationErrors, isSafeImageRef, isValidCalendarDate } from '../validation/engine';
import { prestationSchema, productSchema, salonSchema } from '../validation/schemas';

/**
 * Moteur de validation : première ligne de défense des routes d'écriture.
 * On vérifie qu'il accepte les données légitimes et rejette les cas dangereux.
 */
describe('getValidationErrors — prestationSchema', () => {
  it('accepte une prestation valide', () => {
    const err = getValidationErrors({ nom: 'Coupe', prix: 35, duree: 45 }, prestationSchema);
    expect(err).toEqual({});
  });
  it('rejette une durée hors bornes (5–480)', () => {
    expect(getValidationErrors({ nom: 'X', prix: 10, duree: 2 }, prestationSchema)).toHaveProperty('duree');
    expect(getValidationErrors({ nom: 'X', prix: 10, duree: 999 }, prestationSchema)).toHaveProperty('duree');
  });
  it('rejette un champ requis manquant', () => {
    expect(getValidationErrors({ prix: 10, duree: 30 }, prestationSchema)).toHaveProperty('nom');
  });
  it('rejette un prix négatif', () => {
    expect(getValidationErrors({ nom: 'X', prix: -1, duree: 30 }, prestationSchema)).toHaveProperty('prix');
  });
});

describe('getValidationErrors — productSchema', () => {
  it('accepte un produit boutique valide', () => {
    const err = getValidationErrors(
      { nom: 'Shampooing', categorie: 'cheveux', prix: 19.9, stock: 25, images: ['/img/bg1.jpg'] },
      productSchema
    );
    expect(err).toEqual({});
  });
  it('rejette une catégorie hors enum', () => {
    expect(
      getValidationErrors({ nom: 'X', categorie: 'shampooing', prix: 10 }, productSchema)
    ).toHaveProperty('categorie');
  });
  it('rejette une image avec un schéma dangereux', () => {
    expect(
      getValidationErrors({ nom: 'X', categorie: 'cheveux', prix: 10, images: ['javascript:alert(1)'] }, productSchema)
    ).toHaveProperty('images');
  });
});

describe('isSafeImageRef', () => {
  it('accepte http(s) et chemins relatifs', () => {
    expect(isSafeImageRef('https://ex.com/a.jpg')).toBe(true);
    expect(isSafeImageRef('/img/bg1.jpg')).toBe(true);
  });
  it('rejette les schémas dangereux', () => {
    expect(isSafeImageRef('javascript:alert(1)')).toBe(false);
    expect(isSafeImageRef('data:text/html,<script>')).toBe(false);
  });
});

describe('isValidCalendarDate', () => {
  it('accepte une date calendaire réelle', () => {
    expect(isValidCalendarDate('2026-07-27')).toBe(true);
  });
  it('rejette une date impossible', () => {
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
    expect(isValidCalendarDate('2026-13-01')).toBe(false);
  });
});

describe('salonSchema', () => {
  it('rejette un type hors enum et un email invalide', () => {
    const err = getValidationErrors(
      { nom: 'S', email: 'pasunemail', telephone: '0600000000', wilaya: 'Alger', ville: 'Alger', type: 'autre', categorie: 'coiffure' },
      salonSchema
    );
    expect(err).toHaveProperty('email');
    expect(err).toHaveProperty('type');
  });
});

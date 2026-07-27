import { describe, it, expect } from 'vitest';
import {
  dateToJourSemaine,
  addMinutesToTime,
  timeRangeOverflowsDay,
  normalizeTime,
  isValidCreneau,
} from '../utils/dateTime';

/**
 * Logique de date/créneau : cœur du moteur de réservation. Une erreur ici
 * décale les rendez-vous ou fausse la détection de chevauchement.
 */
describe('dateToJourSemaine', () => {
  it('mappe une date ISO sur le bon jour français (lundi)', () => {
    expect(dateToJourSemaine('2026-07-27')).toBe('Lundi'); // 27/07/2026 = lundi
  });
  it('gère le dimanche (index 6, pas 0)', () => {
    expect(dateToJourSemaine('2026-07-26')).toBe('Dimanche');
  });
});

describe('addMinutesToTime', () => {
  it('additionne sans dépassement d’heure', () => {
    expect(addMinutesToTime('09:00', 45)).toBe('09:45');
  });
  it('gère le passage à l’heure suivante', () => {
    expect(addMinutesToTime('09:30', 45)).toBe('10:15');
  });
  it('accepte une entrée HH:MM:SS', () => {
    expect(addMinutesToTime('23:30:00', 45)).toBe('24:15');
  });
});

describe('timeRangeOverflowsDay', () => {
  it('faux quand le créneau reste dans la journée', () => {
    expect(timeRangeOverflowsDay('22:00', 90)).toBe(false); // 23:30
  });
  it('vrai quand le créneau atteint/dépasse minuit', () => {
    expect(timeRangeOverflowsDay('23:30', 45)).toBe(true); // 24:15
    expect(timeRangeOverflowsDay('23:00', 60)).toBe(true); // exactement 24:00
  });
});

describe('normalizeTime', () => {
  it('complète HH:MM en HH:MM:SS', () => {
    expect(normalizeTime('09:05')).toBe('09:05:00');
  });
  it('laisse HH:MM:SS inchangé', () => {
    expect(normalizeTime('09:05:30')).toBe('09:05:30');
  });
});

describe('isValidCreneau', () => {
  it('accepte un créneau bien formé et ordonné', () => {
    expect(isValidCreneau({ debut: '09:00', fin: '10:00' })).toBe(true);
  });
  it('refuse debut >= fin', () => {
    expect(isValidCreneau({ debut: '10:00', fin: '10:00' })).toBe(false);
    expect(isValidCreneau({ debut: '11:00', fin: '10:00' })).toBe(false);
  });
  it('refuse une entrée non conforme', () => {
    expect(isValidCreneau(null)).toBe(false);
    expect(isValidCreneau({ debut: '9h', fin: '10h' })).toBe(false);
  });
});

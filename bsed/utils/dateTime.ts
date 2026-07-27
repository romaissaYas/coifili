import { TIME_PATTERN } from '../validation/engine';

export const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

/**
 * Convertit une date (AAAA-MM-JJ) en nom de jour français, dans le même
 * référentiel que JOURS_SEMAINE et la colonne horaires.jour.
 */
export function dateToJourSemaine(date: string): (typeof JOURS_SEMAINE)[number] {
  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = dimanche
  const isoIndex = jsDay === 0 ? 6 : jsDay - 1; // 0 = lundi ... 6 = dimanche
  return JOURS_SEMAINE[isoIndex];
}

/** Ajoute une durée en minutes à une heure "HH:MM" ou "HH:MM:SS". */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/** true si le créneau [debut, fin) dépasse minuit (total >= 24h). */
export function timeRangeOverflowsDay(debut: string, minutes: number): boolean {
  const [h, m] = debut.split(':').map(Number);
  return h * 60 + m + minutes >= 24 * 60;
}

/**
 * Normalise une heure "HH:MM" ou "HH:MM:SS" vers "HH:MM:SS", pour comparer de
 * façon fiable en JS des heures saisies (HH:MM) avec des valeurs TIME
 * renvoyées par MySQL (HH:MM:SS) — une comparaison de chaînes de longueurs
 * différentes donnerait un résultat lexicographique incorrect.
 */
export function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export function isValidCreneau(value: unknown): value is { debut: string; fin: string } {
  if (typeof value !== 'object' || value === null) return false;
  const { debut, fin } = value as Record<string, unknown>;
  return (
    typeof debut === 'string' && typeof fin === 'string' &&
    TIME_PATTERN.test(debut) && TIME_PATTERN.test(fin) &&
    debut < fin
  );
}

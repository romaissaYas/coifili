import type { Pool, PoolConnection } from 'mysql2/promise';
import { pool } from '../db/pool';
import { ServiceError } from './ServiceError';
import { dateToJourSemaine, addMinutesToTime, timeRangeOverflowsDay, normalizeTime } from './dateTime';

/**
 * Exécuteur SQL : le pool global (comportement par défaut, inchangé) OU une
 * connexion transactionnelle. Permet de faire tourner le contrôle de
 * disponibilité DANS la même transaction+verrou que l'insertion, ce qui
 * élimine la fenêtre de course (double réservation).
 */
export type SqlExecutor = Pool | PoolConnection;

export type DisponibiliteError = { status: number; error: string };

export type PrestationInfo = {
  id: number;
  salon_id: number;
  prix: string | number;
  duree: number;
};

/**
 * Charge une prestation et vérifie qu'elle appartient bien au salon concerné.
 * Retourne null si elle n'existe pas ou appartient à un autre salon (on ne
 * distingue pas les deux cas côté appelant pour ne pas révéler l'existence
 * de prestations d'un autre salon).
 */
export async function chargerPrestationDuSalon(salonId: number, prestationId: number, executor: SqlExecutor = pool): Promise<PrestationInfo | null> {
  const [rows]: any = await executor.execute(
    'SELECT id, salon_id, prix, duree FROM prestations WHERE id = ?',
    [prestationId]
  );
  const prestation = rows[0];
  if (!prestation || prestation.salon_id !== salonId) return null;
  return prestation;
}

/**
 * Vérifie toutes les règles de disponibilité avant d'enregistrer ou de
 * déplacer un rendez-vous :
 * - la prestation a une durée cohérente et ne dépasse pas minuit,
 * - la date/heure n'est pas dans le passé,
 * - l'employé (s'il est précisé) appartient bien au salon,
 * - le salon est ouvert ce jour-là et le créneau demandé est bien dans une
 *   plage horaire ouverte,
 * - aucun autre rendez-vous actif ne chevauche ce créneau (pour le même
 *   salon, et pour le même employé si un employé est précisé).
 *
 * Retourne null si tout est valide, sinon { status, error } prêt à être
 * renvoyé tel quel par la route appelante.
 */
export async function verifierDisponibilite(params: {
  salonId: number;
  prestation: PrestationInfo;
  employeId?: number | null;
  date: string;
  heureDebut: string;
  excludeRendezvousId?: number;
  executor?: SqlExecutor;
}): Promise<DisponibiliteError | null> {
  const { salonId, prestation, employeId, date, heureDebut, excludeRendezvousId } = params;
  const executor = params.executor ?? pool;

  if (!prestation.duree || prestation.duree <= 0) {
    return { status: 400, error: "Cette prestation n'a pas de durée valide configurée." };
  }

  if (timeRangeOverflowsDay(heureDebut, prestation.duree)) {
    return { status: 400, error: 'La durée de la prestation dépasse la fin de la journée pour cet horaire de départ.' };
  }

  const heureFin = addMinutesToTime(heureDebut, prestation.duree);
  const heureDebutN = normalizeTime(heureDebut);
  const heureFinN = normalizeTime(heureFin);

  const debutDateTime = new Date(`${date}T${heureDebutN}`);
  if (Number.isNaN(debutDateTime.getTime()) || debutDateTime.getTime() <= Date.now()) {
    return { status: 400, error: 'Impossible de réserver un rendez-vous dans le passé.' };
  }

  if (employeId) {
    const [empRows]: any = await executor.execute(
      'SELECT id FROM employes WHERE id = ? AND salon_id = ?',
      [employeId, salonId]
    );
    if (!empRows[0]) {
      return { status: 400, error: "L'employé indiqué n'appartient pas à ce salon." };
    }
  }

  const jour = dateToJourSemaine(date);
  const [horaireRows]: any = await executor.execute(
    'SELECT id, ouvert FROM horaires WHERE salon_id = ? AND jour = ?',
    [salonId, jour]
  );
  const horaire = horaireRows[0];
  if (!horaire || !horaire.ouvert) {
    return { status: 400, error: `Le salon est fermé le ${jour.toLowerCase()}.` };
  }

  const [creneauxRows]: any = await executor.query(
    'SELECT heure_debut, heure_fin FROM creneaux WHERE horaire_id = ?',
    [horaire.id]
  );
  const creneauValide = creneauxRows.some(
    (c: any) => c.heure_debut <= heureDebutN && c.heure_fin >= heureFinN
  );
  if (!creneauValide) {
    return { status: 400, error: "Ce créneau horaire n'est pas disponible pour ce salon." };
  }

  const conflictConditions = ['salon_id = ?', 'date = ?', "statut != 'annule'", 'heure_debut < ?', 'heure_fin > ?'];
  const conflictParams: (string | number)[] = [salonId, date, heureFinN, heureDebutN];
  if (employeId) {
    conflictConditions.push('employe_id = ?');
    conflictParams.push(employeId);
  } else {
    conflictConditions.push('employe_id IS NULL');
  }
  if (excludeRendezvousId) {
    conflictConditions.push('id != ?');
    conflictParams.push(excludeRendezvousId);
  }
  const [conflicts]: any = await executor.execute(
    `SELECT id FROM rendezvous WHERE ${conflictConditions.join(' AND ')} LIMIT 1`,
    conflictParams
  );
  if (conflicts.length > 0) {
    return { status: 409, error: 'Ce créneau est déjà réservé.' };
  }

  return null;
}

/**
 * Sérialise les réservations concurrentes sur la même ressource (salon +
 * employé + jour) puis exécute `fn` DANS une transaction, en tenant le verrou
 * consultatif MySQL (GET_LOCK) sur TOUTE la durée de la transaction —
 * acquisition AVANT `BEGIN`, libération APRÈS `COMMIT`.
 *
 * Cet ordre est essentiel : la 2ᵉ requête n'acquiert le verrou (et n'ouvre donc
 * sa transaction, ne prend son snapshot) qu'APRÈS le COMMIT de la 1ʳᵉ ; son
 * contrôle de disponibilité voit alors le rendez-vous déjà inséré et renvoie
 * 409. Plus aucune double réservation possible, même en concurrence parfaite.
 */
export async function reserverAvecVerrou<T>(
  salonId: number,
  employeId: number | null,
  date: string,
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const cle = `cf:rdv:${salonId}:${employeId ?? 0}:${date}`;
  const conn = await pool.getConnection();
  try {
    const [rows]: any = await conn.query('SELECT GET_LOCK(?, 10) AS ok', [cle]);
    if (!rows[0] || Number(rows[0].ok) !== 1) {
      throw new ServiceError(409, 'Réservation en cours sur ce créneau, veuillez réessayer.');
    }
    try {
      await conn.beginTransaction();
      const res = await fn(conn);
      await conn.commit();
      return res;
    } catch (error) {
      await conn.rollback().catch(() => undefined);
      throw error;
    } finally {
      await conn.query('SELECT RELEASE_LOCK(?)', [cle]).catch(() => undefined);
    }
  } finally {
    conn.release();
  }
}

function minutesEntre(debut: string, fin: string): number {
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calcule la liste des heures de début disponibles (format "HH:MM") pour une
 * prestation donnée, un salon, une date et éventuellement un employé.
 *
 * La logique reproduit exactement celle de verifierDisponibilite pour qu'un
 * créneau affiché comme disponible aboutisse toujours lors du POST :
 * - le salon doit être ouvert ce jour-là ;
 * - le créneau [début, début+durée] doit tenir dans une plage horaire ouverte ;
 * - il ne doit pas être dans le passé ;
 * - il ne doit chevaucher aucun rendez-vous actif (ceux de l'employé choisi
 *   si un employé est précisé, sinon ceux sans employé assigné).
 *
 * Les créneaux sont générés par pas de `pasMinutes` (15 min par défaut) à
 * l'intérieur de chaque plage ouverte.
 */
export async function calculerCreneauxDisponibles(params: {
  salonId: number;
  prestation: PrestationInfo;
  date: string;
  employeId?: number | null;
  pasMinutes?: number;
}): Promise<string[]> {
  const { salonId, prestation, date, employeId, pasMinutes = 15 } = params;
  const duree = prestation.duree;
  if (!duree || duree <= 0) return [];

  const jour = dateToJourSemaine(date);
  const [horaireRows]: any = await pool.execute(
    'SELECT id, ouvert FROM horaires WHERE salon_id = ? AND jour = ?',
    [salonId, jour]
  );
  const horaire = horaireRows[0];
  if (!horaire || !horaire.ouvert) return [];

  const [creneauxRows]: any = await pool.query(
    'SELECT heure_debut, heure_fin FROM creneaux WHERE horaire_id = ? ORDER BY heure_debut',
    [horaire.id]
  );
  if (creneauxRows.length === 0) return [];

  // Réservations bloquantes, en cohérence avec verifierDisponibilite :
  // avec employé → celles de cet employé ; sans employé → celles sans employé.
  const reservationsSql = employeId
    ? "SELECT heure_debut, heure_fin FROM rendezvous WHERE salon_id = ? AND date = ? AND statut != 'annule' AND employe_id = ?"
    : "SELECT heure_debut, heure_fin FROM rendezvous WHERE salon_id = ? AND date = ? AND statut != 'annule' AND employe_id IS NULL";
  const reservationsParams = employeId ? [salonId, date, employeId] : [salonId, date];
  const [reservations]: any = await pool.execute(reservationsSql, reservationsParams);

  const now = Date.now();
  const slots: string[] = [];

  for (const creneau of creneauxRows) {
    const debutMin = timeToMinutes(creneau.heure_debut);
    const finMin = timeToMinutes(creneau.heure_fin);

    for (let start = debutMin; start + duree <= finMin; start += pasMinutes) {
      const end = start + duree;
      const slotDebut = minutesToTime(start);

      // Pas dans le passé (heure locale, comme verifierDisponibilite).
      const startDateTime = new Date(`${date}T${slotDebut}:00`);
      if (Number.isNaN(startDateTime.getTime()) || startDateTime.getTime() <= now) continue;

      const chevauche = reservations.some((r: any) => {
        const rDebut = timeToMinutes(r.heure_debut);
        const rFin = timeToMinutes(r.heure_fin);
        return start < rFin && end > rDebut;
      });
      if (chevauche) continue;

      slots.push(slotDebut);
    }
  }

  return slots;
}

/**
 * Cherche le premier créneau libre d'un employé, en balayant les prochains
 * jours (fenêtre de 14 jours par défaut) selon les horaires d'ouverture du
 * salon et les rendez-vous déjà pris par cet employé.
 *
 * Simplification volontaire : la recherche se fait par pas de
 * `dureeMinutes` (30 min par défaut) à l'intérieur de chaque créneau ouvert,
 * plutôt qu'une optimisation fine par prestation — suffisant pour afficher
 * une "prochaine disponibilité" indicative sur la fiche employé.
 */
export async function trouverProchaineDisponibilite(
  salonId: number,
  employeId: number,
  dureeMinutes: number = 30,
  fenetreJours: number = 14
): Promise<{ date: string; heure: string } | null> {
  const maintenant = new Date();

  for (let i = 0; i <= fenetreJours; i++) {
    const d = new Date();
    d.setUTCDate(maintenant.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    const jour = dateToJourSemaine(date);
    const heureActuelle = i === 0
      ? `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}:00`
      : '00:00:00';

    const [horaireRows]: any = await pool.execute(
      'SELECT id, ouvert FROM horaires WHERE salon_id = ? AND jour = ?',
      [salonId, jour]
    );
    const horaire = horaireRows[0];
    if (!horaire || !horaire.ouvert) continue;

    const [creneauxRows]: any = await pool.query(
      'SELECT heure_debut, heure_fin FROM creneaux WHERE horaire_id = ? ORDER BY heure_debut',
      [horaire.id]
    );
    if (creneauxRows.length === 0) continue;

    const [reservationsRows]: any = await pool.execute(
      `SELECT heure_debut, heure_fin FROM rendezvous
       WHERE employe_id = ? AND date = ? AND statut != 'annule'
       ORDER BY heure_debut`,
      [employeId, date]
    );

    for (const creneau of creneauxRows) {
      const finCreneau: string = creneau.heure_fin;
      let curseur: string = creneau.heure_debut > heureActuelle ? creneau.heure_debut : heureActuelle;

      for (const rdv of reservationsRows) {
        if (rdv.heure_fin <= curseur) continue;
        if (rdv.heure_debut >= finCreneau) break;

        if (minutesEntre(curseur, rdv.heure_debut) >= dureeMinutes) {
          return { date, heure: curseur.slice(0, 5) };
        }
        if (rdv.heure_fin > curseur) {
          curseur = rdv.heure_fin;
        }
      }

      if (minutesEntre(curseur, finCreneau) >= dureeMinutes) {
        return { date, heure: curseur.slice(0, 5) };
      }
    }
  }

  return null;
}

export { addMinutesToTime };

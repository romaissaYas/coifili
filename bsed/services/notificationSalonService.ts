import { pool } from '../db/pool';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Notifications in-app de l'Espace Coiffure.
 *
 * Additif et isolé : ne modifie aucune fonctionnalité existante. La création
 * d'une notification est appelée en « fire-and-forget » après l'enregistrement
 * d'un rendez-vous (comme les emails), de sorte qu'un échec ici n'impacte
 * JAMAIS le flux de réservation.
 */

type NotificationReservationInput = {
  salonId: number;
  rendezvousId: number;
  reference: string | null;
  clientNom: string;
  prestationId: number;
  date: string;
  heureDebut: string;
};

/**
 * Crée une notification « nouvelle réservation » pour le salon concerné.
 * `INSERT IGNORE` + clé unique (rendezvous_id, type) => aucun doublon possible,
 * même si la fonction est rappelée pour le même rendez-vous.
 */
export async function creerNotificationReservation(input: NotificationReservationInput): Promise<void> {
  // Nom du service réservé (best-effort : ne bloque pas si introuvable).
  let prestationNom: string | null = null;
  try {
    const [rows]: any = await pool.query('SELECT nom FROM prestations WHERE id = ?', [input.prestationId]);
    prestationNom = rows[0]?.nom ?? null;
  } catch {
    /* non bloquant */
  }

  await pool.execute(
    `INSERT IGNORE INTO notifications
       (salon_id, type, rendezvous_id, reference, client_nom, prestation_nom, date_rdv, heure_rdv)
     VALUES (?, 'nouvelle_reservation', ?, ?, ?, ?, ?, ?)`,
    [input.salonId, input.rendezvousId, input.reference, input.clientNom || null, prestationNom, input.date, input.heureDebut]
  );
}

/**
 * Crée une notification GÉNÉRIQUE pour un salon (titre/message/lien) — ex.
 * « paiement validé ». Réutilise la table `notifications` (colonnes génériques)
 * et la même cloche que les réservations. Fire-and-forget côté appelant.
 */
export async function creerNotificationSalon(input: {
  salonId: number;
  type: string;
  titre: string;
  message: string;
  lien?: string | null;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO notifications (salon_id, type, titre, message, lien)
     VALUES (?, ?, ?, ?, ?)`,
    [input.salonId, input.type, input.titre, input.message, input.lien ?? null]
  );
}

/** Liste les notifications d'un salon, de la plus récente à la plus ancienne. */
export async function listerNotifications(salonId: number, limit = 50) {
  const lim = Math.min(Math.max(1, limit | 0), 200); // borne sûre, valeur serveur -> inlining sans risque
  const [rows] = await pool.query(
    `SELECT id, type, rendezvous_id, reference, client_nom, prestation_nom, date_rdv, heure_rdv,
            titre, message, lien, lu, created_at
     FROM notifications
     WHERE salon_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ${lim}`,
    [salonId]
  );
  return rows;
}

/** Nombre de notifications non lues d'un salon (pour le badge). */
export async function compterNonLues(salonId: number): Promise<number> {
  const [rows]: any = await pool.query('SELECT COUNT(*) AS n FROM notifications WHERE salon_id = ? AND lu = 0', [salonId]);
  return Number(rows[0].n);
}

/** Marque UNE notification comme lue (uniquement si elle appartient au salon). */
export async function marquerLue(salonId: number, id: number): Promise<void> {
  await pool.execute('UPDATE notifications SET lu = 1 WHERE id = ? AND salon_id = ?', [id, salonId]);
}

/** Marque toutes les notifications du salon comme lues. */
export async function marquerToutesLues(salonId: number): Promise<void> {
  await pool.execute('UPDATE notifications SET lu = 1 WHERE salon_id = ? AND lu = 0', [salonId]);
}

/** Supprime UNE notification (uniquement si elle appartient au salon). */
export async function supprimerNotification(salonId: number, id: number): Promise<void> {
  await pool.execute('DELETE FROM notifications WHERE id = ? AND salon_id = ?', [id, salonId]);
}

/** Ordre de tri sûr (whitelist) pour le centre de notifications. */
function ordreTri(tri?: string): string {
  return tri === 'ancien' ? 'created_at ASC, id ASC' : 'created_at DESC, id DESC';
}

/**
 * Centre de notifications du salon : liste paginée + filtres (type, statut
 * lu/non-lu, recherche) + tri. Additif : n'affecte ni la cloche ni le compteur.
 */
export async function listerNotificationsPage(
  salonId: number,
  filtres: { type?: string; statut?: string; q?: string; tri?: string; page?: number; limit?: number }
): Promise<Paginated<any>> {
  const conditions: string[] = ['salon_id = ?'];
  const values: any[] = [salonId];

  if (filtres.type) {
    conditions.push('type = ?');
    values.push(filtres.type);
  }
  if (filtres.statut === 'lu' || filtres.statut === 'non_lu') {
    conditions.push('lu = ?');
    values.push(filtres.statut === 'lu' ? 1 : 0);
  }
  if (filtres.q) {
    conditions.push('(client_nom LIKE ? OR prestation_nom LIKE ? OR titre LIKE ? OR message LIKE ? OR reference LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like, like, like);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const orderBy = ordreTri(filtres.tri);
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM notifications ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT id, type, rendezvous_id, reference, client_nom, prestation_nom, date_rdv, heure_rdv,
            titre, message, lien, lu, created_at
     FROM notifications ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows, Number(total), page, limit);
}

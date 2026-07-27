import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { STATUTS_RENDEZVOUS } from '../validation';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Consultation et gestion transverses des réservations par le Super Admin
 * (toutes salons confondus). SQL paramétré ; audit dans le contrôleur.
 */

const RESA_SELECT = `
  r.id, r.date, r.heure_debut, r.heure_fin, r.duree, r.prix, r.statut, r.reference,
  r.client_nom, r.client_prenom, r.client_email, r.client_telephone,
  r.salon_id, s.nom AS salon_nom, r.prestation_id, p.nom AS prestation_nom
`;

/** Liste les réservations, filtrable par salon, statut, date et client. */
export async function listerReservations(filtres: {
  salon_id?: number;
  statut?: string;
  date?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<any[] | Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.salon_id) {
    conditions.push('r.salon_id = ?');
    values.push(filtres.salon_id);
  }
  if (filtres.statut) {
    conditions.push('r.statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.date) {
    conditions.push('r.date = ?');
    values.push(filtres.date);
  }
  if (filtres.q) {
    conditions.push('(r.client_nom LIKE ? OR r.client_prenom LIKE ? OR r.client_email LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const base = `FROM rendezvous r
     LEFT JOIN salons s ON s.id = r.salon_id
     LEFT JOIN prestations p ON p.id = r.prestation_id
     ${where}`;

  if (filtres.page !== undefined || filtres.limit !== undefined) {
    const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
    const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
    const offset = (page - 1) * limit;
    const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total ${base}`, values);
    const [rows]: any = await pool.query(
      `SELECT ${RESA_SELECT} ${base} ORDER BY r.date DESC, r.heure_debut DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return enveloppe(rows, Number(total), page, limit);
  }

  // Comportement historique conservé (plafond de sécurité à 500 lignes).
  const [rows]: any = await pool.query(
    `SELECT ${RESA_SELECT} ${base}
     ORDER BY r.date DESC, r.heure_debut DESC
     LIMIT 500`,
    values
  );
  return rows;
}

/** Vérifie l'existence d'une réservation (404 sinon). */
async function assertExiste(id: number): Promise<void> {
  const [rows]: any = await pool.query('SELECT id FROM rendezvous WHERE id = ?', [id]);
  if (!rows[0]) throw new ServiceError(404, 'Réservation introuvable.');
}

/** Change le statut d'une réservation (en_attente/confirme/termine/annule). */
export async function changerStatut(id: number, statut: string) {
  if (!STATUTS_RENDEZVOUS.includes(statut as (typeof STATUTS_RENDEZVOUS)[number])) {
    throw new ServiceError(400, 'Statut invalide.');
  }
  await assertExiste(id);
  await pool.execute('UPDATE rendezvous SET statut = ? WHERE id = ?', [statut, id]);
}

/** Annulation douce (statut = annule) : préserve l'historique. */
export async function annuler(id: number) {
  await assertExiste(id);
  await pool.execute("UPDATE rendezvous SET statut = 'annule' WHERE id = ?", [id]);
}

/** Suppression définitive d'une réservation. */
export async function supprimer(id: number): Promise<void> {
  const [res]: any = await pool.execute('DELETE FROM rendezvous WHERE id = ?', [id]);
  if (res.affectedRows === 0) throw new ServiceError(404, 'Réservation introuvable.');
}

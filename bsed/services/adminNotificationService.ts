import { pool } from '../db/pool';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Notifications in-app destinées à l'administrateur (table `admin_notifications`).
 * Isolé : n'impacte pas les notifications salon. La création est appelée en
 * « fire-and-forget » (un échec n'interrompt jamais le flux métier appelant).
 */

export async function creerNotificationAdmin(input: {
  type: string;
  titre: string;
  message: string;
  lien?: string | null;
  refType?: string | null;
  refId?: number | null;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO admin_notifications (type, titre, message, lien, ref_type, ref_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.type, input.titre, input.message, input.lien ?? null, input.refType ?? null, input.refId ?? null]
  );
}

/** Liste les notifications admin, de la plus récente à la plus ancienne. */
export async function listerNotificationsAdmin(limit = 50) {
  const lim = Math.min(Math.max(1, limit | 0), 200);
  const [rows] = await pool.query(
    `SELECT id, type, titre, message, lien, ref_type, ref_id, lu, created_at
     FROM admin_notifications
     ORDER BY created_at DESC, id DESC
     LIMIT ${lim}`
  );
  return rows;
}

/** Nombre de notifications admin non lues (badge). */
export async function compterNonLuesAdmin(): Promise<number> {
  const [rows]: any = await pool.query('SELECT COUNT(*) AS n FROM admin_notifications WHERE lu = 0');
  return Number(rows[0].n);
}

/** Marque UNE notification admin comme lue. */
export async function marquerLueAdmin(id: number): Promise<void> {
  await pool.execute('UPDATE admin_notifications SET lu = 1 WHERE id = ?', [id]);
}

/** Marque toutes les notifications admin comme lues. */
export async function marquerToutesLuesAdmin(): Promise<void> {
  await pool.execute('UPDATE admin_notifications SET lu = 1 WHERE lu = 0');
}

/** Supprime UNE notification admin. */
export async function supprimerNotificationAdmin(id: number): Promise<void> {
  await pool.execute('DELETE FROM admin_notifications WHERE id = ?', [id]);
}

function ordreTri(tri?: string): string {
  return tri === 'ancien' ? 'created_at ASC, id ASC' : 'created_at DESC, id DESC';
}

/** Centre de notifications admin : liste paginée + filtres (type, statut, recherche) + tri. */
export async function listerNotificationsAdminPage(
  filtres: { type?: string; statut?: string; q?: string; tri?: string; page?: number; limit?: number }
): Promise<Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.type) {
    conditions.push('type = ?');
    values.push(filtres.type);
  }
  if (filtres.statut === 'lu' || filtres.statut === 'non_lu') {
    conditions.push('lu = ?');
    values.push(filtres.statut === 'lu' ? 1 : 0);
  }
  if (filtres.q) {
    conditions.push('(titre LIKE ? OR message LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = ordreTri(filtres.tri);
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM admin_notifications ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT id, type, titre, message, lien, ref_type, ref_id, lu, created_at
     FROM admin_notifications ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows, Number(total), page, limit);
}

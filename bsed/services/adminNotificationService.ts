import { pool } from '../db/pool';

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

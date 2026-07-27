import { pool } from '../db/pool';
import { logger } from '../utils/logger';

export type AuditEntry = {
  /** Auteur de l'action (NULL si système/inconnu). */
  userId?: number | null;
  /** Libellé de l'action, ex. 'ADMIN_LOGIN', 'SALON_SUSPEND'. */
  action: string;
  /** Type d'entité concernée, ex. 'salon', 'user', 'rendezvous'. */
  entityType?: string | null;
  entityId?: number | null;
  /** Adresse IP de l'auteur (req.ip). */
  ip?: string | null;
  /** Détails libres (objet sérialisé en JSON, ou chaîne). */
  details?: unknown;
};

/**
 * Enregistre une action dans le journal d'activité (audit_logs).
 *
 * IMPORTANT : l'audit ne doit JAMAIS faire échouer l'action métier qu'il
 * accompagne. Toute erreur d'écriture est donc journalisée et avalée (la
 * fonction ne rejette jamais). À appeler en « fire-and-forget ».
 */
export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    const details =
      entry.details === undefined || entry.details === null
        ? null
        : typeof entry.details === 'string'
          ? entry.details
          : JSON.stringify(entry.details);

    await pool.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.userId ?? null,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        entry.ip ?? null,
        details,
      ]
    );
  } catch (err) {
    logger.error({ err: err }, "Échec d'écriture du journal d'audit :");
  }
}

/**
 * Lecture du journal d'audit (admin), avec l'auteur résolu (JOIN users) et des
 * filtres optionnels. `limit` est borné à [1, 500] et injecté en tant qu'entier
 * assaini directement dans la requête (les placeholders LIMIT de mysql2 sont
 * capricieux avec `execute`).
 */
export async function listerAudit(filtres: { action?: string; userId?: number; limit?: number }) {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.action) {
    conditions.push('a.action = ?');
    values.push(filtres.action);
  }
  if (filtres.userId) {
    conditions.push('a.user_id = ?');
    values.push(filtres.userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(Math.max(Math.trunc(filtres.limit ?? 100), 1), 500);

  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.ip_address, a.details, a.created_at,
            a.user_id, u.firstName, u.lastName, u.email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY a.id DESC
     LIMIT ${limit}`,
    values
  );
  return rows;
}

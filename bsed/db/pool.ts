import mysql, { PoolConnection } from 'mysql2/promise';
import { env } from '../config/env';

// dateStrings: ['DATE'] — les colonnes DATE (ex. rendezvous.date) sont
// renvoyées comme de simples chaînes "AAAA-MM-JJ" plutôt que des objets Date.
// Sans cela, mysql2 construit un Date en minuit *local*, puis sa
// sérialisation JSON (toISOString, en UTC) peut afficher la veille ou le
// lendemain selon le fuseau du serveur — un vrai bug pour un système de
// réservation où la date exacte compte.
export const pool = mysql.createPool({ ...env.db, dateStrings: ['DATE'] });

/**
 * Exécute `fn` dans une transaction SQL : BEGIN → fn(conn) → COMMIT, avec
 * ROLLBACK automatique si `fn` lève. La connexion est toujours relâchée.
 *
 * Toutes les opérations à l'intérieur DOIVENT utiliser la connexion `conn`
 * fournie (et non le pool global) pour participer à la même transaction.
 *
 * Garantit qu'aucune donnée orpheline ne peut être créée par une séquence
 * d'écritures multi-tables (inscription, abonnement, activation...).
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      /* rollback best-effort : l'erreur d'origine prime */
    }
    throw error;
  } finally {
    conn.release();
  }
}

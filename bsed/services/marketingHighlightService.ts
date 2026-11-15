import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';

/** Stories à la une (table `ig_highlights`). Chaque « à la une » regroupe des
 *  stories via ig_stories.highlight_id. SQL paramétré, super admin. */

export type HighlightInput = {
  cle: string;
  titre: string;
  cover_url?: string | null;
  ordre?: number | null;
};

const SELECT = 'id, cle, titre, cover_url, ordre, created_at, updated_at';

/** Liste des « à la une » + nombre de stories rattachées (pour l'UI). */
export async function listerHighlights() {
  const [rows]: any = await pool.query(
    `SELECT h.id, h.cle, h.titre, h.cover_url, h.ordre, h.created_at, h.updated_at,
            (SELECT COUNT(*) FROM ig_stories s WHERE s.highlight_id = h.id) AS nb_stories
     FROM ig_highlights h ORDER BY h.ordre ASC, h.id ASC`
  );
  return rows;
}

export async function obtenirHighlight(id: number) {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_highlights WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Story à la une introuvable.');
  return rows[0];
}

export async function creerHighlight(data: HighlightInput) {
  const [dup]: any = await pool.query('SELECT id FROM ig_highlights WHERE cle = ?', [data.cle]);
  if (dup.length > 0) throw new ServiceError(409, 'Cette clé de rubrique existe déjà.');
  const [res]: any = await pool.execute(
    'INSERT INTO ig_highlights (cle, titre, cover_url, ordre) VALUES (?, ?, ?, ?)',
    [data.cle, data.titre, data.cover_url ?? null, data.ordre ?? 0]
  );
  return obtenirHighlight(res.insertId);
}

export async function modifierHighlight(id: number, data: HighlightInput) {
  await obtenirHighlight(id);
  const [dup]: any = await pool.query('SELECT id FROM ig_highlights WHERE cle = ? AND id <> ?', [data.cle, id]);
  if (dup.length > 0) throw new ServiceError(409, 'Cette clé de rubrique existe déjà.');
  await pool.execute(
    'UPDATE ig_highlights SET cle = ?, titre = ?, cover_url = ?, ordre = ? WHERE id = ?',
    [data.cle, data.titre, data.cover_url ?? null, data.ordre ?? 0, id]
  );
  return obtenirHighlight(id);
}

/** Supprime la rubrique ; les stories rattachées sont détachées (FK ON DELETE SET NULL). */
export async function supprimerHighlight(id: number): Promise<void> {
  await obtenirHighlight(id);
  await pool.execute('DELETE FROM ig_highlights WHERE id = ?', [id]);
}

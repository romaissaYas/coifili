import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';

/** Banques de hashtags réutilisables (table `ig_hashtag_groups`). Super admin. */

export type HashtagGroupInput = { nom: string; tags: string };

const SELECT = 'id, nom, tags, created_at, updated_at';

export async function listerHashtagGroups() {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_hashtag_groups ORDER BY nom ASC, id ASC`);
  return rows;
}

async function obtenir(id: number) {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_hashtag_groups WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Banque de hashtags introuvable.');
  return rows[0];
}

export async function creerHashtagGroup(data: HashtagGroupInput) {
  const [res]: any = await pool.execute('INSERT INTO ig_hashtag_groups (nom, tags) VALUES (?, ?)', [data.nom, data.tags]);
  return obtenir(res.insertId);
}

export async function modifierHashtagGroup(id: number, data: HashtagGroupInput) {
  await obtenir(id);
  await pool.execute('UPDATE ig_hashtag_groups SET nom = ?, tags = ? WHERE id = ?', [data.nom, data.tags, id]);
  return obtenir(id);
}

export async function supprimerHashtagGroup(id: number): Promise<void> {
  await obtenir(id);
  await pool.execute('DELETE FROM ig_hashtag_groups WHERE id = ?', [id]);
}

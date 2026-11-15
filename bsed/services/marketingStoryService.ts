import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/** Stories du module Marketing (table `ig_stories`). Rattachables à une « à la
 *  une » via highlight_id. SQL paramétré, super admin. */

export type StoryInput = {
  highlight_id?: number | null;
  categorie?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  texte?: string | null;
  sticker?: string | null;
  lien?: string | null;
  ordre?: number | null;
  statut?: 'brouillon' | 'programme' | 'publie';
  date_publication?: string | null;
};

const SELECT = `id, highlight_id, categorie, image_url, video_url, texte, sticker, lien,
  ordre, statut, date_publication, created_at, updated_at`;

function normaliserDate(valeur?: string | null): string | null {
  if (!valeur) return null;
  const s = String(valeur).replace('T', ' ').slice(0, 19);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? s : null;
}

export async function listerStories(
  filtres: { highlight_id?: number; statut?: string; q?: string; page?: number; limit?: number }
): Promise<Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filtres.highlight_id !== undefined) {
    conditions.push('highlight_id = ?');
    values.push(filtres.highlight_id);
  }
  if (filtres.statut) {
    conditions.push('statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.q) {
    conditions.push('(texte LIKE ? OR categorie LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 30, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM ig_stories ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT ${SELECT} FROM ig_stories ${where} ORDER BY ordre ASC, created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows, Number(total), page, limit);
}

export async function obtenirStory(id: number) {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_stories WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Story introuvable.');
  return rows[0];
}

export async function creerStory(data: StoryInput) {
  const [res]: any = await pool.execute(
    `INSERT INTO ig_stories (highlight_id, categorie, image_url, video_url, texte, sticker, lien, ordre, statut, date_publication)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.highlight_id ?? null, data.categorie ?? null, data.image_url ?? null, data.video_url ?? null,
     data.texte ?? null, data.sticker ?? null, data.lien ?? null, data.ordre ?? 0, data.statut ?? 'brouillon', normaliserDate(data.date_publication)]
  );
  return obtenirStory(res.insertId);
}

export async function modifierStory(id: number, data: StoryInput) {
  await obtenirStory(id);
  await pool.execute(
    `UPDATE ig_stories SET highlight_id = ?, categorie = ?, image_url = ?, video_url = ?, texte = ?,
       sticker = ?, lien = ?, ordre = ?, statut = ?, date_publication = ? WHERE id = ?`,
    [data.highlight_id ?? null, data.categorie ?? null, data.image_url ?? null, data.video_url ?? null,
     data.texte ?? null, data.sticker ?? null, data.lien ?? null, data.ordre ?? 0, data.statut ?? 'brouillon', normaliserDate(data.date_publication), id]
  );
  return obtenirStory(id);
}

export async function supprimerStory(id: number): Promise<void> {
  await obtenirStory(id);
  await pool.execute('DELETE FROM ig_stories WHERE id = ?', [id]);
}

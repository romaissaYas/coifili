import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/** Médiathèque du module Marketing (table `ig_media`). SQL paramétré, super admin. */

export type MediaInput = {
  type: 'image' | 'video' | 'logo' | 'icon' | 'cover';
  url: string;
  titre?: string | null;
  alt?: string | null;
  largeur?: number | null;
  hauteur?: number | null;
  taille?: number | null;
};

const SELECT = 'id, type, url, titre, alt, largeur, hauteur, taille, created_at';

export async function listerMedia(
  filtres: { type?: string; q?: string; page?: number; limit?: number }
): Promise<Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filtres.type) {
    conditions.push('type = ?');
    values.push(filtres.type);
  }
  if (filtres.q) {
    conditions.push('(titre LIKE ? OR alt LIKE ? OR url LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 24, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM ig_media ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT ${SELECT} FROM ig_media ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows, Number(total), page, limit);
}

export async function creerMedia(data: MediaInput) {
  const [res]: any = await pool.execute(
    `INSERT INTO ig_media (type, url, titre, alt, largeur, hauteur, taille) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.type, data.url, data.titre ?? null, data.alt ?? null, data.largeur ?? null, data.hauteur ?? null, data.taille ?? null]
  );
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_media WHERE id = ?`, [res.insertId]);
  return rows[0];
}

export async function supprimerMedia(id: number): Promise<void> {
  const [rows]: any = await pool.query('SELECT id FROM ig_media WHERE id = ?', [id]);
  if (!rows[0]) throw new ServiceError(404, 'Média introuvable.');
  await pool.execute('DELETE FROM ig_media WHERE id = ?', [id]);
}

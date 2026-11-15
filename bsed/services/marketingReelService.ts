import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/** Reels du module Marketing (table `ig_reels`). SQL paramétré, super admin. */

export type ReelInput = {
  titre?: string | null;
  video_url?: string | null;
  miniature_url?: string | null;
  legende?: string | null;
  hashtags?: string | null;
  musique?: string | null;
  duree?: number | null;
  statut?: 'brouillon' | 'programme' | 'publie';
  date_publication?: string | null;
};

const SELECT = `id, titre, video_url, miniature_url, legende, hashtags, musique, duree,
  statut, date_publication, meta_media_id, created_at, updated_at`;

function normaliserDate(valeur?: string | null): string | null {
  if (!valeur) return null;
  const s = String(valeur).replace('T', ' ').slice(0, 19);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? s : null;
}

export async function listerReels(
  filtres: { statut?: string; q?: string; tri?: string; page?: number; limit?: number }
): Promise<Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];
  if (filtres.statut) {
    conditions.push('statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.q) {
    conditions.push('(titre LIKE ? OR legende LIKE ? OR hashtags LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = filtres.tri === 'ancien' ? 'created_at ASC, id ASC' : 'created_at DESC, id DESC';
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM ig_reels ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT ${SELECT} FROM ig_reels ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows, Number(total), page, limit);
}

export async function obtenirReel(id: number) {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_reels WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Reel introuvable.');
  return rows[0];
}

export async function creerReel(data: ReelInput) {
  const [res]: any = await pool.execute(
    `INSERT INTO ig_reels (titre, video_url, miniature_url, legende, hashtags, musique, duree, statut, date_publication)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.titre ?? null, data.video_url ?? null, data.miniature_url ?? null, data.legende ?? null,
     data.hashtags ?? null, data.musique ?? null, data.duree ?? null, data.statut ?? 'brouillon', normaliserDate(data.date_publication)]
  );
  return obtenirReel(res.insertId);
}

export async function modifierReel(id: number, data: ReelInput) {
  await obtenirReel(id);
  await pool.execute(
    `UPDATE ig_reels SET titre = ?, video_url = ?, miniature_url = ?, legende = ?, hashtags = ?,
       musique = ?, duree = ?, statut = ?, date_publication = ? WHERE id = ?`,
    [data.titre ?? null, data.video_url ?? null, data.miniature_url ?? null, data.legende ?? null,
     data.hashtags ?? null, data.musique ?? null, data.duree ?? null, data.statut ?? 'brouillon', normaliserDate(data.date_publication), id]
  );
  return obtenirReel(id);
}

export async function supprimerReel(id: number): Promise<void> {
  await obtenirReel(id);
  await pool.execute('DELETE FROM ig_reels WHERE id = ?', [id]);
}

export async function dupliquerReel(id: number) {
  const r = await obtenirReel(id);
  return creerReel({
    titre: r.titre ? `${r.titre} (copie)` : 'Reel (copie)',
    video_url: r.video_url, miniature_url: r.miniature_url, legende: r.legende,
    hashtags: r.hashtags, musique: r.musique, duree: r.duree, statut: 'brouillon', date_publication: null,
  });
}

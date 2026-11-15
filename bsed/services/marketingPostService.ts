import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Module Marketing Instagram — Publications (table `ig_posts`). SQL paramétré,
 * réservé au super administrateur (garde appliquée au niveau des routes). La
 * galerie est stockée en JSON (tableau d'URLs). `date_publication` porte la
 * programmation ; `statut` = brouillon | programme | publie.
 */

export type PostInput = {
  titre: string;
  image_url?: string | null;
  galerie?: string[];
  image_prompt?: string | null;
  legende?: string | null;
  hashtags?: string | null;
  emojis?: string | null;
  cta?: string | null;
  statut?: 'brouillon' | 'programme' | 'publie';
  date_publication?: string | null;
};

const SELECT = `id, titre, image_url, galerie, image_prompt, legende, hashtags, emojis, cta,
  statut, date_publication, meta_media_id, created_at, updated_at`;

function parseGalerie(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string');
  if (!raw || typeof raw !== 'string') return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: any) {
  return { ...row, galerie: parseGalerie(row.galerie) };
}

/** Normalise une date de programmation vers un DATETIME MySQL, ou null. */
function normaliserDate(valeur?: string | null): string | null {
  if (!valeur) return null;
  const s = String(valeur).replace('T', ' ').slice(0, 19);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? s : null;
}

function ordreTri(tri?: string): string {
  switch (tri) {
    case 'ancien':
      return 'created_at ASC, id ASC';
    case 'date_pub':
      return 'date_publication IS NULL, date_publication ASC';
    case 'recent':
    default:
      return 'created_at DESC, id DESC';
  }
}

/** Liste paginée + filtres (statut, recherche titre/légende/hashtags) + tri. */
export async function listerPosts(
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
  const orderBy = ordreTri(filtres.tri);
  const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
  const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
  const offset = (page - 1) * limit;

  const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM ig_posts ${where}`, values);
  const [rows]: any = await pool.query(
    `SELECT ${SELECT} FROM ig_posts ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return enveloppe(rows.map(mapRow), Number(total), page, limit);
}

/** Détail d'une publication (404 si absente). */
export async function obtenirPost(id: number) {
  const [rows]: any = await pool.query(`SELECT ${SELECT} FROM ig_posts WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Publication introuvable.');
  return mapRow(rows[0]);
}

export async function creerPost(data: PostInput) {
  const [res]: any = await pool.execute(
    `INSERT INTO ig_posts
       (titre, image_url, galerie, image_prompt, legende, hashtags, emojis, cta, statut, date_publication)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titre,
      data.image_url ?? null,
      JSON.stringify(data.galerie ?? []),
      data.image_prompt ?? null,
      data.legende ?? null,
      data.hashtags ?? null,
      data.emojis ?? null,
      data.cta ?? null,
      data.statut ?? 'brouillon',
      normaliserDate(data.date_publication),
    ]
  );
  return obtenirPost(res.insertId);
}

export async function modifierPost(id: number, data: PostInput) {
  await obtenirPost(id); // 404 si absente
  await pool.execute(
    `UPDATE ig_posts SET
       titre = ?, image_url = ?, galerie = ?, image_prompt = ?, legende = ?, hashtags = ?,
       emojis = ?, cta = ?, statut = ?, date_publication = ?
     WHERE id = ?`,
    [
      data.titre,
      data.image_url ?? null,
      JSON.stringify(data.galerie ?? []),
      data.image_prompt ?? null,
      data.legende ?? null,
      data.hashtags ?? null,
      data.emojis ?? null,
      data.cta ?? null,
      data.statut ?? 'brouillon',
      normaliserDate(data.date_publication),
      id,
    ]
  );
  return obtenirPost(id);
}

export async function supprimerPost(id: number): Promise<void> {
  await obtenirPost(id);
  await pool.execute('DELETE FROM ig_posts WHERE id = ?', [id]);
}

/** Duplique une publication en brouillon (sans date de programmation). */
export async function dupliquerPost(id: number) {
  const p = await obtenirPost(id);
  return creerPost({
    titre: `${p.titre} (copie)`,
    image_url: p.image_url,
    galerie: p.galerie,
    image_prompt: p.image_prompt,
    legende: p.legende,
    hashtags: p.hashtags,
    emojis: p.emojis,
    cta: p.cta,
    statut: 'brouillon',
    date_publication: null,
  });
}

/** Compteurs pour le Dashboard Marketing. */
export async function statistiquesPosts(): Promise<{ total: number; brouillon: number; programme: number; publie: number }> {
  const [rows]: any = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(statut = 'brouillon') AS brouillon,
       SUM(statut = 'programme') AS programme,
       SUM(statut = 'publie') AS publie
     FROM ig_posts`
  );
  const r = rows[0] ?? {};
  return {
    total: Number(r.total ?? 0),
    brouillon: Number(r.brouillon ?? 0),
    programme: Number(r.programme ?? 0),
    publie: Number(r.publie ?? 0),
  };
}

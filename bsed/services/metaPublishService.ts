import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { logger } from '../utils/logger';
import { connexionPourPublication } from './metaOAuthService';
import { resoudreImagePublique } from './metaService';

/**
 * Publication d'une publication Coifili sur Facebook Page et/ou Instagram, via
 * l'API officielle de Meta, avec le jeton de Page CHIFFRÉ en base (OAuth admin).
 * Chaque tentative par réseau est journalisée dans `meta_publications`
 * (succès/échec, media_id, erreur détaillée).
 */
const VERSION = process.env.META_API_VERSION || 'v21.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;

export type Reseaux = { facebook?: boolean; instagram?: boolean };
export type ResultatReseau = { statut: 'succes' | 'echec'; media_id?: string; erreur?: string };

async function graphPost(url: string): Promise<any> {
  const res = await fetch(url, { method: 'POST' });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || 'Erreur API Meta.';
    throw new Error(msg);
  }
  return data;
}

async function chargerPost(id: number) {
  const [rows]: any = await pool.query('SELECT id, image_url, legende, cta, hashtags FROM ig_posts WHERE id = ?', [id]);
  if (!rows[0]) throw new ServiceError(404, 'Publication introuvable.');
  return rows[0];
}

function legende(post: any): string {
  return [post.legende, post.cta, post.hashtags].map((x) => (x ?? '').trim()).filter(Boolean).join('\n\n');
}

async function enregistrer(postId: number, reseau: 'facebook' | 'instagram', r: ResultatReseau): Promise<void> {
  await pool.execute(
    'INSERT INTO meta_publications (post_id, reseau, statut, media_id, erreur) VALUES (?, ?, ?, ?, ?)',
    [postId, reseau, r.statut, r.media_id ?? null, r.erreur ?? null]
  );
}

async function publierFacebookInterne(pageId: string, pageToken: string, post: any): Promise<ResultatReseau> {
  const image = resoudreImagePublique(post.image_url ?? '');
  if (!image) return { statut: 'echec', erreur: "Image non publique : configurez PUBLIC_SITE_URL ou une URL absolue." };
  try {
    const res = await graphPost(
      `${GRAPH}/${pageId}/photos?url=${encodeURIComponent(image)}&caption=${encodeURIComponent(legende(post))}&access_token=${encodeURIComponent(pageToken)}`
    );
    return { statut: 'succes', media_id: String(res?.post_id ?? res?.id ?? '') };
  } catch (e) {
    return { statut: 'echec', erreur: e instanceof Error ? e.message : 'Échec Facebook.' };
  }
}

async function publierInstagramInterne(igId: string | null, pageToken: string, post: any): Promise<ResultatReseau> {
  if (!igId) return { statut: 'echec', erreur: "Aucun compte Instagram Business lié à la Page connectée." };
  const image = resoudreImagePublique(post.image_url ?? '');
  if (!image) return { statut: 'echec', erreur: "Image non publique : configurez PUBLIC_SITE_URL ou une URL absolue." };
  try {
    const creation = await graphPost(
      `${GRAPH}/${igId}/media?image_url=${encodeURIComponent(image)}&caption=${encodeURIComponent(legende(post))}&access_token=${encodeURIComponent(pageToken)}`
    );
    if (!creation?.id) throw new Error("Pas d'identifiant de container Meta.");
    const publie = await graphPost(
      `${GRAPH}/${igId}/media_publish?creation_id=${encodeURIComponent(creation.id)}&access_token=${encodeURIComponent(pageToken)}`
    );
    if (!publie?.id) throw new Error("Publication Instagram non confirmée.");
    return { statut: 'succes', media_id: String(publie.id) };
  } catch (e) {
    return { statut: 'echec', erreur: e instanceof Error ? e.message : 'Échec Instagram.' };
  }
}

/**
 * Publie une publication sur les réseaux demandés. Une erreur sur un réseau
 * n'empêche pas l'autre. Journalise chaque résultat et marque la publication
 * comme 'publie' si au moins un réseau a réussi.
 */
export async function publierSurReseaux(
  postId: number,
  reseaux: Reseaux
): Promise<{ facebook?: ResultatReseau; instagram?: ResultatReseau }> {
  if (!reseaux.facebook && !reseaux.instagram) {
    throw new ServiceError(400, 'Sélectionnez au moins un réseau (Facebook ou Instagram).');
  }
  const conn = await connexionPourPublication(); // 503 si non connecté
  const post = await chargerPost(postId);
  const out: { facebook?: ResultatReseau; instagram?: ResultatReseau } = {};

  if (reseaux.facebook) {
    out.facebook = await publierFacebookInterne(conn.pageId, conn.pageToken, post);
    await enregistrer(postId, 'facebook', out.facebook);
  }
  if (reseaux.instagram) {
    out.instagram = await publierInstagramInterne(conn.igBusinessId, conn.pageToken, post);
    await enregistrer(postId, 'instagram', out.instagram);
    if (out.instagram.statut === 'succes' && out.instagram.media_id) {
      await pool.execute('UPDATE ig_posts SET meta_media_id = ? WHERE id = ?', [out.instagram.media_id, postId]);
    }
  }

  const unSucces = out.facebook?.statut === 'succes' || out.instagram?.statut === 'succes';
  if (unSucces) {
    await pool.execute("UPDATE ig_posts SET statut = 'publie' WHERE id = ?", [postId]);
  } else {
    logger.warn({ postId }, '[meta-publish] aucun réseau publié avec succès');
  }
  return out;
}

/** Publication Instagram seule (compat route /posts/:id/publish existante). */
export async function publierInstagram(postId: number): Promise<{ meta_media_id: string }> {
  const r = await publierSurReseaux(postId, { instagram: true });
  if (r.instagram?.statut !== 'succes') {
    throw new ServiceError(502, r.instagram?.erreur || 'Échec de la publication Instagram.');
  }
  return { meta_media_id: r.instagram.media_id! };
}

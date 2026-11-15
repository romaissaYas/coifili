import crypto from 'crypto';
import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { logger } from '../utils/logger';
import { chiffrer, dechiffrer } from '../utils/crypto';

/**
 * Connexion Meta par OAuth (Facebook Login) depuis l'admin.
 *
 * - `state` signé HMAC-SHA256 (clé META_TOKEN_SECRET) + expiration 10 min (CSRF).
 * - Échange code → jeton utilisateur courte durée → longue durée.
 * - /me/accounts : 1 Page → connexion directe ; plusieurs → sélection par l'admin.
 * - Stockage CHIFFRÉ du jeton de Page + compte IG (table meta_connections).
 * - API officielle uniquement ; aucun jeton renvoyé au frontend.
 */
const VERSION = process.env.META_API_VERSION || 'v21.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const DIALOG = `https://www.facebook.com/${VERSION}/dialog/oauth`;
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
];
const STATE_TTL_MS = 10 * 60 * 1000;

export function etatConfigure(): boolean {
  return Boolean(
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET &&
    process.env.META_OAUTH_REDIRECT_URI &&
    process.env.META_TOKEN_SECRET
  );
}

function exigerConfig(): void {
  if (!etatConfigure()) {
    throw new ServiceError(503, "Connexion Meta non configurée (META_APP_ID / META_APP_SECRET / META_OAUTH_REDIRECT_URI / META_TOKEN_SECRET).");
  }
}

// --- state signé ---
function signer(payload: string): string {
  return crypto.createHmac('sha256', process.env.META_TOKEN_SECRET!).update(payload).digest('hex');
}
function creerState(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + STATE_TTL_MS })).toString('base64url');
  return `${payload}.${signer(payload)}`;
}
export function verifierState(state: string): boolean {
  const [payload, sig] = (state || '').split('.');
  if (!payload || !sig) return false;
  const attendu = signer(payload);
  if (sig.length !== attendu.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function urlAutorisation(): string {
  exigerConfig();
  const p = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_OAUTH_REDIRECT_URI!,
    state: creerState(),
    scope: SCOPES.join(','),
    response_type: 'code',
  });
  return `${DIALOG}?${p.toString()}`;
}

// --- appels Graph ---
async function graphGet(url: string): Promise<any> {
  const res = await fetch(url);
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || 'Erreur API Meta.';
    logger.error({ status: res.status, err: data?.error }, '[meta-oauth] Graph non OK');
    throw new ServiceError(502, `Meta : ${msg}`);
  }
  return data;
}

async function echangerCode(code: string): Promise<{ token: string; expiresSec: number }> {
  const court = await graphGet(
    `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(process.env.META_APP_ID!)}` +
    `&redirect_uri=${encodeURIComponent(process.env.META_OAUTH_REDIRECT_URI!)}` +
    `&client_secret=${encodeURIComponent(process.env.META_APP_SECRET!)}` +
    `&code=${encodeURIComponent(code)}`
  );
  const long = await graphGet(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(process.env.META_APP_ID!)}` +
    `&client_secret=${encodeURIComponent(process.env.META_APP_SECRET!)}` +
    `&fb_exchange_token=${encodeURIComponent(court.access_token)}`
  );
  return { token: long.access_token, expiresSec: Number(long.expires_in ?? 5184000) };
}

type PageMeta = { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } };

async function listerPages(userToken: string): Promise<PageMeta[]> {
  const data = await graphGet(
    `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`
  );
  return Array.isArray(data?.data) ? data.data : [];
}

// --- persistance (singleton : une connexion active) ---
async function effacer(): Promise<void> {
  await pool.execute('DELETE FROM meta_connections');
}
async function rowActive(): Promise<any | null> {
  const [rows]: any = await pool.query('SELECT * FROM meta_connections ORDER BY id DESC LIMIT 1');
  return rows[0] ?? null;
}
async function enregistrerPending(userToken: string, expiresSec: number): Promise<void> {
  await effacer();
  await pool.execute(
    `INSERT INTO meta_connections (statut, token_type, access_token_enc, scopes, token_expires_at)
     VALUES ('pending', 'user', ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
    [chiffrer(userToken), SCOPES.join(','), expiresSec]
  );
}
async function finaliser(page: PageMeta): Promise<void> {
  await effacer();
  await pool.execute(
    `INSERT INTO meta_connections
       (statut, token_type, access_token_enc, fb_page_id, fb_page_name, ig_business_id, ig_username, scopes, connected_at)
     VALUES ('connected', 'page', ?, ?, ?, ?, ?, ?, NOW())`,
    [
      chiffrer(page.access_token), page.id, page.name,
      page.instagram_business_account?.id ?? null,
      page.instagram_business_account?.username ?? null,
      SCOPES.join(','),
    ]
  );
}

export type ResultatCallback = { resultat: 'success' | 'select' | 'error'; reason?: string };

/** Traite le retour OAuth. Résultat : success (1 page), select (plusieurs), error. */
export async function traiterCallback(code: string, state: string): Promise<ResultatCallback> {
  exigerConfig();
  if (!verifierState(state)) return { resultat: 'error', reason: 'state_invalide' };
  const { token, expiresSec } = await echangerCode(code);
  const pages = await listerPages(token);
  if (pages.length === 0) return { resultat: 'error', reason: 'aucune_page' };
  if (pages.length === 1) { await finaliser(pages[0]); return { resultat: 'success' }; }
  await enregistrerPending(token, expiresSec);
  return { resultat: 'select' };
}

/** Liste les Pages en attente de sélection (connexion 'pending'). Sans jetons. */
export async function listerPagesEnAttente(): Promise<{ id: string; name: string; hasInstagram: boolean }[]> {
  const row = await rowActive();
  if (!row || row.statut !== 'pending') throw new ServiceError(409, 'Aucune sélection de Page en attente.');
  const pages = await listerPages(dechiffrer(row.access_token_enc));
  return pages.map((p) => ({ id: p.id, name: p.name, hasInstagram: Boolean(p.instagram_business_account?.id) }));
}

/** Finalise la connexion avec la Page choisie par l'admin. */
export async function selectionnerPage(pageId: string): Promise<void> {
  const row = await rowActive();
  if (!row || row.statut !== 'pending') throw new ServiceError(409, 'Aucune sélection de Page en attente.');
  const pages = await listerPages(dechiffrer(row.access_token_enc));
  const page = pages.find((p) => p.id === pageId);
  if (!page) throw new ServiceError(404, 'Page introuvable dans ce compte.');
  await finaliser(page);
}

/** État public de la connexion (jamais de jeton). */
export async function obtenirConnexion(): Promise<{
  configure: boolean; connected: boolean; statut: string | null;
  pageName: string | null; igUsername: string | null; igBusinessId: string | null;
}> {
  const row = await rowActive();
  return {
    configure: etatConfigure(),
    connected: row?.statut === 'connected',
    statut: row?.statut ?? null,
    pageName: row?.fb_page_name ?? null,
    igUsername: row?.ig_username ?? null,
    igBusinessId: row?.ig_business_id ?? null,
  };
}

/** Jeton + ids pour publier. 503 si non connecté. Réservé au serveur. */
export async function connexionPourPublication(): Promise<{ pageToken: string; pageId: string; igBusinessId: string | null }> {
  const row = await rowActive();
  if (!row || row.statut !== 'connected') {
    throw new ServiceError(503, "Aucun compte Meta connecté. Connectez votre Page Facebook / Instagram depuis les Paramètres.");
  }
  return { pageToken: dechiffrer(row.access_token_enc), pageId: row.fb_page_id, igBusinessId: row.ig_business_id ?? null };
}

export async function deconnecter(): Promise<void> {
  await effacer();
}

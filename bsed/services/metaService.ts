import { obtenirConnexion } from './metaOAuthService';

/**
 * Helpers Meta partagés. La publication proprement dite vit dans
 * `metaPublishService` (Facebook + Instagram), et la connexion OAuth dans
 * `metaOAuthService`. Ce module ne fait qu'exposer des utilitaires communs pour
 * éviter toute dépendance circulaire.
 *
 * API officielle de Meta uniquement ; l'image publiée doit être une URL PUBLIQUE
 * (Meta la télécharge) ; les jetons sont chiffrés en base (jamais en clair).
 */

/**
 * Résout une image en URL PUBLIQUE absolue pour Meta :
 *  - déjà http(s) → inchangée ;
 *  - chemin relatif (/img/..., /uploads/...) → préfixé par PUBLIC_SITE_URL
 *    (le domaine public qui sert ces fichiers). Sans base configurée → null.
 */
export function resoudreImagePublique(brut: string): string | null {
  const s = (brut ?? '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const base = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (s.startsWith('/') && base) return `${base}${s}`;
  return null;
}

/** État de la connexion Meta (pour le Dashboard / Paramètres). Jamais de jeton. */
export async function etatMeta(): Promise<{ actif: boolean; ig_business_id: string | null }> {
  const c = await obtenirConnexion();
  return { actif: c.connected, ig_business_id: c.igBusinessId };
}

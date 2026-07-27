import { rateLimit } from 'express-rate-limit';

/**
 * Limitation de débit (anti brute-force / abus).
 *
 * NOTE production : le store par défaut est EN MÉMOIRE, donc propre à chaque
 * instance. En déploiement multi-instances (PM2 cluster, plusieurs conteneurs),
 * il faudra brancher un store partagé (ex. Redis via `rate-limit-redis`) pour
 * que la limite soit globale.
 */
const commun = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: 'draft-7' as const, // en-têtes `RateLimit-*`
  legacyHeaders: false, // pas d'anciens en-têtes `X-RateLimit-*`
};

/**
 * Strict : endpoints d'authentification (`/login`, `/register`,
 * `/forgot-password`). Freine les attaques par force brute et l'énumération de
 * comptes. 10 requêtes / 15 min / IP.
 */
export const authLimiter = rateLimit({
  ...commun,
  limit: 10,
  message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

/**
 * Souple : ensemble des routes `/api`. Garde-fou contre les abus sans gêner un
 * usage normal. 300 requêtes / 15 min / IP.
 */
export const apiLimiter = rateLimit({
  ...commun,
  limit: 300,
  message: { error: 'Trop de requêtes. Veuillez ralentir puis réessayer.' },
});

/**
 * Upload d'image de salon (endpoint public utilisé à l'inscription, sans
 * session). Garde-fou anti-abus dédié en plus de la validation format/taille.
 * 20 uploads / 15 min / IP.
 */
export const uploadLimiter = rateLimit({
  ...commun,
  limit: 20,
  message: { error: 'Trop d’envois d’images. Réessayez dans quelques minutes.' },
});

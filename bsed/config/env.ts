import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';
import { logger } from '../utils/logger';

/**
 * Détecte une exécution de DÉVELOPPEMENT EXPLICITE (`npm run dev`, c.-à-d.
 * lancée par ts-node-dev depuis les sources TypeScript).
 *
 * On NE se base PAS sur NODE_ENV : cette variable est trop souvent oubliée,
 * et un simple `node dist/serveur.js` sans NODE_ENV ne doit jamais être
 * considéré comme du développement. On s'appuie donc sur deux signaux
 * POSITIFS, tous deux absents de toute exécution compilée (npm run start,
 * Docker, PM2, node dist/...) :
 *   - `TS_NODE_DEV=true` : posé automatiquement par ts-node-dev ;
 *   - point d'entrée en `.ts` : on exécute les sources, pas le build.
 */
const isExplicitDev =
  process.env.TS_NODE_DEV === 'true' ||
  (process.argv[1] ?? '').endsWith('.ts');

/**
 * Résout le secret JWT :
 * - s'il est défini dans l'environnement, on l'utilise ;
 * - sinon, uniquement en développement explicite, on utilise un repli non
 *   sécurisé avec un avertissement (pratique en local) ;
 * - pour toute autre exécution (compilée / production), on arrête
 *   immédiatement le serveur : aucun secret de repli n'est toléré, même si
 *   NODE_ENV a été oublié.
 */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (!isExplicitDev) {
    logger.error(
      "❌ JWT_SECRET est obligatoire pour toute exécution hors `npm run dev`. " +
      'Définissez-le dans l\'environnement (ex. `openssl rand -base64 48`) avant de démarrer le serveur.'
    );
    process.exit(1);
  }

  logger.warn(
    "⚠️  JWT_SECRET non défini : secret de DÉVELOPPEMENT non sécurisé utilisé (`npm run dev` uniquement). " +
    'À ne JAMAIS utiliser en dehors du développement.'
  );
  return 'dev-insecure-secret-do-not-use-in-production';
}

/**
 * Configuration centralisée du backend, lue depuis les variables
 * d'environnement (voir bsed/.env.example pour la liste complète).
 */
/**
 * Résout la valeur `trust proxy` d'Express. Derrière un reverse proxy (Nginx,
 * Docker, PaaS), sans ce réglage `req.ip` vaut l'IP du proxy — ce qui rend le
 * rate limiting inopérant (tous les clients partagent une IP) et fausse les
 * logs. `TRUST_PROXY` accepte un nombre de sauts ("1"), un booléen ("true"),
 * ou une liste d'IP/sous-réseaux de confiance. Défaut : `false` (aucun proxy),
 * sûr en local et pour un déploiement sans intermédiaire.
 */
function resolveTrustProxy(): boolean | number | string {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === '') return false;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw; // liste d'IP/CIDR de confiance
}

export const env = {
  port: process.env.PORT || 5000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  trustProxy: resolveTrustProxy(),

  // Paiement par carte (SATIM/CIB) : DÉSACTIVÉ par défaut tant que l'intégration
  // réelle de la passerelle n'est pas finalisée. Quand false, seul le paiement
  // en espèces est proposé (l'infrastructure webhook reste en place, prête à
  // être réactivée via PAIEMENT_CARTE_ACTIVE=true).
  paiementCarteActive: process.env.PAIEMENT_CARTE_ACTIVE === 'true',

  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion',
  },

  jwtSecret: resolveJwtSecret(),
  // Casté une seule fois ici : jsonwebtoken exige un format précis ("7d",
  // "1h", ...) que process.env ne peut pas garantir statiquement.
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
};

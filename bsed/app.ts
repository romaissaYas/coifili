import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { apiLimiter } from './middleware/rateLimit';
import { env } from './config/env';
import { pool } from './db/pool';
import { logger } from './utils/logger';
import { capturerException } from './utils/monitoring';
import { UPLOADS_DIR } from './middleware/upload';
import authRoutes from './routes/auth';
import salonsRoutes from './routes/salons';
import produitsRoutes from './routes/produits';
import prestationsRoutes from './routes/prestations';
import horairesRoutes from './routes/horraires';
import employesRoutes from './routes/employes';
import rendezvousRoutes from './routes/rendezvous';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import productsRoutes from './routes/products';
import subscriptionsRoutes from './routes/subscriptions';
import reservationsRoutes from './routes/reservations';
import uploadsRoutes from './routes/uploads';
import notificationsRoutes from './routes/notifications';
import docsRoutes from './routes/docs';

/**
 * Construit et configure l'application Express (sans l'écouter). Isolé de
 * `serveur.ts` pour être importable par les tests d'intégration (Supertest)
 * sans démarrer de serveur ni de tâches planifiées.
 */
const app: Application = express();

// Derrière un reverse proxy (Nginx/Docker/PaaS) : fait confiance à
// X-Forwarded-For pour que `req.ip` soit l'IP réelle du client — indispensable
// au rate limiting et à la véracité des logs. Piloté par TRUST_PROXY.
app.set('trust proxy', env.trustProxy);

// Journalisation structurée des requêtes (corrélation via un id de requête).
// `test` : silencieux pour ne pas polluer la sortie des tests.
app.use(
  pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
    quietReqLogger: true,
  })
);

// En-têtes de sécurité (X-Content-Type-Options, frameguard, HSTS en prod...).
app.use(helmet());
// express.json + capture du corps brut (req.rawBody) : nécessaire pour vérifier
// la signature HMAC des webhooks de paiement sans altérer le parsing existant.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: string }).rawBody = buf.toString('utf8');
    },
  })
);
app.use(cors({ origin: env.corsOrigin }));

// Fichiers uploadés (images produits/salon) servis publiquement en lecture.
// Cross-Origin-Resource-Policy: cross-origin — Helmet impose `same-origin` par
// défaut, ce qui empêche le frontend (autre origine) d'AFFICHER ces images.
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Sonde de disponibilité (monitoring / orchestrateur). Vérifie la connexion DB.
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'up', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

// /register et /login sont montées à la racine (pas sous /api), pour
// préserver les chemins consommés tels quels par le frontend.
app.use('/', authRoutes);

// Documentation de l'API (publique, non limitée) : montée avant le rate limiter.
app.use('/api', docsRoutes);

// Garde-fou de débit sur l'ensemble des routes /api (souple).
app.use('/api', apiLimiter);

app.use('/api/salons', salonsRoutes);
app.use('/api/produits', produitsRoutes);
app.use('/api/prestations', prestationsRoutes);
app.use('/api/horaires', horairesRoutes);
app.use('/api/employes', employesRoutes);
app.use('/api/rendezvous', rendezvousRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 JSON pour toute route inconnue.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ressource introuvable.' });
});

// Middleware de gestion d'erreurs — enregistré EN DERNIER pour capturer toute
// erreur propagée par les routes/contrôleurs (Express 5 transmet aussi les
// rejets de promesses des handlers async). Journalise via pino et remonte à
// Sentry si configuré.
app.use((err: unknown, req: Request, res: Response, _next: (err?: unknown) => void) => {
  (req.log ?? logger).error({ err }, 'Erreur serveur non gérée');
  capturerException(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

export default app;

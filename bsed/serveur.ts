import app from './app';
import { env } from './config/env';
import { initializeDb } from './db/schema';
import { demarrerTachesPlanifiees } from './jobs/scheduler';
import { verifierTransportEmail } from './services/emailService';
import { logger } from './utils/logger';
import { initMonitoring } from './utils/monitoring';

/**
 * Point d'entrée : initialise la base puis démarre le serveur HTTP et les
 * tâches planifiées. La configuration de l'app (routes, middlewares) vit dans
 * `app.ts` pour rester testable indépendamment.
 */
async function startServer() {
  try {
    initMonitoring(); // Sentry (opt-in) : avant tout, pour capturer l'amorçage
    await initializeDb();
    app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
    });
    // Tâches planifiées (expiration/alertes d'abonnement, sauvegarde opt-in).
    // Démarrées après l'init DB ; jamais dans les scripts (qui n'appellent pas
    // startServer).
    demarrerTachesPlanifiees();
    // Statut du transport email (avertit si SMTP non configuré, teste sinon).
    void verifierTransportEmail();
  } catch (error) {
    logger.error({ err: error }, 'Server startup error');
    process.exit(1);
  }
}

startServer();

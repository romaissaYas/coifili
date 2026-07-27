import cron from 'node-cron';
import { traiterAbonnements } from '../services/subscriptionService';
import { sauvegarderBase } from '../services/backupService';
import { logger } from '../utils/logger';

/**
 * Démarre les tâches planifiées du serveur.
 *
 * - Au DÉMARRAGE : on lance immédiatement le traitement des abonnements, afin
 *   de rattraper d'éventuelles expirations manquées si le serveur était éteint
 *   à l'heure du cron.
 * - CHAQUE JOUR à 03:00 : traitement quotidien.
 *
 * Le traitement lui-même vit dans subscriptionService (isolé et testable) ;
 * ici on ne fait que le planifier.
 */
export function demarrerTachesPlanifiees(): void {
  void executerTraitementAbonnements('démarrage');
  cron.schedule('0 3 * * *', () => {
    void executerTraitementAbonnements('cron quotidien');
  });

  // Sauvegarde quotidienne de la base — OPT-IN (BACKUP_ENABLED=true), pour ne
  // rien changer au comportement existant par défaut. Planifiée à 02:00, avant
  // le traitement des abonnements. Nécessite `mysqldump` sur l'hôte.
  const backupEnabled = process.env.BACKUP_ENABLED === 'true';
  if (backupEnabled) {
    const heure = process.env.BACKUP_CRON || '0 2 * * *';
    cron.schedule(heure, () => {
      void executerSauvegarde();
    });
    logger.info(`Sauvegarde planifiée activée (${heure}).`);
  }

  logger.info('Tâches planifiées démarrées (abonnements : démarrage + 03:00 quotidien).');
}

async function executerSauvegarde(): Promise<void> {
  try {
    const { fichier, purges } = await sauvegarderBase();
    logger.info({ fichier, purges }, '[backup] sauvegarde effectuée');
  } catch (error) {
    // Une tâche planifiée ne doit jamais faire tomber le serveur.
    logger.error({ err: error }, '[backup] échec');
  }
}

async function executerTraitementAbonnements(origine: string): Promise<void> {
  try {
    const resume = await traiterAbonnements();
    logger.info({ origine, expires: resume.expires, alertes: resume.alertes }, '[abonnements] traitement effectué');
  } catch (error) {
    // Une tâche planifiée ne doit jamais faire tomber le serveur.
    logger.error({ err: error, origine }, '[abonnements] échec du traitement');
  }
}

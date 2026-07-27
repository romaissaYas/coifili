import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as adminStatsService from '../services/adminStatsService';
import * as auditService from '../services/auditService';
import * as subscriptionService from '../services/subscriptionService';
import { logger } from '../utils/logger';

export async function stats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await adminStatsService.getDashboardStats());
  } catch (e) {
    logger.error({ err: e }, 'Admin stats :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function audit(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { action, userId, limit } = req.query;
    const logs = await auditService.listerAudit({
      action: typeof action === 'string' ? action : undefined,
      userId: userId ? Number(userId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(logs);
  } catch (e) {
    logger.error({ err: e }, 'Admin audit :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Déclenche manuellement le traitement des abonnements (expiration + alertes).
 * Utile pour forcer une vérification sans attendre le cron quotidien.
 */
export async function runSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const resume = await subscriptionService.traiterAbonnements();
    void auditService.logAction({
      userId: req.userId,
      action: 'SUBSCRIPTION_JOB_RUN',
      ip: req.ip,
      details: resume,
    });
    res.json({ message: 'Traitement des abonnements exécuté.', ...resume });
  } catch (e) {
    logger.error({ err: e }, 'Admin runSubscriptions :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

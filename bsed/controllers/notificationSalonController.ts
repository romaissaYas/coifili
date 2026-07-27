import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as service from '../services/notificationSalonService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  logger.error({ err: error }, `Notifications (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

/** Liste des notifications du salon + compteur de non lues (pour le badge). */
export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const salonId = req.salonId!;
    const [notifications, nonLues] = await Promise.all([
      service.listerNotifications(salonId),
      service.compterNonLues(salonId),
    ]);
    res.json({ notifications, nonLues });
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function marquerLue(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await service.marquerLue(req.salonId!, Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    fail(res, e, 'marquerLue');
  }
}

export async function marquerToutesLues(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await service.marquerToutesLues(req.salonId!);
    res.json({ ok: true });
  } catch (e) {
    fail(res, e, 'marquerToutesLues');
  }
}

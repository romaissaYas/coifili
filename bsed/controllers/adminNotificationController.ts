import { Request, Response } from 'express';
import * as service from '../services/adminNotificationService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  logger.error({ err: error }, `Notifications admin (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

/** GET /api/admin/notifications → { notifications, nonLues }. */
export async function lister(_req: Request, res: Response): Promise<void> {
  try {
    const [notifications, nonLues] = await Promise.all([
      service.listerNotificationsAdmin(),
      service.compterNonLuesAdmin(),
    ]);
    res.json({ notifications, nonLues });
  } catch (e) {
    fail(res, e, 'lister');
  }
}

/** PATCH /api/admin/notifications/:id/read */
export async function marquerLue(req: Request, res: Response): Promise<void> {
  try {
    await service.marquerLueAdmin(Number(req.params.id));
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (e) {
    fail(res, e, 'marquerLue');
  }
}

/** PATCH /api/admin/notifications/read-all */
export async function marquerToutesLues(_req: Request, res: Response): Promise<void> {
  try {
    await service.marquerToutesLuesAdmin();
    res.json({ message: 'Toutes les notifications sont marquées comme lues.' });
  } catch (e) {
    fail(res, e, 'marquerToutesLues');
  }
}

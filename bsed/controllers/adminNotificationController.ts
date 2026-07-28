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

/** GET /api/admin/notifications/page → liste paginée + filtres. */
export async function listerPage(req: Request, res: Response): Promise<void> {
  try {
    const { type, statut, q, tri, page, limit } = req.query;
    const data = await service.listerNotificationsAdminPage({
      type: typeof type === 'string' ? type : undefined,
      statut: typeof statut === 'string' ? statut : undefined,
      q: typeof q === 'string' ? q : undefined,
      tri: typeof tri === 'string' ? tri : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(data);
  } catch (e) {
    fail(res, e, 'listerPage');
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

/** DELETE /api/admin/notifications/:id */
export async function supprimer(req: Request, res: Response): Promise<void> {
  try {
    await service.supprimerNotificationAdmin(Number(req.params.id));
    res.json({ message: 'Notification supprimée.' });
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

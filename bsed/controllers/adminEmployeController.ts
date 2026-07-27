import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as adminEmployeService from '../services/adminEmployeService';
import * as auditService from '../services/auditService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Admin employe (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { salon_id, q } = req.query;
    const employes = await adminEmployeService.listerEmployes({
      salon_id: salon_id ? Number(salon_id) : undefined,
      q: typeof q === 'string' ? q : undefined,
    });
    res.json(employes);
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminEmployeService.supprimerEmploye(id);
    void auditService.logAction({
      userId: req.userId,
      action: 'EMPLOYE_DELETE',
      entityType: 'employe',
      entityId: id,
      ip: req.ip,
    });
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

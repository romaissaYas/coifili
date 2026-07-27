import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as adminReservationService from '../services/adminReservationService';
import * as auditService from '../services/auditService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Admin reservation (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

function audit(req: AuthenticatedRequest, action: string, entityId: number, details?: unknown): void {
  void auditService.logAction({
    userId: req.userId,
    action,
    entityType: 'rendezvous',
    entityId,
    ip: req.ip,
    details,
  });
}

export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { salon_id, statut, date, q, page, limit } = req.query;
    const reservations = await adminReservationService.listerReservations({
      salon_id: salon_id ? Number(salon_id) : undefined,
      statut: typeof statut === 'string' ? statut : undefined,
      date: typeof date === 'string' ? date : undefined,
      q: typeof q === 'string' ? q : undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    res.json(reservations);
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function changerStatut(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminReservationService.changerStatut(id, req.body?.statut);
    audit(req, 'RESERVATION_STATUS', id, { statut: req.body?.statut });
    res.json({ message: 'Statut mis à jour.' });
  } catch (e) {
    fail(res, e, 'changerStatut');
  }
}

export async function annuler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminReservationService.annuler(id);
    audit(req, 'RESERVATION_CANCEL', id);
    res.json({ message: 'Réservation annulée.' });
  } catch (e) {
    fail(res, e, 'annuler');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminReservationService.supprimer(id);
    audit(req, 'RESERVATION_DELETE', id);
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

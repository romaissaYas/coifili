import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as adminSalonService from '../services/adminSalonService';
import * as auditService from '../services/auditService';
import { logger } from '../utils/logger';

// Réponse d'erreur homogène (ServiceError -> statut porté, sinon 500).
function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Admin salon (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

// Journalise une action admin (fire-and-forget).
function audit(req: AuthenticatedRequest, action: string, entityId: number, details?: unknown): void {
  void auditService.logAction({
    userId: req.userId,
    action,
    entityType: 'salon',
    entityId,
    ip: req.ip,
    details,
  });
}

export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { statut, q, page, limit } = req.query;
    const salons = await adminSalonService.listerSalons({
      statut: typeof statut === 'string' ? statut : undefined,
      q: typeof q === 'string' ? q : undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    res.json(salons);
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function obtenir(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await adminSalonService.obtenirSalon(Number(req.params.id)));
  } catch (e) {
    fail(res, e, 'obtenir');
  }
}

export async function creer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { passwordConfirm, ...body } = req.body ?? {};
    if (passwordConfirm !== undefined && body.password !== passwordConfirm) {
      res.status(400).json({ error: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    const salon = await adminSalonService.creerSalonParAdmin(body);
    audit(req, 'SALON_CREATE', salon.id, { nom: salon.nom });
    res.status(201).json(salon);
  } catch (e) {
    fail(res, e, 'creer');
  }
}

export async function modifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const salon = await adminSalonService.modifierSalon(id, req.body);
    audit(req, 'SALON_UPDATE', id);
    res.json(salon);
  } catch (e) {
    fail(res, e, 'modifier');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminSalonService.supprimerSalon(id);
    audit(req, 'SALON_DELETE', id);
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

export async function valider(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const salon = await adminSalonService.validerSalon(id);
    audit(req, 'SALON_VALIDATE', id);
    res.json(salon);
  } catch (e) {
    fail(res, e, 'valider');
  }
}

export async function refuser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminSalonService.refuserSalon(id);
    audit(req, 'SALON_REFUSE', id);
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'refuser');
  }
}

export async function suspendre(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const salon = await adminSalonService.suspendreSalon(id);
    audit(req, 'SALON_SUSPEND', id);
    res.json(salon);
  } catch (e) {
    fail(res, e, 'suspendre');
  }
}

export async function reactiver(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const salon = await adminSalonService.reactiverSalon(id);
    audit(req, 'SALON_REACTIVATE', id);
    res.json(salon);
  } catch (e) {
    fail(res, e, 'reactiver');
  }
}

export async function abonnement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const salon = await adminSalonService.mettreAJourAbonnement(id, req.body);
    audit(req, 'SALON_SUBSCRIPTION_UPDATE', id, req.body);
    res.json(salon);
  } catch (e) {
    fail(res, e, 'abonnement');
  }
}

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as adminUserService from '../services/adminUserService';
import * as auditService from '../services/auditService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Admin user (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

function audit(req: AuthenticatedRequest, action: string, entityId: number, details?: unknown): void {
  void auditService.logAction({
    userId: req.userId,
    action,
    entityType: 'user',
    entityId,
    ip: req.ip,
    details,
  });
}

export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { role, statut, q, tri, page, limit } = req.query;
    const users = await adminUserService.listerUsers({
      role: typeof role === 'string' ? role : undefined,
      statut: typeof statut === 'string' ? statut : undefined,
      q: typeof q === 'string' ? q : undefined,
      tri: typeof tri === 'string' ? tri : undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    res.json(users);
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function obtenir(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await adminUserService.obtenirUser(Number(req.params.id)));
  } catch (e) {
    fail(res, e, 'obtenir');
  }
}

export async function modifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await adminUserService.modifierUser(id, req.body);
    audit(req, 'USER_UPDATE', id);
    res.json(user);
  } catch (e) {
    fail(res, e, 'modifier');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await adminUserService.supprimerUser(id, req.userId);
    audit(req, 'USER_DELETE', id);
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

export async function suspendre(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await adminUserService.suspendreUser(id, req.userId);
    audit(req, 'USER_SUSPEND', id);
    res.json(user);
  } catch (e) {
    fail(res, e, 'suspendre');
  }
}

export async function reactiver(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const user = await adminUserService.reactiverUser(id);
    audit(req, 'USER_REACTIVATE', id);
    res.json(user);
  } catch (e) {
    fail(res, e, 'reactiver');
  }
}

export async function reinitialiserMotDePasse(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const result = await adminUserService.reinitialiserMotDePasse(id, req.body?.newPassword);
    audit(req, 'USER_RESET_PASSWORD', id);
    res.json({
      message: 'Mot de passe réinitialisé.',
      ...(result.generated ? { temporaryPassword: result.password } : {}),
    });
  } catch (e) {
    fail(res, e, 'reinitialiserMotDePasse');
  }
}

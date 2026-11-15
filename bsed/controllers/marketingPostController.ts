import { Request, Response } from 'express';
import { ServiceError } from '../utils/ServiceError';
import * as service from '../services/marketingPostService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Marketing/posts (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

/** GET /api/admin/marketing/posts → liste paginée + filtres. */
export async function lister(req: Request, res: Response): Promise<void> {
  try {
    const { statut, q, tri, page, limit } = req.query;
    const data = await service.listerPosts({
      statut: typeof statut === 'string' ? statut : undefined,
      q: typeof q === 'string' ? q : undefined,
      tri: typeof tri === 'string' ? tri : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(data);
  } catch (e) {
    fail(res, e, 'lister');
  }
}

/** GET /api/admin/marketing/posts/stats → compteurs Dashboard. */
export async function stats(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await service.statistiquesPosts());
  } catch (e) {
    fail(res, e, 'stats');
  }
}

/** GET /api/admin/marketing/posts/:id */
export async function obtenir(req: Request, res: Response): Promise<void> {
  try {
    res.json(await service.obtenirPost(Number(req.params.id)));
  } catch (e) {
    fail(res, e, 'obtenir');
  }
}

/** POST /api/admin/marketing/posts */
export async function creer(req: Request, res: Response): Promise<void> {
  try {
    res.status(201).json(await service.creerPost(req.body));
  } catch (e) {
    fail(res, e, 'creer');
  }
}

/** PUT /api/admin/marketing/posts/:id */
export async function modifier(req: Request, res: Response): Promise<void> {
  try {
    res.json(await service.modifierPost(Number(req.params.id), req.body));
  } catch (e) {
    fail(res, e, 'modifier');
  }
}

/** DELETE /api/admin/marketing/posts/:id */
export async function supprimer(req: Request, res: Response): Promise<void> {
  try {
    await service.supprimerPost(Number(req.params.id));
    res.json({ message: 'Publication supprimée.' });
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

/** POST /api/admin/marketing/posts/:id/duplicate */
export async function dupliquer(req: Request, res: Response): Promise<void> {
  try {
    res.status(201).json(await service.dupliquerPost(Number(req.params.id)));
  } catch (e) {
    fail(res, e, 'dupliquer');
  }
}

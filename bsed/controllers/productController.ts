import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as productService from '../services/productService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Product (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

// --- Public ---
export async function listerPublies(req: Request, res: Response): Promise<void> {
  try {
    const { categorie, q, promo, salon_id, page, limit } = req.query;
    const produits = await productService.listerProduitsPublies({
      categorie: typeof categorie === 'string' ? categorie : undefined,
      q: typeof q === 'string' ? q : undefined,
      promo: promo === 'true' || promo === '1',
      salon_id: salon_id ? Number(salon_id) : undefined,
      // Pagination opt-in : transmise uniquement si présente (sinon tableau).
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    res.json(produits);
  } catch (e) {
    fail(res, e, 'listerPublies');
  }
}

export async function obtenirPublic(req: Request, res: Response): Promise<void> {
  try {
    res.json(await productService.obtenirProduitPublic(Number(req.params.id)));
  } catch (e) {
    fail(res, e, 'obtenirPublic');
  }
}

// --- Propriétaire du salon (req.salonId posé par requireSalonOwnership) ---
export async function listerMes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await productService.listerProduitsDuSalon(req.salonId!));
  } catch (e) {
    fail(res, e, 'listerMes');
  }
}

export async function creer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const produit = await productService.creerProduit(req.salonId!, req.body);
    res.status(201).json(produit);
  } catch (e) {
    fail(res, e, 'creer');
  }
}

export async function modifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const produit = await productService.modifierProduit(Number(req.params.id), req.salonId!, req.body);
    res.json(produit);
  } catch (e) {
    fail(res, e, 'modifier');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await productService.supprimerProduit(Number(req.params.id), req.salonId!);
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

export async function publier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await productService.changerStatutProduit(Number(req.params.id), req.salonId!, 'published'));
  } catch (e) {
    fail(res, e, 'publier');
  }
}

export async function depublier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await productService.changerStatutProduit(Number(req.params.id), req.salonId!, 'draft'));
  } catch (e) {
    fail(res, e, 'depublier');
  }
}

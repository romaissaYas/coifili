import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  userType?: string;
  salonId?: number;
}

interface JwtPayload {
  userId: number;
  userType: string;
}

/**
 * Vérifie le JWT envoyé dans l'en-tête Authorization (Bearer <token>) et pose
 * req.userId / req.userType. Ne fait jamais confiance à un userId envoyé par
 * le client dans le body ou la query : il est systématiquement recalculé ici.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    res.status(401).json({ error: 'Token invalide' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/**
 * Middleware d'autorisation par rôle, à utiliser après authMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userType || !roles.includes(req.userType)) {
      res.status(403).json({ error: 'Accès réservé à un autre type de compte.' });
      return;
    }
    next();
  };
}

/**
 * Autorise uniquement le Super Administrateur (rôle `super_admin`).
 * À utiliser après authMiddleware. Renvoie 403 pour tout autre compte.
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Résout le salon appartenant à l'utilisateur authentifié et pose req.salonId.
 * Le salonId n'est jamais lu depuis le body/query envoyé par le client : il
 * est recalculé à partir du userId du token. À utiliser après authMiddleware.
 */
export async function requireSalonOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT id, statut FROM salons WHERE userId = ?',
      [req.userId]
    );
    const salon = rows[0];
    if (!salon) {
      res.status(403).json({ error: "Aucun salon n'est associé à ce compte." });
      return;
    }
    // Verrou central du cycle de vie : les endpoints du salon ne sont
    // accessibles que si le salon est `actif` (ni en attente, ni suspendu,
    // ni expiré).
    if (salon.statut !== 'actif') {
      res.status(403).json({ error: "Votre salon n'est pas actif." });
      return;
    }
    req.salonId = salon.id;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors de la résolution du salon du compte :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Comme requireSalonOwnership mais SANS exiger que le salon soit `actif` :
 * pose req.salonId quel que soit le statut. Nécessaire pour les endpoints
 * d'abonnement (un salon `en_attente` doit pouvoir souscrire pour s'activer).
 * À utiliser après authMiddleware. N'altère pas requireSalonOwnership.
 */
export async function attachSalonOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>('SELECT id FROM salons WHERE userId = ?', [req.userId]);
    const salon = rows[0];
    if (!salon) {
      res.status(403).json({ error: "Aucun salon n'est associé à ce compte." });
      return;
    }
    req.salonId = salon.id;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Erreur attachSalonOwnership :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

type OwnedTable = 'produits' | 'prestations' | 'employes' | 'horaires' | 'rendezvous';

/**
 * Vérifie qu'une ressource identifiée par req.params[idParam] appartient bien
 * au salon de l'utilisateur authentifié (req.salonId, posé par
 * requireSalonOwnership). 404 si la ressource n'existe pas, 403 si elle
 * appartient à un autre salon. À utiliser après requireSalonOwnership.
 */
export function requireOwnedResource(table: OwnedTable, idParam: string = 'id') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params[idParam];
      const [rows] = await pool.execute<any[]>(
        `SELECT salon_id FROM ${table} WHERE id = ?`,
        [id]
      );
      const resource = rows[0];
      if (!resource) {
        res.status(404).json({ error: 'Ressource introuvable.' });
        return;
      }
      if (resource.salon_id !== req.salonId) {
        res.status(403).json({ error: "Vous n'avez pas accès à cette ressource." });
        return;
      }
      next();
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la vérification du propriétaire de la ressource :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

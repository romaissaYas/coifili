import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Renvoie l'identité de l'administrateur authentifié. Sert aussi de sonde de
 * garde : n'est accessible qu'avec un JWT valide ET le rôle super_admin
 * (sinon 401 / 403 en amont). Les fonctionnalités métier (salons, users,
 * réservations, stats, audit) seront ajoutées aux phases suivantes.
 */
export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({
    id: req.userId,
    userType: req.userType,
    role: 'super_admin',
  });
}

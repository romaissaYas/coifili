import express, { Request, Response } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireSalonOwnership, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateIdParam, prestationSchema } from '../validation';
import { logger } from '../utils/logger';

const router = express.Router();

// 🌐 Prestations publiques d'un salon (parcours de réservation client).
// Ne renvoie que des informations publiques (nom, prix, durée).
router.get('/salon/:salonId', validateIdParam('salonId'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nom, prix, duree FROM prestations WHERE salon_id = ?',
      [req.params.salonId]
    );
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors de la récupération des prestations publiques :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ➕ Ajout d'une prestation pour le salon de l'utilisateur authentifié
router.post(
  '/',
  authMiddleware,
  requireSalonOwnership,
  validateBody(prestationSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { nom, prix, duree } = req.body;

      await pool.execute(
        'INSERT INTO prestations (nom, prix, duree, salon_id) VALUES (?, ?, ?, ?)',
        [nom, prix, duree, req.salonId]
      );

      res.status(201).json({ message: 'Prestation ajoutée avec succès' });
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

// 📋 Liste des prestations du salon de l'utilisateur authentifié
router.get('/', authMiddleware, requireSalonOwnership, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // On ne sélectionne que les colonnes utiles au frontend.
    const [rows] = await pool.execute('SELECT id, nom, prix, duree FROM prestations WHERE salon_id = ?', [req.salonId]);
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors de la récupération des prestations :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

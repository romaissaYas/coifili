import express, { Response } from 'express';
import { pool } from '../db/pool';
import {
  authMiddleware,
  requireSalonOwnership,
  requireOwnedResource,
  AuthenticatedRequest,
} from '../middleware/auth';
import { validateBody, validateIdParam, produitSchema } from '../validation';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * ➕ Ajouter un produit au salon de l'utilisateur authentifié
 */
router.post(
  '/',
  authMiddleware,
  requireSalonOwnership,
  validateBody(produitSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { nom, prix } = req.body;

      const [result] = await pool.execute(
        'INSERT INTO produits (nom, prix, salon_id) VALUES (?, ?, ?)',
        [nom, prix, req.salonId]
      ) as any;

      res.status(201).json({
        message: 'Produit ajouté avec succès',
        id: result.insertId,
      });
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * 📦 Récupérer les produits du salon de l'utilisateur authentifié
 */
router.get('/', authMiddleware, requireSalonOwnership, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // On ne sélectionne que les colonnes utiles au frontend.
    const [rows] = await pool.execute('SELECT id, nom, prix FROM produits WHERE salon_id = ?', [req.salonId!]);
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erreur :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * 📦 Récupérer les produits d'un salon donné (uniquement si c'est le sien)
 */
router.get(
  '/salon/:id',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (Number(id) !== req.salonId) {
        res.status(403).json({ error: "Vous n'avez pas accès aux produits de ce salon." });
        return;
      }

      const [rows] = await pool.execute('SELECT id, nom, prix FROM produits WHERE salon_id = ?', [id]);
      res.status(200).json(rows);
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * ✏️ Modifier un produit (uniquement si le produit appartient au salon de l'utilisateur)
 */
router.put(
  '/:id',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  requireOwnedResource('produits'),
  validateBody(produitSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { nom, prix } = req.body;

      await pool.execute(
        'UPDATE produits SET nom = ?, prix = ? WHERE id = ?',
        [nom, prix, id]
      );

      res.status(200).json({ message: 'Produit modifié avec succès' });
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

/**
 * 🗑️ Supprimer un produit (uniquement si le produit appartient au salon de l'utilisateur)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  requireOwnedResource('produits'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await pool.execute('DELETE FROM produits WHERE id = ?', [id]);

      res.status(200).json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);

export default router;

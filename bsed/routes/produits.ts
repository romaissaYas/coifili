import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

/**
 * ➕ Ajouter un produit
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, prix, salon_id } = req.body;

    if (!nom || !prix || !salon_id) {
      res.status(400).json({ error: 'Nom, prix et salon_id sont obligatoires.' });
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO produits (nom, prix, salon_id) VALUES (?, ?, ?)',
      [nom, prix, salon_id]
    ) as any;

    res.status(201).json({
      message: 'Produit ajouté avec succès',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * 📦 Récupérer tous les produits
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute('SELECT * FROM produits');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * 📦 Récupérer les produits d’un salon
 */
router.get('/salon/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM produits WHERE salon_id = ?', [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * ✏️ Modifier un produit
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nom, prix } = req.body;

    if (!nom || !prix) {
      res.status(400).json({ error: 'Nom et prix sont obligatoires.' });
      return;
    }

    await pool.execute(
      'UPDATE produits SET nom = ?, prix = ? WHERE id = ?',
      [nom, prix, id]
    );

    res.status(200).json({ message: 'Produit modifié avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * 🗑️ Supprimer un produit
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM produits WHERE id = ?', [id]);

    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

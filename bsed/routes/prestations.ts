import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

// ➕ Ajout d'une prestation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nom, prix } = req.body;
    await pool.execute('INSERT INTO prestations (nom, prix) VALUES (?, ?)', [nom, prix]);
    res.status(201).json({ message: 'Prestation ajoutée avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 📋 Liste des prestations
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM prestations');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des prestations :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

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

export default router;

import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { jour, heure_debut, heure_fin } = req.body;
    await pool.execute(
      'INSERT INTO horaires (jour, heure_debut, heure_fin) VALUES (?, ?, ?)',
      [jour, heure_debut, heure_fin]
    );
    res.status(201).json({ message: 'Horaire ajouté avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

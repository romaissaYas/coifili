import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nom, poste } = req.body;
    await pool.execute('INSERT INTO employes (nom, poste) VALUES (?, ?)', [nom, poste]);
    res.status(201).json({ message: 'Employé ajouté avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

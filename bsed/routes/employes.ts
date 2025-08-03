import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

// Lister les employés
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM employes');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
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

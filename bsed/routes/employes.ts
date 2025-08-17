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
    const { nom, poste, salonId } = req.body as {
      nom?: string;
      poste?: string;
      salonId?: number;
    };

    const sql = 'INSERT INTO employes (nom, poste, salon_id) VALUES (?, ?, ?)';
await pool.execute(sql, [nom, poste, salonId]);

    res.status(201).json({ message: 'Employé ajouté avec succès' });  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});








export default router;

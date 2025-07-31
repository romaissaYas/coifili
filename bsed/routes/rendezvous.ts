import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { client_nom, prestation_id, date, heure } = req.body;
    await pool.execute(
      'INSERT INTO rendezvous (client_nom, prestation_id, date, heure) VALUES (?, ?, ?, ?)',
      [client_nom, prestation_id, date, heure]
    );
    res.status(201).json({ message: 'Rendez-vous enregistré avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

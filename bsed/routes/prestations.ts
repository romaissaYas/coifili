import express from 'express';
import { pool } from '../serveur';

const router = express.Router();

// ➕ Ajout d'une prestation
router.post('/', async (req, res): Promise<void> => {
  try {
    const { nom, prix, salonId } = req.body;

    // ✅ Vérification des champs
    if (!nom || !prix || !salonId) {
      res.status(400).json({ error: 'nom, prix et salonId sont requis' });
      return;
    }

    await pool.execute(
      'INSERT INTO prestations (nom, prix, salon_id) VALUES (?, ?, ?)',
      [nom, prix, salonId]
    );

    res.status(201).json({ message: 'Prestation ajoutée avec succès' });
  } catch (error) {
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 📋 Liste des prestations
router.get('/', async (_req, res): Promise<void> => {
  try {
    const [rows] = await pool.execute('SELECT * FROM prestations');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des prestations :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

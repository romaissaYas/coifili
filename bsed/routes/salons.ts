// routes/salons.ts
import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();
// Route POST pour ajouter un salon
// Route POST pour ajouter un salon
router.get("/salons", async (req, res) => {
  const { service, ville } = req.query;

  try {
    const [rows] = await pool.query(
      "SELECT nom AS name, ville, wilaya, type, categorie FROM salons WHERE categorie = ? AND ville LIKE ?",
      [service, `%${ville}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


router.post('/', async (req: Request, res: Response) => {
  try {
    // Extraction des champs envoyés dans le corps de la requête (ajout de 'type' et 'categorie')
    const { nom, email, telephone, message, wilaya, ville, type, categorie } = req.body;

    // Requête SQL : insertion dans la table 'salons' en incluant les nouveaux champs 'type' et 'categorie'
    await pool.execute(
      `INSERT INTO salons (nom, email, telephone, message, wilaya, ville, type, categorie)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, email, telephone, message, wilaya, ville, type, categorie]
    );

    // Envoi d'une réponse de succès
    res.status(201).json({ message: 'Salon ajouté avec succès' });
  } catch (error) {
    // En cas d'erreur, log de l'erreur dans la console et envoi d'une réponse d'erreur
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, categorie, wilaya, ville } = req.query;

    const conditions: string[] = [];
    const values: any[] = [];

    if (type) {
      conditions.push('type = ?');
      values.push(type);
    }

    if (categorie) {
      conditions.push('categorie = ?');
      values.push(categorie);
    }

    if (wilaya) {
      conditions.push('wilaya = ?');
      values.push(wilaya);
    }

    if (ville) {
      conditions.push('ville = ?');
      values.push(ville);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT * FROM salons ${whereClause}`,
      values
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


export default router;

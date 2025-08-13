// routes/salons.ts
import express, { NextFunction, Request, Response } from 'express';
import { pool } from '../serveur';
import jwt from 'jsonwebtoken';

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





interface AuthRequest extends Request {
  userId?: number;
}


export const authMiddleware = (req: AuthRequest, res: Response, next:NextFunction ) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token manquant' });
    return; // ✅ Ne pas retourner une valeur, juste arrêter
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    res.status(401).json({ error: 'Token invalide' });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'simmimi');
    req.userId = decoded.userId;
    next(); // ✅ Appeler next() sans rien retourner
  } catch (err) {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nom, email, telephone, message, wilaya, ville, type, categorie } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Utilisateur non identifié' });
      return; // ✅ juste return pour TypeScript
    }

    await pool.execute(
      `INSERT INTO salons (nom, email, telephone, message, wilaya, ville, type, categorie, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, email, telephone, message, wilaya, ville, type, categorie, userId]
    );

    res.status(201).json({ message: 'Salon ajouté avec succès', userId });
    return; // ✅ éviter le retour implicite
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
    return;
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

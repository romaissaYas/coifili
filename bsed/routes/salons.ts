// routes/salons.ts
import express, { Request, Response } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { validateBody, validateIdParam, salonSchema } from '../validation';
import { paginationDemandee, lirePagination, enveloppe } from '../utils/pagination';
import { logger } from '../utils/logger';

const router = express.Router();

// NOTE : l'ancienne route GET /api/salons/salons a été retirée (dette technique).
// Non référencée par le frontend (qui consomme GET /api/salons et GET /api/salons/:id)
// et elle exposait des salons non `actif`. La liste publique filtrée ci-dessous
// (GET /) la remplace intégralement.


router.post(
  '/',
  authMiddleware,
  requireRole('coiffeur'),
  validateBody(salonSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { nom, email, telephone, message, wilaya, ville, type, categorie, image } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Utilisateur non identifié' });
        return; // ✅ juste return pour TypeScript
      }

      await pool.execute(
        `INSERT INTO salons (nom, email, telephone, message, wilaya, ville, type, categorie, image, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nom, email, telephone, message ?? '', wilaya, ville, type, categorie, image ?? '', userId]
      );

      res.status(201).json({ message: 'Salon ajouté avec succès', userId });
      return; // ✅ éviter le retour implicite
    } catch (error) {
      logger.error({ err: error }, 'Erreur');
      res.status(500).json({ error: 'Erreur serveur' });
      return;
    }
  }
);







router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, categorie, wilaya, ville, nom } = req.query;

    // Le site public ne montre QUE les salons actifs (ni en attente de
    // validation, ni suspendus, ni expirés).
    const conditions: string[] = ["statut = 'actif'"];
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

    if (nom) {
      conditions.push('nom LIKE ?');
      values.push(`%${nom}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // On ne sélectionne que les colonnes utiles au frontend : userId (lien
    // interne vers le compte propriétaire) n'a aucune raison d'être exposé
    // publiquement.
    const selectCols = `SELECT id, nom, email, telephone, message, wilaya, ville, type, categorie, image FROM salons ${whereClause}`;

    // Pagination OPT-IN : sans ?page/?limit, comportement inchangé (tableau).
    if (paginationDemandee(req.query as Record<string, unknown>)) {
      const { page, limit, offset } = lirePagination(req.query as Record<string, unknown>);
      const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM salons ${whereClause}`, values);
      const [rows]: any = await pool.query(`${selectCols} ORDER BY id DESC LIMIT ? OFFSET ?`, [...values, limit, offset]);
      res.json(enveloppe(rows, Number(total), page, limit));
      return;
    }

    const [rows] = await pool.execute(selectCols, values);
    res.json(rows);
  } catch (err) {
    logger.error({ err: err }, 'Erreur');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fiche publique d'un salon. Enregistrée après GET '/salons' et GET '/' pour
// que ces routes littérales ne soient pas capturées par '/:id'. userId
// (colonne interne) n'est jamais exposé.
router.get('/:id', validateIdParam('id'), async (req: Request, res: Response) => {
  try {
    // Fiche publique : seuls les salons actifs sont consultables (un salon en
    // attente / suspendu / expiré ne doit pas être visible ni réservable).
    const [rows] = await pool.execute(
      `SELECT id, nom, email, telephone, message, wilaya, ville, type, categorie, image
       FROM salons WHERE id = ? AND statut = 'actif'`,
      [req.params.id]
    );
    const salon = (rows as any[])[0];
    if (!salon) {
      res.status(404).json({ error: 'Salon introuvable.' });
      return;
    }
    res.json(salon);
  } catch (err) {
    logger.error({ err: err }, 'Erreur');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


export default router;

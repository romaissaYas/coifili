import express, { Request, Response } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireSalonOwnership, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateIdParam, employeSchema } from '../validation';
import { trouverProchaineDisponibilite } from '../utils/disponibilite';
import { logger } from '../utils/logger';

const router = express.Router();

// 🌐 Employés publics d'un salon (parcours de réservation client).
// Ne renvoie que des informations publiques (nom, poste).
router.get('/salon/:salonId', validateIdParam('salonId'), async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nom, poste FROM employes WHERE salon_id = ?',
      [req.params.salonId]
    );
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors de la récupération des employés publics :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lister les employés du salon de l'utilisateur authentifié
router.get('/', authMiddleware, requireSalonOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // On ne sélectionne que les colonnes utiles au frontend.
    const [rows] = await pool.execute('SELECT id, nom, poste FROM employes WHERE salon_id = ?', [req.salonId!]);
    res.status(200).json(rows);
  } catch (error) {
    logger.error({ err: error }, 'Erreur :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Employés du salon enrichis de leurs statistiques (nombre de RDV, chiffre
// d'affaires généré, prochaine disponibilité). Route dédiée pour ne pas
// alourdir GET /api/employes (utilisée ailleurs pour un simple sélecteur).
router.get('/stats', authMiddleware, requireSalonOwnership, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [employes]: any = await pool.execute(
      `SELECT e.id, e.nom, e.poste,
              COUNT(r.id) AS rdv_count,
              COALESCE(SUM(r.prix), 0) AS revenue
       FROM employes e
       LEFT JOIN rendezvous r ON r.employe_id = e.id AND r.statut != 'annule'
       WHERE e.salon_id = ?
       GROUP BY e.id, e.nom, e.poste`,
      [req.salonId!]
    );

    const employesAvecDispo = await Promise.all(
      employes.map(async (employe: any) => ({
        ...employe,
        prochaine_disponibilite: await trouverProchaineDisponibilite(req.salonId!, employe.id),
      }))
    );

    res.status(200).json(employesAvecDispo);
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors du calcul des statistiques employés :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un employé au salon de l'utilisateur authentifié
router.post(
  '/',
  authMiddleware,
  requireSalonOwnership,
  validateBody(employeSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { nom, poste } = req.body as { nom: string; poste: string };

      const sql = 'INSERT INTO employes (nom, poste, salon_id) VALUES (?, ?, ?)';
      await pool.execute(sql, [nom, poste, req.salonId!]);

      res.status(201).json({ message: 'Employé ajouté avec succès' });
    } catch (error) {
      logger.error({ err: error }, 'Erreur :');
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
);








export default router;

import express, { Request, Response } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, requireSalonOwnership, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateIdParam, horaireSchema } from '../validation';
import { isValidCreneau } from '../utils/dateTime';
import { logger } from '../utils/logger';

const router = express.Router();

// ➕ Ajouter ou mettre à jour un horaire pour le salon de l'utilisateur authentifié
// Le salon concerné est déterminé à partir du token (req.salonId), jamais depuis le body.
router.post(
  '/',
  authMiddleware,
  requireSalonOwnership,
  validateBody(horaireSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { jour, ouvert, creneaux } = req.body;

  if (ouvert && creneaux !== undefined) {
    if (!Array.isArray(creneaux) || !creneaux.every(isValidCreneau)) {
      res.status(400).json({
        error: "creneaux doit être une liste de créneaux valides ({ debut, fin } au format HH:MM, avec debut < fin).",
      });
      return;
    }
  }

  const conn = await pool.getConnection();
  try {
    const salonId = req.salonId;

    await conn.beginTransaction();

    const [rows]: any = await conn.execute(
      'SELECT id FROM horaires WHERE jour = ? AND salon_id = ?',
      [jour, salonId]
    );

    let horaireId;

    if (rows.length > 0) {
      horaireId = rows[0].id;
      await conn.execute('DELETE FROM creneaux WHERE horaire_id = ?', [horaireId]);
      await conn.execute('UPDATE horaires SET ouvert = ? WHERE id = ?', [
        ouvert ? 1 : 0,
        horaireId,
      ]);
    } else {
      const [result]: any = await conn.execute(
        'INSERT INTO horaires (jour, ouvert, salon_id) VALUES (?, ?, ?)',
        [jour, ouvert ? 1 : 0, salonId]
      );
      horaireId = result.insertId;
    }

    if (ouvert && Array.isArray(creneaux)) {
      for (const { debut, fin } of creneaux) {
        await conn.execute(
          'INSERT INTO creneaux (horaire_id, heure_debut, heure_fin) VALUES (?, ?, ?)',
          [horaireId, debut, fin]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'Horaires mis à jour avec succès' });
  } catch (error) {
    await conn.rollback();
    logger.error({ err: error }, 'Erreur :');
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// ➕ Récupérer tous les jours avec leurs créneaux pour un salon (route publique)
router.get('/:salon_id', validateIdParam('salon_id'), async (req: Request, res: Response) => {
  try {
    const { salon_id } = req.params;
    // id/horaire_id ne servent qu'à faire le lien ci-dessous ; on ne renvoie
    // au frontend que les colonnes utiles (jour, ouvert, créneaux).
    const [jours]: any = await pool.execute('SELECT id, jour, ouvert FROM horaires WHERE salon_id = ?', [salon_id]);
    // IN (?) avec un tableau nécessite pool.query (protocole texte) : avec
    // pool.execute (requêtes préparées), mysql2 n'étend pas le tableau et
    // renvoie silencieusement un résultat vide — c'était le bug empêchant les
    // créneaux d'être relus après enregistrement.
    const [creneaux]: any = jours.length > 0
      ? await pool.query(
          `SELECT horaire_id, heure_debut, heure_fin FROM creneaux WHERE horaire_id IN (?)`,
          [jours.map((j: any) => j.id)]
        )
      : [[]];

    const data = jours.map((jour: any) => ({
      jour: jour.jour,
      ouvert: jour.ouvert,
      creneaux: creneaux
        .filter((c: any) => c.horaire_id === jour.id)
        .map((c: any) => ({ debut: c.heure_debut, fin: c.heure_fin })),
    }));

    res.status(200).json(data);
  } catch (error) {
    logger.error({ err: error }, 'Erreur lors de la récupération des horaires :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

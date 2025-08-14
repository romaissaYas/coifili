import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

// ➕ Ajouter ou mettre à jour un horaire avec salon_id
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const conn = await pool.getConnection();
  try {
    const { jour, ouvert, creneaux, salonId } = req.body;

    if (!salonId) {
      res.status(400).json({ error: 'salon_id est requis' });
      return;
    }

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
    console.error('Erreur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// ➕ Récupérer tous les jours avec leurs créneaux pour un salon
router.get('/:salon_id', async (req: Request, res: Response) => {
  try {
    const { salon_id } = req.params;
    const [jours]: any = await pool.execute('SELECT * FROM horaires WHERE salon_id = ?', [salon_id]);
    const [creneaux]: any = await pool.execute(
      `SELECT * FROM creneaux WHERE horaire_id IN (?)`,
      [jours.map((j: any) => j.id)]
    );

    const data = jours.map((jour: any) => ({
      ...jour,
      creneaux: creneaux
        .filter((c: any) => c.horaire_id === jour.id)
        .map((c: any) => ({ debut: c.heure_debut, fin: c.heure_fin })),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

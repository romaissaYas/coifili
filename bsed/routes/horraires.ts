import express, { Request, Response } from 'express';
import { pool } from '../serveur';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { jour, ouvert, creneaux } = req.body;

    await conn.beginTransaction();

    const [rows]: any = await conn.execute(
      'SELECT id FROM horaires WHERE jour = ?',
      [jour]
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
        'INSERT INTO horaires (jour, ouvert) VALUES (?, ?)',
        [jour, ouvert ? 1 : 0]
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

// ➕ Récupérer tous les jours avec leurs créneaux
router.get('/', async (req: Request, res: Response) => {
  try {
    const [jours]: any = await pool.execute('SELECT * FROM horaires');
    const [creneaux]: any = await pool.execute('SELECT * FROM creneaux');

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
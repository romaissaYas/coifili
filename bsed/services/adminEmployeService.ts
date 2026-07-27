import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';

/** Consultation transverse des employés (tous salons) par le Super Admin. */

/** Liste les employés, filtrable par salon et recherche (nom/poste). */
export async function listerEmployes(filtres: { salon_id?: number; q?: string }) {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.salon_id) {
    conditions.push('e.salon_id = ?');
    values.push(filtres.salon_id);
  }
  if (filtres.q) {
    conditions.push('(e.nom LIKE ? OR e.poste LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT e.id, e.nom, e.poste, e.salon_id, s.nom AS salon_nom
     FROM employes e
     LEFT JOIN salons s ON s.id = e.salon_id
     ${where}
     ORDER BY e.id DESC`,
    values
  );
  return rows;
}

/** Supprime un employé. */
export async function supprimerEmploye(id: number): Promise<void> {
  const [res]: any = await pool.execute('DELETE FROM employes WHERE id = ?', [id]);
  if (res.affectedRows === 0) throw new ServiceError(404, 'Employé introuvable.');
}

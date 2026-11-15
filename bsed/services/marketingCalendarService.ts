import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';

/**
 * Calendrier éditorial du module Marketing : agrège les contenus PROGRAMMÉS /
 * datés (publications, reels, stories) sur une plage, et permet de les
 * reprogrammer (drag-and-drop côté UI). Additif : lit les tables existantes,
 * met à jour uniquement `date_publication` (+ passe en `programme`).
 */

const TABLES: Record<string, { table: string; titre: string }> = {
  post: { table: 'ig_posts', titre: 'titre' },
  reel: { table: 'ig_reels', titre: "COALESCE(titre, 'Reel')" },
  story: { table: 'ig_stories', titre: "COALESCE(texte, 'Story')" },
};

function normaliserDate(valeur: string): string | null {
  const s = String(valeur).replace('T', ' ').slice(0, 19);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valeur))) return `${valeur} 09:00:00`;
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s) ? s : null;
}

/** Liste les contenus datés dans [from, to) (bornes 'YYYY-MM-DD'). */
export async function listerCalendrier(from: string, to: string) {
  const items: { type: string; table: string; titre: string }[] = Object.entries(TABLES).map(
    ([type, v]) => ({ type, table: v.table, titre: v.titre })
  );
  const selects = items.map(
    (i) => `SELECT id, '${i.type}' AS type, ${i.titre} AS titre, date_publication, statut
            FROM ${i.table} WHERE date_publication >= ? AND date_publication < ?`
  );
  const values: string[] = [];
  items.forEach(() => values.push(`${from} 00:00:00`, `${to} 00:00:00`));
  const [rows]: any = await pool.query(`${selects.join(' UNION ALL ')} ORDER BY date_publication ASC`, values);
  return rows;
}

/** Reprogramme un contenu (nouvelle date) et le passe en « programme ». */
export async function reprogrammer(type: string, id: number, date: string) {
  const cfg = TABLES[type];
  if (!cfg) throw new ServiceError(400, 'Type de contenu invalide.');
  const dt = normaliserDate(date);
  if (!dt) throw new ServiceError(400, 'Date invalide.');

  const [rows]: any = await pool.query(`SELECT id FROM ${cfg.table} WHERE id = ?`, [id]);
  if (!rows[0]) throw new ServiceError(404, 'Contenu introuvable.');

  await pool.execute(
    `UPDATE ${cfg.table} SET date_publication = ?, statut = 'programme' WHERE id = ?`,
    [dt, id]
  );
  return { type, id, date_publication: dt, statut: 'programme' };
}

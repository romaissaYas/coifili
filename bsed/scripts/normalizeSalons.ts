import 'dotenv/config';
import { pool } from '../db/pool';

/**
 * Normalisation IDEMPOTENTE des données salon (aucune perte d'information).
 * À lancer via `npm run normalize:salons`. Rejouable sans risque.
 *
 *  - type      : casse uniquement -> minuscule ('Femme'->'femme', 'Homme'->'homme',
 *                'Mixte'->'mixte'). On NE fusionne PAS 'mixte' avec 'femme' :
 *                un salon mixte reste un salon mixte.
 *  - categorie : 'coiffure' -> 'coiffeur' (valeur unique cohérente partout).
 *  - wilaya    : valeur invalide 'algerie'/'Algerie' -> 'Alger', et la ville
 *                générique 'alger' -> commune 'Alger Centre'.
 */
async function main(): Promise<void> {
  const [t]: any = await pool.query('UPDATE salons SET type = LOWER(type)');
  const [c]: any = await pool.query(
    "UPDATE salons SET categorie = 'coiffeur' WHERE categorie = 'coiffure'"
  );
  const [w]: any = await pool.query(
    "UPDATE salons SET wilaya = 'Alger', ville = 'Alger Centre' WHERE LOWER(wilaya) = 'algerie'"
  );

  console.log('Normalisation des salons terminée :');
  console.log(`  - type (casse minuscule) : ${t.changedRows ?? t.affectedRows} ligne(s) modifiée(s)`);
  console.log(`  - categorie coiffure -> coiffeur : ${c.affectedRows} ligne(s)`);
  console.log(`  - wilaya algerie -> Alger / ville alger -> Alger Centre : ${w.affectedRows} ligne(s)`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Échec de la normalisation :', err);
  process.exit(1);
});

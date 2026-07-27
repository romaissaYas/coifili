import 'dotenv/config';
import { pool } from '../db/pool';
import { initializeDb } from '../db/schema';
import { getValidationErrors, prestationSchema, productSchema } from '../validation';
import { creerProduit } from '../services/productService';

/**
 * Insère des DONNÉES DE DÉMONSTRATION réalistes (prestations + produits boutique)
 * dans un ou plusieurs salons, de façon IDEMPOTENTE et NON DESTRUCTIVE.
 *
 * Principes (zéro régression) :
 *  - Aucune table/route/validation existante n'est modifiée : on réutilise les
 *    mêmes schémas de validation (prestationSchema, productSchema) et le même
 *    service que la création manuelle (creerProduit), donc la même logique.
 *  - INSERT uniquement ; jamais de DELETE/UPDATE. Les doublons sont évités par
 *    comparaison du `nom` (par salon) : relancer le script ne crée aucun doublon.
 *  - Les images pointent vers des assets déjà présents dans le frontend
 *    (`/img/bgN.jpg`), donc libres et affichés de façon fiable, sans upload.
 *
 * Cible (résolue dans cet ordre) :
 *   --salon=<id|email>  ou  SEED_SALON=<id|email>   → ce salon précis
 *   --all               ou  SEED_ALL=1              → tous les salons actifs
 *   (défaut)                                        → tous les salons actifs
 *
 * Lancement : `npm run seed:demo` (voir bsed/package.json).
 */

// Prestations : le schéma réel ne contient que nom / prix / duree (minutes).
// (Les champs description/catégorie/image n'existent pas sur la table
// `prestations` ; on ne seed donc que ce que le système prend en charge.)
const PRESTATIONS = [
  { nom: 'Coupe Femme', prix: 35, duree: 45 },
  { nom: 'Coloration Complète', prix: 75, duree: 120 },
  { nom: 'Brushing', prix: 25, duree: 30 },
  { nom: 'Taille de Barbe', prix: 18, duree: 20 },
];

// Produits boutique (table `products`) : champs riches supportés. `categorie`
// doit appartenir à l'enum PRODUCT_CATEGORIES — tous ces articles capillaires
// relèvent de « cheveux ». Images = assets publics du frontend.
const PRODUITS = [
  {
    nom: 'Shampooing Professionnel Réparateur',
    marque: "L'Oréal Professionnel",
    description: 'Shampooing réparateur pour cheveux abîmés enrichi en kératine.',
    categorie: 'cheveux',
    prix: 19.9,
    stock: 25,
    images: ['/img/bg1.jpg'],
  },
  {
    nom: 'Masque Nutrition Intense',
    marque: 'Kérastase',
    description: 'Masque nourrissant pour cheveux secs et sensibilisés.',
    categorie: 'cheveux',
    prix: 34.9,
    stock: 18,
    images: ['/img/bg2.jpg'],
  },
  {
    nom: 'Huile Capillaire Argan',
    marque: 'Moroccanoil',
    description: 'Huile nourrissante apportant brillance et protection contre les frisottis.',
    categorie: 'cheveux',
    prix: 29.9,
    stock: 15,
    images: ['/img/bg3.jpg'],
  },
  {
    nom: 'Gel Coiffant Fixation Forte',
    marque: 'American Crew',
    description: 'Gel coiffant offrant une fixation longue durée sans résidus.',
    categorie: 'cheveux',
    prix: 16.9,
    stock: 30,
    images: ['/img/bg4.jpg'],
  },
];

type Salon = { id: number; nom: string };

/** Résout les salons cibles selon les arguments / variables d'environnement. */
async function resoudreSalons(): Promise<Salon[]> {
  const argSalon = process.argv.find((a) => a.startsWith('--salon='))?.split('=')[1];
  const cible = argSalon ?? process.env.SEED_SALON;

  if (cible) {
    const parId = /^\d+$/.test(cible);
    const [rows]: any = await pool.query(
      `SELECT id, nom FROM salons WHERE ${parId ? 'id = ?' : 'email = ?'}`,
      [cible]
    );
    if (rows.length === 0) throw new Error(`Aucun salon trouvé pour « ${cible} ».`);
    return rows;
  }

  // Défaut (et --all / SEED_ALL) : tous les salons actifs.
  const [rows]: any = await pool.query("SELECT id, nom FROM salons WHERE statut = 'actif' ORDER BY id");
  return rows;
}

/** Insère les prestations manquantes du salon (idempotent par nom). */
async function seedPrestations(salonId: number): Promise<{ crees: number; ignores: number }> {
  let crees = 0;
  let ignores = 0;
  for (const p of PRESTATIONS) {
    // Respecte EXACTEMENT les validations de la création manuelle.
    const erreurs = getValidationErrors(p, prestationSchema);
    if (Object.keys(erreurs).length > 0) {
      throw new Error(`Prestation « ${p.nom} » invalide : ${JSON.stringify(erreurs)}`);
    }
    const [dup]: any = await pool.query(
      'SELECT id FROM prestations WHERE salon_id = ? AND nom = ? LIMIT 1',
      [salonId, p.nom]
    );
    if (dup.length > 0) {
      ignores++;
      continue;
    }
    // Même INSERT que la route POST /api/prestations.
    await pool.execute(
      'INSERT INTO prestations (nom, prix, duree, salon_id) VALUES (?, ?, ?, ?)',
      [p.nom, p.prix, p.duree, salonId]
    );
    crees++;
  }
  return { crees, ignores };
}

/** Insère les produits boutique manquants du salon (idempotent par nom). */
async function seedProduits(salonId: number): Promise<{ crees: number; ignores: number }> {
  let crees = 0;
  let ignores = 0;
  for (const p of PRODUITS) {
    const data = { ...p, disponibilite: true, statut: 'published' as const };
    // Respecte EXACTEMENT les validations de la création manuelle.
    const erreurs = getValidationErrors(data, productSchema);
    if (Object.keys(erreurs).length > 0) {
      throw new Error(`Produit « ${p.nom} » invalide : ${JSON.stringify(erreurs)}`);
    }
    const [dup]: any = await pool.query(
      'SELECT id FROM products WHERE salon_id = ? AND nom = ? LIMIT 1',
      [salonId, p.nom]
    );
    if (dup.length > 0) {
      ignores++;
      continue;
    }
    // Réutilise le service de création manuelle (publie le produit).
    await creerProduit(salonId, data);
    crees++;
  }
  return { crees, ignores };
}

async function main(): Promise<void> {
  await initializeDb(); // garantit l'existence des tables (prestations, products)

  const salons = await resoudreSalons();
  if (salons.length === 0) {
    console.log('ℹ️  Aucun salon cible. Rien à faire.');
    await pool.end();
    return;
  }

  console.log(`🌱 Seed de démonstration sur ${salons.length} salon(s)…\n`);
  let totPrestC = 0;
  let totPrestI = 0;
  let totProdC = 0;
  let totProdI = 0;

  for (const s of salons) {
    const pr = await seedPrestations(s.id);
    const pd = await seedProduits(s.id);
    totPrestC += pr.crees;
    totPrestI += pr.ignores;
    totProdC += pd.crees;
    totProdI += pd.ignores;
    console.log(
      `  • [${s.id}] ${s.nom} — prestations: +${pr.crees} (${pr.ignores} déjà présentes) · produits: +${pd.crees} (${pd.ignores} déjà présents)`
    );
  }

  console.log(
    `\n✅ Terminé. Prestations créées: ${totPrestC} (ignorées: ${totPrestI}) · Produits créés: ${totProdC} (ignorés: ${totProdI}).`
  );
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Échec du seed de démonstration :', err);
  process.exit(1);
});

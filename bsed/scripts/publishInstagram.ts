import 'dotenv/config';
import { pool } from '../db/pool';
import { initializeDb } from '../db/schema';
import { obtenirConnexion } from '../services/metaOAuthService';
import { publierInstagram } from '../services/metaPublishService';

/**
 * Publie en LOT les publications Coifili sur Instagram via l'API officielle de
 * Meta. Ne s'exécute QUE si META_ACCESS_TOKEN est configuré (sinon arrêt net,
 * rien n'est simulé). Publie les posts non encore publiés qui ont une image.
 *
 * Usage :
 *   npm run publish:instagram            → publie les 'programme' (par défaut)
 *   npm run publish:instagram -- --all   → publie tous les non 'publie'
 *
 * Prérequis : compte IG Business + Page FB liée ; META_ACCESS_TOKEN,
 * META_IG_BUSINESS_ID ; images en URL publique (PUBLIC_SITE_URL si /img/...).
 */
const PAUSE_MS = 3000; // délai entre publications (traitement Meta + rate limit)
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await initializeDb();
  const conn = await obtenirConnexion();
  if (!conn.connected) {
    console.error("❌ Publication impossible : aucun compte Meta connecté. Connectez votre Page/Instagram depuis Admin → Marketing → Paramètres.");
    process.exit(1);
  }
  const tout = process.argv.includes('--all');
  const where = tout ? "statut <> 'publie'" : "statut = 'programme'";
  const [rows]: any = await pool.query(
    `SELECT id, titre FROM ig_posts WHERE ${where} AND image_url IS NOT NULL AND image_url <> '' ORDER BY date_publication IS NULL, date_publication ASC, id ASC`
  );

  if (rows.length === 0) {
    console.log(`ℹ️ Aucune publication à publier (${tout ? 'non publiées' : "statut 'programme'"}).`);
    await pool.end();
    return;
  }

  console.log(`🚀 ${rows.length} publication(s) à publier sur Instagram…\n`);
  let ok = 0, echecs = 0;
  for (const p of rows) {
    try {
      const res = await publierInstagram(p.id);
      ok++;
      console.log(`  ✅ [${p.id}] ${p.titre} → publié (media ${res.meta_media_id})`);
    } catch (e: any) {
      echecs++;
      console.log(`  ❌ [${p.id}] ${p.titre} → ${e?.message ?? e}`);
    }
    await pause(PAUSE_MS);
  }

  console.log(`\nTerminé : ${ok} publiée(s), ${echecs} échec(s).`);
  await pool.end();
}

main().catch((e) => { console.error('❌', e); process.exit(1); });

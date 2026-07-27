import { spawn } from 'child_process';
import { createGzip } from 'zlib';
import { createWriteStream, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import path from 'path';
import { env } from '../config/env';

/**
 * Sauvegarde de la base de données (mysqldump → gzip), avec rotation.
 *
 * Non destructif : lecture seule côté base (dump), écriture uniquement dans le
 * dossier de sauvegarde. Piloté par l'environnement :
 *   BACKUP_DIR             (défaut ./backups)
 *   BACKUP_RETENTION_DAYS  (défaut 7 ; 0 = pas de purge)
 *   MYSQLDUMP_PATH         (défaut "mysqldump" ; chemin de l'exécutable)
 *
 * `mysqldump` doit être disponible (client MySQL). Utilisé par `npm run
 * backup:db` et, optionnellement, par le cron (voir jobs/scheduler.ts).
 */

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS ?? 7);
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || 'mysqldump';

function horodatage(): string {
  // 2026-07-27T14-05-09 (sûr pour un nom de fichier, trié chronologiquement).
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
}

/** Supprime les sauvegardes plus anciennes que la rétention configurée. */
function purgerAnciennes(): number {
  if (!RETENTION_DAYS || RETENTION_DAYS <= 0) return 0;
  const limite = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let supprimes = 0;
  for (const f of readdirSync(BACKUP_DIR)) {
    if (!f.startsWith('coifili-') || !f.endsWith('.sql.gz')) continue;
    const complet = path.join(BACKUP_DIR, f);
    if (statSync(complet).mtimeMs < limite) {
      unlinkSync(complet);
      supprimes++;
    }
  }
  return supprimes;
}

/**
 * Effectue une sauvegarde. Résout la promesse avec le chemin du fichier créé,
 * ou la rejette si mysqldump échoue (aucun fichier partiel n'est conservé).
 */
export function sauvegarderBase(): Promise<{ fichier: string; purges: number }> {
  return new Promise((resolve, reject) => {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const fichier = path.join(BACKUP_DIR, `coifili-${horodatage()}.sql.gz`);

    // Arguments passés en tableau (jamais via un shell) : pas d'injection.
    const args = [
      `-h${env.db.host}`,
      `-u${env.db.user}`,
      ...(env.db.password ? [`-p${env.db.password}`] : []),
      '--single-transaction', // dump cohérent sans verrouiller les tables (InnoDB)
      '--quick',
      '--routines',
      env.db.database,
    ];

    const dump = spawn(MYSQLDUMP, args);
    const gzip = createGzip();
    const sortie = createWriteStream(fichier);
    let stderr = '';

    dump.stderr.on('data', (c) => (stderr += c.toString()));
    dump.on('error', (e) =>
      reject(new Error(`Impossible de lancer mysqldump (${MYSQLDUMP}) : ${e.message}`))
    );
    dump.on('close', (code) => {
      if (code !== 0) {
        try { unlinkSync(fichier); } catch { /* fichier absent : rien à nettoyer */ }
        reject(new Error(`mysqldump a échoué (code ${code}) : ${stderr.trim()}`));
      }
    });

    dump.stdout.pipe(gzip).pipe(sortie);
    sortie.on('finish', () => {
      // `close` (code 0) et `finish` peuvent arriver dans un ordre variable ;
      // si le code de sortie était non nul, le reject ci-dessus a déjà agi.
      const purges = purgerAnciennes();
      resolve({ fichier, purges });
    });
    sortie.on('error', reject);
  });
}

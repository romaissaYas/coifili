import 'dotenv/config';
import { sauvegarderBase } from '../services/backupService';

/**
 * Sauvegarde manuelle de la base (mysqldump → gzip, avec rotation).
 * Lancement : `npm run backup:db`. Voir services/backupService pour la config
 * (BACKUP_DIR, BACKUP_RETENTION_DAYS, MYSQLDUMP_PATH).
 */
sauvegarderBase()
  .then(({ fichier, purges }) => {
    console.log(`✅ Sauvegarde créée : ${fichier}${purges ? ` (${purges} ancienne(s) purgée(s))` : ''}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Échec de la sauvegarde :', err.message);
    process.exit(1);
  });

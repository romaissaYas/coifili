import pino from 'pino';

/**
 * Logger structuré unique de l'application (JSON en production, lisible en dev).
 *
 * - Niveau piloté par LOG_LEVEL (défaut : `debug` en dev explicite, `info`
 *   sinon).
 * - En développement, `pino-pretty` embellit la sortie s'il est installé ;
 *   sinon on retombe silencieusement sur le JSON standard (aucune erreur).
 * - Remplace les `console.log/error` dispersés : niveaux, horodatage et
 *   corrélation de requête (voir pino-http dans serveur.ts) deviennent
 *   exploitables par un agrégateur (Loki, Datadog, CloudWatch...).
 */
const isDev = process.env.TS_NODE_DEV === 'true' || (process.argv[1] ?? '').endsWith('.ts');
const level = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

function transportDev(): pino.TransportSingleOptions | undefined {
  if (!isDev) return undefined;
  try {
    // Présent uniquement si pino-pretty est installé (devDependency optionnelle).
    require.resolve('pino-pretty');
    return { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } };
  } catch {
    return undefined; // pas de pretty : JSON standard, sans planter
  }
}

export const logger = pino({
  level,
  // Ne jamais journaliser de secrets si un objet les contient par mégarde.
  redact: ['req.headers.authorization', 'password', '*.password', 'token', '*.token'],
  transport: transportDev(),
});

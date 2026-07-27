import * as Sentry from '@sentry/node';
import { logger } from './logger';

/**
 * Suivi d'erreurs (Sentry) — OPT-IN et sans effet si `SENTRY_DSN` est absent.
 * Aucune donnée n'est envoyée par défaut : en local et sans configuration, tout
 * ceci est neutre. Quand le DSN est fourni, les exceptions non gérées
 * remontées par le handler d'erreurs Express sont capturées.
 */
let actif = false;

export function initMonitoring(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // désactivé : aucun appel réseau, aucun overhead
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
  actif = true;
  logger.info('Suivi Sentry activé.');
}

/** Capture une exception si Sentry est actif ; sinon ne fait rien. */
export function capturerException(err: unknown): void {
  if (actif) Sentry.captureException(err);
}

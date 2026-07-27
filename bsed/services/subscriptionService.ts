import { pool } from '../db/pool';
import * as auditService from './auditService';
import { notificationService } from './notificationService';

/**
 * Traitement quotidien des abonnements salon :
 *   1. EXPIRATION : tout salon `actif` dont `abonnement_fin < aujourd'hui`
 *      passe `expire`. AUCUNE réactivation automatique : seul l'admin peut
 *      réactiver (Phase 2). Chaque expiration est auditée et notifiée.
 *   2. ALERTES : rappel envoyé aux paliers 30/15/7/3/1 jours avant la fin
 *      (correspondance de jour EXACTE : exécuté une fois par jour, chaque
 *      palier ne se déclenche donc qu'une seule fois, sans table de dédup).
 *
 * Idempotent et sûr à rejouer. Renvoie un résumé pour la journalisation/tests.
 */
const PALIERS_ALERTE = [30, 15, 7, 3, 1];

export async function traiterAbonnements(): Promise<{ expires: number; alertes: number }> {
  // 1) Expirations
  const [aExpirer]: any = await pool.query(
    `SELECT id, nom, email, abonnement_fin
     FROM salons
     WHERE statut = 'actif' AND abonnement_fin IS NOT NULL AND abonnement_fin < CURDATE()`
  );

  for (const salon of aExpirer) {
    await pool.execute("UPDATE salons SET statut = 'expire' WHERE id = ?", [salon.id]);
    // Auteur système (userId null) : ce n'est pas une action d'un admin.
    await auditService.logAction({
      userId: null,
      action: 'SUBSCRIPTION_EXPIRED',
      entityType: 'salon',
      entityId: salon.id,
      details: { abonnement_fin: salon.abonnement_fin },
    });
    await notificationService.notifier({
      type: 'abonnement_suspendu',
      salonId: salon.id,
      palier: 0,
      echeance: salon.abonnement_fin,
      destinataire: { email: salon.email, nom: salon.nom },
      contexte: { salonId: salon.id, abonnement_fin: salon.abonnement_fin },
    });
  }

  // 2) Alertes de pré-expiration
  const [aAlerter]: any = await pool.query(
    `SELECT id, nom, email, abonnement_fin, DATEDIFF(abonnement_fin, CURDATE()) AS joursRestants
     FROM salons
     WHERE statut = 'actif' AND abonnement_fin IS NOT NULL
       AND DATEDIFF(abonnement_fin, CURDATE()) IN (${PALIERS_ALERTE.join(',')})`
  );

  for (const salon of aAlerter) {
    await notificationService.notifier({
      type: 'rappel_expiration',
      salonId: salon.id,
      palier: Number(salon.joursRestants),
      echeance: salon.abonnement_fin,
      destinataire: { email: salon.email, nom: salon.nom },
      contexte: {
        salonId: salon.id,
        joursRestants: Number(salon.joursRestants),
        abonnement_fin: salon.abonnement_fin,
      },
    });
  }

  return { expires: aExpirer.length, alertes: aAlerter.length };
}

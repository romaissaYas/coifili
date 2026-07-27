import { pool } from '../db/pool';
import { envoyerEmail } from './emailService';
import { logger } from '../utils/logger';

/**
 * Service de notification d'abonnement.
 *
 * Envoie de VRAIS emails (via emailService : SMTP réel si configuré, sinon
 * transport « json » journalisé — même contrat que les emails de réservation)
 * ET journalise chaque notification dans `subscription_notifications`.
 *
 * DÉDUPLICATION : la clé unique (salon_id, type, palier, echeance) garantit
 * qu'un même rappel n'est jamais envoyé deux fois — même si le serveur
 * redémarre plusieurs fois dans la journée. Un renouvellement (nouvelle
 * echeance) ré-autorise naturellement les rappels du cycle suivant.
 */
export type NotificationType = 'rappel_expiration' | 'abonnement_suspendu';

export interface NotificationDestinataire {
  email: string;
  nom: string;
}

export interface Notification {
  type: NotificationType;
  salonId: number;
  /** Jours restants pour un rappel ; 0 pour les évènements ponctuels (expiration). */
  palier?: number;
  /** Date de fin d'abonnement concernée (clé de déduplication). */
  echeance?: string | null;
  destinataire: NotificationDestinataire;
  contexte: Record<string, unknown>;
}

export interface INotificationService {
  notifier(notification: Notification): Promise<void>;
}

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ROSE = '#e11d67';

function gabarit(titre: string, corps: string): string {
  return `<div style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:${ROSE};padding:20px 28px"><span style="color:#fff;font-size:22px;font-weight:800">Coifili</span></div>
      <div style="padding:28px;color:#374151;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px;color:#111827;font-size:18px">${titre}</h2>
        ${corps}
        <p style="margin:24px 0 0"><a href="${APP_URL}/espacecoiffeur" style="display:inline-block;background:${ROSE};color:#fff;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700">Gérer mon abonnement</a></p>
      </div>
    </div></div>`;
}

function construireEmail(n: Notification): { subject: string; html: string } {
  const nom = n.destinataire.nom || 'cher partenaire';
  if (n.type === 'rappel_expiration') {
    const jours = Number(n.contexte.joursRestants ?? n.palier ?? 0);
    const fin = String(n.contexte.abonnement_fin ?? n.echeance ?? '');
    return {
      subject: `Coifili — Votre abonnement expire dans ${jours} jour${jours > 1 ? 's' : ''}`,
      html: gabarit(
        `Votre abonnement expire bientôt`,
        `<p>Bonjour ${nom},<br>Votre abonnement Coifili arrive à échéance le <b>${fin}</b>, soit dans <b>${jours} jour${jours > 1 ? 's' : ''}</b>.</p>
         <p>Pensez à le renouveler pour que votre salon reste visible et continue de recevoir des réservations.</p>`
      ),
    };
  }
  // abonnement_suspendu = abonnement expiré
  const fin = String(n.contexte.abonnement_fin ?? n.echeance ?? '');
  return {
    subject: `Coifili — Votre abonnement a expiré`,
    html: gabarit(
      `Votre abonnement a expiré`,
      `<p>Bonjour ${nom},<br>Votre abonnement Coifili a expiré le <b>${fin}</b>. Votre salon n'est plus visible sur la plateforme et ne peut plus recevoir de réservations.</p>
       <p>Renouvelez votre abonnement pour réactiver votre salon.</p>`
    ),
  };
}

/**
 * Implémentation email + historique + déduplication.
 */
class EmailNotificationService implements INotificationService {
  async notifier(notification: Notification): Promise<void> {
    const palier = notification.palier ?? 0;
    const echeance = notification.echeance ?? '1970-01-01';
    const email = notification.destinataire.email;

    // Réservation atomique du « droit d'envoi » : INSERT IGNORE échoue
    // silencieusement (affectedRows=0) si la notification a déjà été émise.
    const [res]: any = await pool.execute(
      `INSERT IGNORE INTO subscription_notifications (salon_id, type, palier, echeance, canal, statut, destinataire, details)
       VALUES (?, ?, ?, ?, 'email', 'envoye', ?, ?)`,
      [notification.salonId, notification.type, palier, echeance, email || null, JSON.stringify(notification.contexte)]
    );
    if (!res.insertId) {
      // Déjà notifié pour ce (salon, type, palier, echeance).
      return;
    }

    if (!email) {
      logger.warn(`[NOTIFICATION:${notification.type}] salon ${notification.salonId} sans email — non envoyé.`);
      return;
    }

    const { subject, html } = construireEmail(notification);
    try {
      await envoyerEmail({ to: email, subject, html });
      logger.info(`[NOTIFICATION:${notification.type}] envoyée à ${email} (salon ${notification.salonId}, palier ${palier}).`);
    } catch (err) {
      // Échec d'envoi : on retire la réservation pour permettre une nouvelle
      // tentative au prochain passage, et on trace l'échec.
      logger.error({ err: err }, `[NOTIFICATION:${notification.type}] échec envoi à ${email} :`);
      await pool.execute('DELETE FROM subscription_notifications WHERE id = ?', [res.insertId]).catch(() => undefined);
    }
  }
}

export const notificationService: INotificationService = new EmailNotificationService();

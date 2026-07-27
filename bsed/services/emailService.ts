import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Envoi d'emails transactionnels (nodemailer).
 *
 * Transport choisi selon l'environnement :
 *  - si SMTP_HOST est défini → vrai transport SMTP (envoi réseau réel) ;
 *  - sinon → transport « json » : aucun envoi réseau, l'email est simplement
 *    sérialisé et journalisé. Cela permet de développer/tester sans SMTP tout
 *    en gardant le même code ; il suffira de renseigner les variables SMTP_*
 *    dans .env pour activer l'envoi réel.
 *
 * Variables .env : SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
 * SMTP_FROM, APP_URL (base des liens des boutons).
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

/** true si un vrai serveur SMTP est configuré (sinon transport « json » = pas d'envoi réel). */
export function estSmtpConfigure(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

/**
 * Vérifie l'état du transport email au démarrage :
 *  - sans SMTP configuré : AVERTIT clairement que les emails ne sont PAS envoyés ;
 *  - avec SMTP : teste la connexion (transporter.verify) et affiche le résultat.
 * À appeler au démarrage du serveur.
 */
export async function verifierTransportEmail(): Promise<void> {
  if (!estSmtpConfigure()) {
    logger.warn(
      "⚠️  SMTP non configuré (SMTP_HOST absent de .env) : transport « json » actif — " +
        "les emails de réservation NE SONT PAS envoyés, seulement journalisés. " +
        'Renseignez SMTP_HOST/PORT/USER/PASS dans bsed/.env pour activer un envoi réel.'
    );
    return;
  }
  try {
    await getTransporter().verify();
    logger.info(`✅ SMTP prêt (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}) — envoi réel activé.`);
  } catch (err) {
    logger.error({ err: err }, '❌ SMTP : échec de connexion/authentification. Les emails ne partiront pas. Détail :');
  }
}

export type EmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envoie un email. En cas d'échec, l'erreur est journalisée et RE-LANCÉE :
 * c'est à l'appelant (envoi lié à une réservation) de l'attraper pour ne
 * jamais bloquer/annuler l'opération métier.
 */
export async function envoyerEmail({ to, subject, html }: EmailInput): Promise<void> {
  const from = process.env.SMTP_FROM || 'Coifili <no-reply@coifili.dev>';
  const info: any = await getTransporter().sendMail({ from, to, subject, html });

  // Transport « json » (pas de SMTP configuré) : on trace l'email généré.
  if (!process.env.SMTP_HOST) {
    logger.info(`[EMAIL:json] "${subject}" -> ${to}`);
  } else {
    logger.info(`[EMAIL:sent] "${subject}" -> ${to} (id=${info?.messageId ?? '—'})`);
  }
}

import { pool } from '../db/pool';
import { envoyerEmail } from './emailService';
import { logger } from '../utils/logger';

/**
 * Emails transactionnels d'une réservation : un email au client, un email au
 * salon. Conçus pour ne JAMAIS faire échouer la réservation :
 *  - chaque envoi est isolé dans un try/catch (une erreur est journalisée,
 *    pas propagée) ;
 *  - la fonction est appelée en « fire-and-forget » après l'enregistrement.
 * Un renvoi ultérieur reste possible (la réservation existe en base).
 */

type ReservationEmailInput = {
  salonId: number;
  prestationId: number;
  employeId?: number | null;
  reference: string;
  date: string;
  heureDebut: string;
  clientNom: string;
  clientPrenom?: string | null;
  clientEmail?: string | null;
  clientTelephone?: string | null;
};

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ROSE = '#e11d67';

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Gabarit email commun (compatible Gmail/Outlook : tableaux + styles inline). */
function gabarit(titre: string, intro: string, lignes: [string, string][], bouton: { label: string; url: string }): string {
  const rows = lignes
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;">${esc(k)}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${esc(v)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${ROSE};padding:24px 32px;">
          <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:1px;">Coifili</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;color:#111827;font-size:20px;">${esc(titre)}</h1>
          <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.5;">${esc(intro)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef0f3;border-bottom:1px solid #eef0f3;margin-bottom:24px;">
            ${rows}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:9999px;background:${ROSE};">
              <a href="${esc(bouton.url)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:9999px;">${esc(bouton.label)}</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;color:#9ca3af;font-size:12px;">
          Coifili — Réservation de salons de beauté en Algérie.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function envoyerEmailsReservation(input: ReservationEmailInput): Promise<void> {
  // Regroupe toutes les données nécessaires aux deux emails.
  const [rows]: any = await pool.query(
    `SELECT s.nom AS salon_nom, s.adresse AS salon_adresse, s.telephone AS salon_tel, s.email AS salon_email,
            p.nom AS prestation_nom, e.nom AS employe_nom
     FROM salons s
     JOIN prestations p ON p.id = ?
     LEFT JOIN employes e ON e.id = ?
     WHERE s.id = ?`,
    [input.prestationId, input.employeId ?? null, input.salonId]
  );
  const d = rows[0];
  if (!d) {
    logger.error(`[reservationMailer] données introuvables pour salon=${input.salonId} — aucun email envoyé.`);
    return;
  }
  logger.info(
    `[reservationMailer] ${input.reference} : préparation des emails (client=${input.clientEmail ?? '—'}, salon=${d.salon_email ?? '—'}).`
  );

  const heure = input.heureDebut?.slice(0, 5) ?? input.heureDebut;
  const clientComplet = [input.clientPrenom, input.clientNom].filter(Boolean).join(' ');

  // 1) Email CLIENT
  if (input.clientEmail) {
    const html = gabarit(
      'Votre réservation est confirmée ✂️',
      `Bonjour ${clientComplet}, votre rendez-vous chez ${d.salon_nom} est bien enregistré.`,
      [
        ['Salon', d.salon_nom],
        ['Prestation', d.prestation_nom],
        ['Date', input.date],
        ['Heure', heure],
        ['Adresse', d.salon_adresse],
        ['Téléphone', d.salon_tel],
        ['Coiffeur', d.employe_nom],
        ['N° de réservation', input.reference],
      ],
      { label: 'Voir ma réservation', url: `${APP_URL}/mon-compte` }
    );
    try {
      logger.info(`[reservationMailer] → envoi email CLIENT à ${input.clientEmail} (${input.reference})…`);
      await envoyerEmail({ to: input.clientEmail, subject: `Réservation ${input.reference} confirmée — ${d.salon_nom}`, html });
      logger.info(`[reservationMailer] ✓ email CLIENT traité (${input.reference}).`);
    } catch (err) {
      logger.error({ err: err }, `[reservationMailer] ✗ échec email client (${input.reference}) :`);
    }
  } else {
    logger.warn(`[reservationMailer] ${input.reference} : pas d'email client (champ vide) — email client non envoyé.`);
  }

  // 2) Email SALON
  if (d.salon_email) {
    const html = gabarit(
      'Nouvelle réservation 📅',
      `Une nouvelle réservation vient d'être enregistrée pour ${d.salon_nom}.`,
      [
        ['Client', clientComplet],
        ['Téléphone', input.clientTelephone ?? ''],
        ['Email', input.clientEmail ?? ''],
        ['Prestation', d.prestation_nom],
        ['Date', input.date],
        ['Heure', heure],
        ['Coiffeur', d.employe_nom],
        ['N° de réservation', input.reference],
      ],
      { label: 'Voir les réservations', url: `${APP_URL}/espacecoiffeur` }
    );
    try {
      logger.info(`[reservationMailer] → envoi email SALON à ${d.salon_email} (${input.reference})…`);
      await envoyerEmail({ to: d.salon_email, subject: `Nouvelle réservation ${input.reference}`, html });
      logger.info(`[reservationMailer] ✓ email SALON traité (${input.reference}).`);
    } catch (err) {
      logger.error({ err: err }, `[reservationMailer] ✗ échec email salon (${input.reference}) :`);
    }
  } else {
    logger.warn(`[reservationMailer] ${input.reference} : le salon n'a pas d'email — email salon non envoyé.`);
  }
}

export type EvenementReservation = 'confirme' | 'annule' | 'modifie';

/**
 * Email au CLIENT lors d'un changement d'état d'une réservation par le salon
 * (confirmation / annulation / modification date-heure). Fire-and-forget :
 * une erreur d'envoi est journalisée et n'interrompt jamais l'action métier.
 */
export async function envoyerEmailStatutReservation(
  rdvId: number,
  evenement: EvenementReservation,
  motif?: string | null
): Promise<void> {
  try {
    const [rows]: any = await pool.query(
      `SELECT r.reference, r.date, r.heure_debut, r.client_nom, r.client_prenom, r.client_email,
              s.nom AS salon_nom, s.adresse AS salon_adresse, s.telephone AS salon_tel,
              p.nom AS prestation_nom, e.nom AS employe_nom
       FROM rendezvous r
       JOIN salons s ON s.id = r.salon_id
       JOIN prestations p ON p.id = r.prestation_id
       LEFT JOIN employes e ON e.id = r.employe_id
       WHERE r.id = ?`,
      [rdvId]
    );
    const d = rows[0];
    if (!d?.client_email) return;

    const heure = d.heure_debut?.slice(0, 5) ?? d.heure_debut;
    const clientComplet = [d.client_prenom, d.client_nom].filter(Boolean).join(' ');
    const lignes: [string, string][] = [
      ['Salon', d.salon_nom],
      ['Prestation', d.prestation_nom],
      ['Date', d.date],
      ['Heure', heure],
      ['Coiffeur', d.employe_nom],
      ['N° de réservation', d.reference],
    ];

    let titre: string;
    let intro: string;
    let sujet: string;
    if (evenement === 'confirme') {
      titre = 'Votre réservation est confirmée ✅';
      intro = `Bonjour ${clientComplet}, ${d.salon_nom} a confirmé votre rendez-vous.`;
      sujet = `Réservation ${d.reference} confirmée — ${d.salon_nom}`;
    } else if (evenement === 'annule') {
      titre = 'Votre réservation a été annulée';
      intro = `Bonjour ${clientComplet}, votre rendez-vous chez ${d.salon_nom} a été annulé${motif ? ` (motif : ${motif})` : ''}.`;
      sujet = `Réservation ${d.reference} annulée — ${d.salon_nom}`;
    } else {
      titre = 'Votre réservation a été modifiée';
      intro = `Bonjour ${clientComplet}, votre rendez-vous chez ${d.salon_nom} a été modifié. Nouveaux détails :`;
      sujet = `Réservation ${d.reference} modifiée — ${d.salon_nom}`;
    }

    const html = gabarit(titre, intro, lignes, { label: 'Voir ma réservation', url: `${APP_URL}/mon-compte` });
    await envoyerEmail({ to: d.client_email, subject: sujet, html });
    logger.info(`[reservationMailer] ✓ email client « ${evenement} » (${d.reference}).`);
  } catch (err) {
    logger.error({ err: err }, `[reservationMailer] ✗ échec email statut « ${evenement} » (rdv ${rdvId}) :`);
  }
}

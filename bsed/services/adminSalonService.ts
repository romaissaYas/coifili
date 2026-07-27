import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../db/pool';
import type { PoolConnection } from 'mysql2/promise';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';
import { envoyerEmail } from './emailService';
import { logger } from '../utils/logger';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ROSE = '#e11d67';

/**
 * Email de bienvenue envoyé AU SALON lors de sa validation par l'admin.
 * « Fire-and-forget » (comme les autres emails du projet) : un échec est
 * journalisé mais n'interrompt jamais la validation déjà enregistrée en base.
 * Appelé uniquement depuis validerSalon (transition en_attente -> actif), donc
 * jamais à l'inscription ni lors d'une autre modification, et une seule fois
 * par validation (une nouvelle tentative de validation renvoie 409).
 */
function notifierValidationSalon(salon: { nom?: string; email?: string }): void {
  if (!salon?.email) {
    logger.warn('[validerSalon] salon sans email — email de validation non envoyé.');
    return;
  }
  const lien = `${APP_URL}/login`;
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${ROSE};padding:24px 32px;">
          <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:1px;">Coifili</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;color:#111827;font-size:20px;">Bienvenue sur Coifili 🎉</h1>
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
            Bonjour <b>${esc(salon.nom) || 'cher partenaire'}</b>,<br>
            Bonne nouvelle : votre salon a été <b>validé par notre équipe</b>. Votre compte est désormais <b>actif</b>.
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
            Vous pouvez dès à présent <b>vous connecter</b> à votre Espace Coiffeur pour gérer vos horaires, prestations, produits, employés et recevoir vos réservations en ligne.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:9999px;background:${ROSE};">
              <a href="${esc(lien)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:9999px;">Se connecter</a>
            </td>
          </tr></table>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${esc(lien)}
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;color:#9ca3af;font-size:12px;">
          Coifili — Réservation de salons de beauté en Algérie.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  void envoyerEmail({ to: salon.email, subject: 'Coifili — Votre salon est validé, vous pouvez vous connecter 🎉', html })
    .then(() => logger.info(`[validerSalon] email de validation envoyé à ${salon.email}.`))
    .catch((err) => logger.error({ err: err }, `[validerSalon] échec email de validation (${salon.email}) :`));
}

/** Échappement HTML minimal pour les valeurs injectées dans l'email. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Gestion des salons par le Super Administrateur (Phase 2).
 * Couche service : SQL paramétré + règles de transition de statut. L'audit des
 * actions est effectué dans le contrôleur (il dispose de req.userId / req.ip).
 */

// Colonnes renvoyées à l'admin : champs salon + propriétaire (JOIN users).
const SALON_SELECT = `
  s.id, s.nom, s.email, s.telephone, s.message, s.adresse, s.wilaya, s.ville, s.type, s.categorie, s.image,
  s.statut, s.createdAt, s.abonnement_debut, s.abonnement_fin, s.abonnement_montant, s.paiement_statut,
  u.id AS ownerId, u.firstName AS ownerFirstName, u.lastName AS ownerLastName,
  u.email AS ownerEmail, u.phone AS ownerPhone
`;

type SalonCreateInput = {
  nom: string;
  email: string;
  telephone: string;
  wilaya: string;
  ville: string;
  adresse?: string;
  type: string;
  categorie: string;
  image?: string;
  description?: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  abonnement_debut: string;
  abonnement_fin: string;
  statut?: 'en_attente' | 'actif' | 'suspendu' | 'expire';
};

type SalonUpdateInput = {
  nom: string;
  email: string;
  telephone: string;
  message?: string;
  wilaya: string;
  ville: string;
  type: string;
  categorie: string;
  image?: string;
};

type AbonnementInput = {
  abonnement_debut: string;
  abonnement_fin: string;
  abonnement_montant?: number;
  paiement_statut?: 'en_attente' | 'paye' | 'impaye';
};

/**
 * Liste tous les salons (avec propriétaire), filtrable par statut et recherche.
 * Pagination OPT-IN : sans page/limit, renvoie le tableau complet (inchangé).
 */
export async function listerSalons(
  filtres: { statut?: string; q?: string; page?: number; limit?: number }
): Promise<any[] | Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.statut) {
    conditions.push('s.statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.q) {
    conditions.push('(s.nom LIKE ? OR s.email LIKE ? OR s.ville LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  if (filtres.page !== undefined || filtres.limit !== undefined) {
    const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
    const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
    const offset = (page - 1) * limit;
    const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM salons s ${where}`, values);
    const [rows]: any = await pool.query(
      `SELECT ${SALON_SELECT}
       FROM salons s LEFT JOIN users u ON u.id = s.userId
       ${where} ORDER BY s.createdAt DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return enveloppe(rows, Number(total), page, limit);
  }

  const [rows]: any = await pool.query(
    `SELECT ${SALON_SELECT}
     FROM salons s LEFT JOIN users u ON u.id = s.userId
     ${where}
     ORDER BY s.createdAt DESC`,
    values
  );
  return rows;
}

/**
 * Crée un salon ET son compte propriétaire (coiffeur) en une TRANSACTION :
 * soit les deux sont créés, soit rien (pas d'utilisateur orphelin). Le salon
 * est enregistré comme un salon normal, avec le statut choisi (défaut actif)
 * et les dates d'abonnement. Le propriétaire pourra se connecter avec son
 * email + le mot de passe temporaire.
 */
export async function creerSalonParAdmin(input: SalonCreateInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing]: any = await conn.query('SELECT id FROM users WHERE email = ?', [input.ownerEmail]);
    if (existing.length > 0) {
      throw new ServiceError(409, 'Cet email propriétaire est déjà utilisé.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const [userRes]: any = await conn.query(
      'INSERT INTO users (firstName, lastName, email, phone, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
      [input.ownerFirstName, input.ownerLastName, input.ownerEmail, input.ownerPhone, hashedPassword, 'coiffeur']
    );
    const userId = userRes.insertId;

    const statut = input.statut ?? 'actif';
    const [salonRes]: any = await conn.query(
      `INSERT INTO salons
        (nom, email, telephone, message, adresse, wilaya, ville, type, categorie, image, userId,
         statut, abonnement_debut, abonnement_fin, paiement_statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paye')`,
      [
        input.nom, input.email, input.telephone, input.description ?? '', input.adresse ?? null,
        input.wilaya, input.ville, input.type, input.categorie, input.image ?? '', userId,
        statut, input.abonnement_debut, input.abonnement_fin,
      ]
    );

    await conn.commit();
    return obtenirSalon(salonRes.insertId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** Détail d'un salon (avec propriétaire). 404 s'il n'existe pas. */
export async function obtenirSalon(id: number) {
  const [rows]: any = await pool.query(
    `SELECT ${SALON_SELECT}
     FROM salons s LEFT JOIN users u ON u.id = s.userId
     WHERE s.id = ?`,
    [id]
  );
  const salon = rows[0];
  if (!salon) throw new ServiceError(404, 'Salon introuvable.');
  return salon;
}

/** Lit le statut courant d'un salon (404 s'il n'existe pas). */
async function statutCourant(id: number): Promise<string> {
  const [rows]: any = await pool.query('SELECT statut FROM salons WHERE id = ?', [id]);
  if (!rows[0]) throw new ServiceError(404, 'Salon introuvable.');
  return rows[0].statut;
}

/** Modifie les champs d'un salon (hors statut/abonnement, qui ont leurs actions). */
export async function modifierSalon(id: number, data: SalonUpdateInput) {
  await statutCourant(id); // 404 si absent
  await pool.execute(
    `UPDATE salons
     SET nom = ?, email = ?, telephone = ?, message = ?, wilaya = ?, ville = ?, type = ?, categorie = ?, image = ?
     WHERE id = ?`,
    [
      data.nom, data.email, data.telephone, data.message ?? '',
      data.wilaya, data.ville, data.type, data.categorie, data.image ?? '', id,
    ]
  );
  return obtenirSalon(id);
}

/**
 * Supprime le compte propriétaire (coiffeur) rattaché à un salon qui vient
 * d'être supprimé, à condition qu'il ne possède plus AUCUN salon. Objectif :
 * libérer son adresse email (users.email est UNIQUE) pour qu'elle puisse être
 * réutilisée à une nouvelle inscription.
 *
 * Garde-fous anti-régression : on ne supprime le compte que s'il n'a plus de
 * salon ET s'il s'agit bien d'un `coiffeur` (jamais un client `user` ni un
 * `super_admin`). À exécuter dans la même transaction que la suppression du
 * salon.
 */
async function supprimerProprietaireSiOrphelin(conn: PoolConnection, userId: number | null): Promise<void> {
  if (!userId) return;
  const [autres]: any = await conn.query('SELECT COUNT(*) AS n FROM salons WHERE userId = ?', [userId]);
  if (Number(autres[0].n) > 0) return; // possède encore un salon -> on conserve le compte
  const [u]: any = await conn.query('SELECT userType FROM users WHERE id = ?', [userId]);
  if (u[0]?.userType === 'coiffeur') {
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
  }
}

/**
 * Supprime définitivement un salon (rendez-vous, produits... en cascade) ET son
 * compte propriétaire orphelin, afin de libérer l'adresse email. Atomique.
 */
export async function supprimerSalon(id: number): Promise<void> {
  await withTransaction(async (conn) => {
    const [rows]: any = await conn.query('SELECT userId FROM salons WHERE id = ?', [id]);
    if (!rows[0]) throw new ServiceError(404, 'Salon introuvable.');
    const userId: number | null = rows[0].userId ?? null;
    await conn.execute('DELETE FROM salons WHERE id = ?', [id]);
    await supprimerProprietaireSiOrphelin(conn, userId);
  });
}

/** Valide une inscription en attente : passe le salon `actif` (+ abonnement par défaut si absent). */
export async function validerSalon(id: number) {
  const statut = await statutCourant(id);
  if (statut !== 'en_attente') {
    throw new ServiceError(409, 'Seul un salon en attente peut être validé.');
  }
  await pool.execute(
    `UPDATE salons
     SET statut = 'actif',
         abonnement_debut = COALESCE(abonnement_debut, CURDATE()),
         abonnement_fin = COALESCE(abonnement_fin, DATE_ADD(CURDATE(), INTERVAL 1 YEAR))
     WHERE id = ?`,
    [id]
  );
  const salon = await obtenirSalon(id);
  // Validation effectivement enregistrée -> email de bienvenue au salon.
  notifierValidationSalon(salon);
  return salon;
}

/** Refuse une inscription en attente : supprime le salon ET son compte
 *  propriétaire orphelin (libère l'email pour une nouvelle inscription). */
export async function refuserSalon(id: number): Promise<void> {
  const statut = await statutCourant(id);
  if (statut !== 'en_attente') {
    throw new ServiceError(409, 'Seule une inscription en attente peut être refusée.');
  }
  await withTransaction(async (conn) => {
    const [rows]: any = await conn.query('SELECT userId FROM salons WHERE id = ?', [id]);
    const userId: number | null = rows[0]?.userId ?? null;
    await conn.execute('DELETE FROM salons WHERE id = ?', [id]);
    await supprimerProprietaireSiOrphelin(conn, userId);
  });
}

/** Suspend un salon actif. */
export async function suspendreSalon(id: number) {
  const statut = await statutCourant(id);
  if (statut !== 'actif') {
    throw new ServiceError(409, 'Seul un salon actif peut être suspendu.');
  }
  await pool.execute("UPDATE salons SET statut = 'suspendu' WHERE id = ?", [id]);
  return obtenirSalon(id);
}

/**
 * Réactive un salon suspendu ou expiré (action MANUELLE de l'admin après
 * vérification du paiement — jamais automatique). N'étend pas l'abonnement :
 * l'admin utilise l'action « abonnement » pour prolonger la date de fin.
 */
export async function reactiverSalon(id: number) {
  const statut = await statutCourant(id);
  if (statut !== 'suspendu' && statut !== 'expire') {
    throw new ServiceError(409, 'Seul un salon suspendu ou expiré peut être réactivé.');
  }
  await pool.execute("UPDATE salons SET statut = 'actif' WHERE id = ?", [id]);
  return obtenirSalon(id);
}

/** Met à jour l'abonnement (dates, montant, statut de paiement). */
export async function mettreAJourAbonnement(id: number, data: AbonnementInput) {
  await statutCourant(id); // 404 si absent
  if (data.abonnement_fin < data.abonnement_debut) {
    throw new ServiceError(400, 'La date de fin doit être postérieure à la date de début.');
  }
  await pool.execute(
    `UPDATE salons
     SET abonnement_debut = ?, abonnement_fin = ?, abonnement_montant = ?,
         paiement_statut = COALESCE(?, paiement_statut)
     WHERE id = ?`,
    [data.abonnement_debut, data.abonnement_fin, data.abonnement_montant ?? null, data.paiement_statut ?? null, id]
  );
  return obtenirSalon(id);
}

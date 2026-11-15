import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool, withTransaction } from '../db/pool';
import { env } from '../config/env';
import { ServiceError } from '../utils/ServiceError';
import { envoyerEmail } from './emailService';
import { logger } from '../utils/logger';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const RESET_TOKEN_TTL_MINUTES = 60;

/** Hash SHA-256 (le token en clair n'est jamais stocké : seul son empreinte l'est). */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

type SalonData = {
  nom: string;
  email: string;
  telephone: string;
  wilaya: string;
  ville: string;
  type: string;
  categorie: string;
  image?: string;
  message?: string;
};

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: 'coiffeur' | 'user';
  salonData?: SalonData;
};

/**
 * Crée un utilisateur (et son salon s'il s'agit d'un coiffeur), puis émet un
 * token JWT. Les champs de premier niveau (firstName, email, password...)
 * sont déjà validés par le middleware validateBody(registerSchema) monté sur
 * la route ; seul salonData (imbriqué) est validé ici.
 */
export async function registerUser(input: RegisterInput) {
  const { firstName, lastName, email, phone, password, userType } = input;

  // Inscription publique = CLIENT uniquement. La création d'un salon (compte
  // coiffeur) est réservée à l'administration (POST /api/admin/salons). On
  // refuse donc tout userType autre que 'user', même en appel direct à l'API.
  if (userType !== 'user') {
    throw new ServiceError(403, "L'inscription des salons se fait via l'administration. Contactez l'équipe Coifili.");
  }

  const [existingUser]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) {
    throw new ServiceError(400, 'Cet email est déjà utilisé.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Création du compte client (transaction conservée pour cohérence/robustesse).
  const userId = await withTransaction(async (conn) => {
    const [result]: any = await conn.execute(
      'INSERT INTO users (firstName, lastName, email, phone, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, hashedPassword, userType]
    );
    return result.insertId;
  });

  const token = jwt.sign({ userId, userType }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

  return {
    token,
    user: { id: userId, firstName, lastName, email, phone, userType },
  };
}

/** Vérifie les identifiants et émet un token JWT avec le salonId éventuel. */
export async function loginUser(email: string, password: string) {
  const [rows]: any = await pool.execute(
    `SELECT u.id, u.firstName, u.lastName, u.email, u.password, u.userType, u.statut AS userStatut,
            s.id AS salonId, s.statut AS salonStatut
     FROM users u
     LEFT JOIN salons s ON s.userId = u.id
     WHERE u.email = ?`,
    [email]
  );

  const user = rows[0];
  // Message générique identique que le compte existe ou non (anti-énumération).
  // On effectue tout de même une comparaison bcrypt sur un hash factice pour
  // égaliser le temps de réponse (limite l'oracle temporel).
  const HASH_FACTICE = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8bnDql0dQ0m1V0G8I5o1p2q3r4s5t6';
  if (!user) {
    await bcrypt.compare(password, HASH_FACTICE);
    throw new ServiceError(401, 'Email ou mot de passe incorrect.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ServiceError(401, 'Email ou mot de passe incorrect.');
  }

  // Compte suspendu par un administrateur : connexion refusée.
  if (user.userStatut === 'suspendu') {
    throw new ServiceError(403, "Votre compte a été suspendu. Contactez l'administrateur.");
  }

  // Gating du cycle de vie salon au LOGIN : seul un salon `suspendu` (décision
  // admin) est bloqué. Un salon `en_attente` (doit souscrire) ou `expire`
  // (doit renouveler) PEUT se connecter pour gérer son abonnement — le gating
  // PUBLIC (visibilité, réservations, endpoints de gestion) reste basé sur
  // salons.statut et n'est pas modifié : le salon reste invisible/non
  // réservable tant qu'il n'est pas `actif`.
  if (user.salonId && user.salonStatut === 'suspendu') {
    throw new ServiceError(403, "Votre compte salon a été suspendu. Contactez l'administrateur.");
  }

  const token = jwt.sign({ userId: user.id, userType: user.userType }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

  // Trace de dernière connexion (fire-and-forget : ne bloque ni ne fait échouer
  // la connexion si l'écriture échoue).
  void pool
    .execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id])
    .catch((err) => logger.error({ err: err }, '[login] maj last_login échouée :'));

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      salonId: user.salonId || null,
    },
  };
}

// ---------------------------------------------------------------------------
// Réinitialisation de mot de passe
// ---------------------------------------------------------------------------

/** Email contenant le lien de réinitialisation (fire-and-forget côté appelant). */
async function envoyerEmailReset(destinataire: string, prenom: string, token: string): Promise<void> {
  const lien = `${APP_URL}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
  const html = `<div style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#e11d67;padding:20px 28px"><span style="color:#fff;font-size:22px;font-weight:800">Coifili</span></div>
      <div style="padding:28px;color:#374151;font-size:14px;line-height:1.6">
        <h2 style="margin:0 0 12px;color:#111827;font-size:18px">Réinitialisation de votre mot de passe</h2>
        <p>Bonjour ${prenom || ''},<br>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable ${RESET_TOKEN_TTL_MINUTES} minutes :</p>
        <p style="margin:24px 0"><a href="${lien}" style="display:inline-block;background:#e11d67;color:#fff;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700">Choisir un nouveau mot de passe</a></p>
        <p style="color:#6b7280;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>
      </div>
    </div></div>`;
  await envoyerEmail({ to: destinataire, subject: 'Coifili — Réinitialisation de votre mot de passe', html });
}

/**
 * Demande de réinitialisation. Réponse TOUJOURS neutre côté contrôleur
 * (anti-énumération). Si le compte existe : invalide les anciens jetons non
 * utilisés, en crée un nouveau (haché, expirant) et envoie l'email. Un compte
 * suspendu ne reçoit pas de lien.
 */
export async function demanderReinitialisation(email: string): Promise<void> {
  const [rows]: any = await pool.query('SELECT id, firstName, email, statut FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || user.statut === 'suspendu') return; // silencieux : pas de fuite d'existence

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await withTransaction(async (conn) => {
    // Invalide les précédentes demandes encore actives de ce compte.
    await conn.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [user.id]
    );
    await conn.execute(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );
  });

  try {
    await envoyerEmailReset(user.email, user.firstName, token);
  } catch (err) {
    logger.error({ err: err }, '[reset] envoi email échoué :');
  }
}

/**
 * Réinitialise le mot de passe à partir d'un jeton valide (non expiré, non
 * utilisé). Met à jour le mot de passe et consomme le jeton dans la même
 * transaction (usage unique garanti). Message d'erreur générique.
 */
export async function reinitialiserMotDePasse(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await withTransaction(async (conn) => {
    const [rows]: any = await conn.execute(
      'SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    );
    const jeton = rows[0];
    if (!jeton) {
      throw new ServiceError(400, 'Lien de réinitialisation invalide ou expiré.');
    }
    await conn.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, jeton.user_id]);
    await conn.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [jeton.id]);
  });
}

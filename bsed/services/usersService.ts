import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';

/** Profil public du compte connecté (jamais le mot de passe). */
export async function getProfile(userId: number) {
  const [rows]: any = await pool.execute(
    'SELECT id, firstName, lastName, email, phone, userType FROM users WHERE id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user) throw new ServiceError(404, 'Compte introuvable.');
  return user;
}

/** Met à jour nom/prénom/email/téléphone. Vérifie l'unicité de l'email. */
export async function updateProfile(
  userId: number,
  data: { firstName: string; lastName: string; email: string; phone: string }
) {
  const [existing]: any = await pool.execute(
    'SELECT id FROM users WHERE email = ? AND id != ?',
    [data.email, userId]
  );
  if (existing.length > 0) {
    throw new ServiceError(400, 'Cet email est déjà utilisé par un autre compte.');
  }

  await pool.execute(
    'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
    [data.firstName, data.lastName, data.email, data.phone, userId]
  );

  return getProfile(userId);
}

/** Change le mot de passe après vérification du mot de passe actuel. */
export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const [rows]: any = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user) throw new ServiceError(404, 'Compte introuvable.');

  const valide = await bcrypt.compare(currentPassword, user.password);
  if (!valide) {
    throw new ServiceError(400, 'Le mot de passe actuel est incorrect.');
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
}

// ---------------------------------------------------------------------------
// RGPD / loi 18-07 — self-service : droit d'accès (export) et à l'effacement.
// ---------------------------------------------------------------------------

/**
 * Exporte l'ensemble des données personnelles du compte connecté (droit
 * d'accès et à la portabilité) : profil, réservations rattachées au compte, et
 * salon(s) possédé(s) le cas échéant. Lecture seule.
 */
export async function exporterDonnees(userId: number) {
  const profil = await getProfile(userId);

  const [reservations]: any = await pool.execute(
    `SELECT id, reference, date, heure_debut, heure_fin, duree, prix, statut,
            client_nom, client_prenom, client_email, client_telephone,
            salon_id, prestation_id, commentaire, created_at
     FROM rendezvous WHERE user_id = ? ORDER BY date DESC`,
    [userId]
  );

  const [salons]: any = await pool.execute(
    `SELECT id, nom, email, telephone, wilaya, ville, type, categorie, statut, createdAt
     FROM salons WHERE userId = ?`,
    [userId]
  );

  return {
    exporteLe: new Date().toISOString(),
    profil,
    reservations,
    salons,
  };
}

/**
 * Supprime définitivement le compte connecté (droit à l'effacement).
 *
 * - Exige le mot de passe actuel (confirmation d'identité) — action irréversible.
 * - Compte CLIENT : les réservations sont conservées pour le salon (obligations
 *   comptables/organisationnelles) mais ANONYMISÉES (les données personnelles
 *   du client y sont effacées et le lien au compte retiré), puis le compte est
 *   supprimé — le tout dans une transaction.
 * - Compte PROFESSIONNEL (coiffeur) ou ADMIN : refusé ici (données métier :
 *   salon, abonnements, paiements). L'utilisateur est invité à contacter
 *   l'administrateur, qui dispose de la suppression dédiée.
 */
export async function supprimerMonCompte(userId: number, password: string): Promise<void> {
  const [rows]: any = await pool.execute(
    'SELECT password, userType FROM users WHERE id = ?',
    [userId]
  );
  const user = rows[0];
  if (!user) throw new ServiceError(404, 'Compte introuvable.');

  const valide = await bcrypt.compare(password, user.password);
  if (!valide) throw new ServiceError(400, 'Mot de passe incorrect.');

  if (user.userType !== 'user') {
    throw new ServiceError(
      403,
      "La suppression d'un compte professionnel doit être demandée à l'administrateur."
    );
  }

  await withTransaction(async (conn) => {
    // Anonymisation des réservations : on garde la trace pour le salon, sans PII.
    await conn.execute(
      `UPDATE rendezvous
         SET user_id = NULL, client_nom = 'Compte supprimé', client_prenom = NULL,
             client_email = NULL, client_telephone = NULL
       WHERE user_id = ?`,
      [userId]
    );
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
  });
}

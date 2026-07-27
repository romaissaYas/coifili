import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Gestion des utilisateurs (clients, coiffeurs, admins) par le Super Admin.
 * SQL paramétré ; l'audit est fait dans le contrôleur.
 */

// Sous-requêtes corrélées (et non un JOIN) pour le salon : un propriétaire de
// plusieurs salons ne doit pas apparaître en double dans la liste.
const USER_SELECT = `
  u.id, u.firstName, u.lastName, u.email, u.phone, u.userType, u.statut, u.createdAt, u.last_login,
  (SELECT s.id FROM salons s WHERE s.userId = u.id ORDER BY s.id LIMIT 1) AS salonId,
  (SELECT s.nom FROM salons s WHERE s.userId = u.id ORDER BY s.id LIMIT 1) AS salonNom,
  (SELECT s.statut FROM salons s WHERE s.userId = u.id ORDER BY s.id LIMIT 1) AS salonStatut
`;

type UserUpdateInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/** Liste les utilisateurs, filtrable par rôle, statut et recherche (nom/email). */
/** Ordre de tri sûr (whitelist) : jamais construit à partir d'entrée brute. */
function ordreTri(tri?: string): string {
  switch (tri) {
    case 'nom':
      return 'u.lastName ASC, u.firstName ASC';
    case 'ancien':
      return 'u.createdAt ASC';
    case 'recent':
    default:
      return 'u.createdAt DESC';
  }
}

export async function listerUsers(
  filtres: { role?: string; statut?: string; q?: string; tri?: string; page?: number; limit?: number }
): Promise<any[] | Paginated<any>> {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filtres.role) {
    conditions.push('u.userType = ?');
    values.push(filtres.role);
  }
  if (filtres.statut) {
    conditions.push('u.statut = ?');
    values.push(filtres.statut);
  }
  if (filtres.q) {
    conditions.push('(u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = ordreTri(filtres.tri);

  if (filtres.page !== undefined || filtres.limit !== undefined) {
    const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
    const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
    const offset = (page - 1) * limit;
    const [[{ total }]]: any = await pool.query(`SELECT COUNT(*) AS total FROM users u ${where}`, values);
    const [rows]: any = await pool.query(
      `SELECT ${USER_SELECT} FROM users u ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return enveloppe(rows, Number(total), page, limit);
  }

  const [rows]: any = await pool.query(
    `SELECT ${USER_SELECT}
     FROM users u
     ${where}
     ORDER BY ${orderBy}`,
    values
  );
  return rows;
}

/** Détail d'un utilisateur. 404 s'il n'existe pas. */
export async function obtenirUser(id: number) {
  const [rows]: any = await pool.query(
    `SELECT ${USER_SELECT}
     FROM users u
     WHERE u.id = ?`,
    [id]
  );
  const user = rows[0];
  if (!user) throw new ServiceError(404, 'Utilisateur introuvable.');
  return user;
}

/** Lit le type + statut d'un utilisateur (404 s'il n'existe pas). */
async function chargerUser(id: number): Promise<{ userType: string; statut: string }> {
  const [rows]: any = await pool.query('SELECT userType, statut FROM users WHERE id = ?', [id]);
  if (!rows[0]) throw new ServiceError(404, 'Utilisateur introuvable.');
  return rows[0];
}

/** Modifie le profil d'un utilisateur (email unique vérifié). */
export async function modifierUser(id: number, data: UserUpdateInput) {
  await chargerUser(id); // 404 si absent

  const [dup]: any = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [data.email, id]);
  if (dup.length > 0) {
    throw new ServiceError(409, 'Cet email est déjà utilisé par un autre compte.');
  }

  await pool.execute(
    'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
    [data.firstName, data.lastName, data.email, data.phone, id]
  );
  return obtenirUser(id);
}

/** Supprime un utilisateur (son salon éventuel est supprimé en cascade). */
export async function supprimerUser(id: number, adminId: number | undefined): Promise<void> {
  if (id === adminId) {
    throw new ServiceError(400, 'Vous ne pouvez pas supprimer votre propre compte.');
  }
  const user = await chargerUser(id);
  if (user.userType === 'super_admin') {
    throw new ServiceError(403, 'Un compte administrateur ne peut pas être supprimé ici.');
  }
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
}

/** Suspend un compte (client/coiffeur). Interdit sur soi-même et sur un admin. */
export async function suspendreUser(id: number, adminId: number | undefined) {
  if (id === adminId) throw new ServiceError(400, 'Vous ne pouvez pas suspendre votre propre compte.');
  const user = await chargerUser(id);
  if (user.userType === 'super_admin') {
    throw new ServiceError(403, 'Un compte administrateur ne peut pas être suspendu.');
  }
  await pool.execute("UPDATE users SET statut = 'suspendu' WHERE id = ?", [id]);
  return obtenirUser(id);
}

/** Réactive un compte suspendu. */
export async function reactiverUser(id: number) {
  await chargerUser(id);
  await pool.execute("UPDATE users SET statut = 'actif' WHERE id = ?", [id]);
  return obtenirUser(id);
}

/**
 * Réinitialise le mot de passe. Si `newPassword` est fourni il est utilisé,
 * sinon un mot de passe temporaire est généré et RENVOYÉ une seule fois (à
 * communiquer à l'utilisateur ; aucune infra email n'existe encore).
 */
export async function reinitialiserMotDePasse(
  id: number,
  newPassword?: string
): Promise<{ generated: boolean; password?: string }> {
  await chargerUser(id);
  const motDePasse = newPassword || crypto.randomBytes(9).toString('base64url'); // ~12 caractères
  const hash = await bcrypt.hash(motDePasse, 10);
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
  return newPassword ? { generated: false } : { generated: true, password: motDePasse };
}

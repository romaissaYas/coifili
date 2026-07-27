import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { initializeDb } from '../db/schema';

/**
 * Crée (ou met à jour) le compte Super Administrateur à partir des variables
 * d'environnement, de façon idempotente. À lancer via `npm run seed:admin`.
 *
 * Variables lues dans .env :
 *   ADMIN_EMAIL      (obligatoire)
 *   ADMIN_PASSWORD   (obligatoire)
 *   ADMIN_FIRSTNAME  (optionnel, défaut "Super")
 *   ADMIN_LASTNAME   (optionnel, défaut "Admin")
 *   ADMIN_PHONE      (optionnel, défaut "0000000000")
 *
 * Rejouable : si le compte existe déjà, il est promu super_admin et son mot de
 * passe est réaligné sur ADMIN_PASSWORD (source de vérité = .env). Cela permet
 * aussi de réinitialiser l'accès admin en cas d'oubli.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env');
    process.exit(1);
  }

  const firstName = process.env.ADMIN_FIRSTNAME || 'Super';
  const lastName = process.env.ADMIN_LASTNAME || 'Admin';
  const phone = process.env.ADMIN_PHONE || '0000000000';

  // Garantit que la table users existe et que l'enum inclut super_admin.
  await initializeDb();

  const hashedPassword = await bcrypt.hash(password, 10);
  const [rows]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (rows.length > 0) {
    await pool.query(
      'UPDATE users SET userType = ?, password = ?, firstName = ?, lastName = ?, phone = ? WHERE email = ?',
      ['super_admin', hashedPassword, firstName, lastName, phone, email]
    );
    console.log(`✅ Super administrateur mis à jour : ${email}`);
  } else {
    await pool.query(
      'INSERT INTO users (firstName, lastName, email, phone, password, userType) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, hashedPassword, 'super_admin']
    );
    console.log(`✅ Super administrateur créé : ${email}`);
  }

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Échec du seed admin :', err);
  process.exit(1);
});

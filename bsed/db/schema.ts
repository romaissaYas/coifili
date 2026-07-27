import { PoolConnection } from 'mysql2/promise';
import { pool } from './pool';
import { logger } from '../utils/logger';

// Initialise le schéma de la base de données au démarrage du serveur.
//
// Toutes les tables utilisent CREATE TABLE IF NOT EXISTS afin que
// l'initialisation reste idempotente : le serveur doit pouvoir être
// redémarré autant de fois que nécessaire sans jamais échouer parce qu'une
// table existe déjà.
//
// Il n'y a pas encore de système de migration dédié (voir bsed/migrations/
// pour la stratégie prévue) : toute évolution du schéma passe par ce
// fichier, avec une étape de migration idempotente (migrateRendezvousModel)
// pour amener une base déjà existante au schéma le plus récent.
export async function initializeDb(): Promise<void> {
  let retries = 3;
  while (retries > 0) {
    try {
      const conn = await pool.getConnection();
      try {
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firstName VARCHAR(100) NOT NULL,
            lastName VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            password VARCHAR(255) NOT NULL,
            userType ENUM('coiffeur', 'user', 'super_admin') NOT NULL, -- coiffeur, client ou super administrateur
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS salons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            telephone VARCHAR(20) NOT NULL,
            message TEXT,
            wilaya VARCHAR(100) NOT NULL,
            ville VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            categorie VARCHAR(50) NOT NULL,
            image VARCHAR(255) NOT NULL, -- chemin/URL de l'image, 50 caractères était trop court
            userId INT NOT NULL, -- 🔗 lien avec l'utilisateur
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS horaires (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NOT NULL, -- 🔗 lien avec le salon
            jour VARCHAR(20) NOT NULL,
            ouvert TINYINT(1) NOT NULL DEFAULT 0,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_salon_jour (salon_id, jour) -- un seul horaire par jour et par salon
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS creneaux (
            id INT AUTO_INCREMENT PRIMARY KEY,
            horaire_id INT NOT NULL,
            heure_debut TIME NOT NULL,
            heure_fin TIME NOT NULL,
            FOREIGN KEY (horaire_id) REFERENCES horaires(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS produits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prix DECIMAL(10,2) NOT NULL,
            salon_id INT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS prestations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prix DECIMAL(10,2) NOT NULL,
            duree INT NULL, -- durée en minutes ; nullable pour rester compatible avec une base existante, voir migrateRendezvousModel()
            salon_id INT NOT NULL,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS employes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            poste VARCHAR(100) NOT NULL,
            salon_id INT NOT NULL,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS rendezvous (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NULL,
            employe_id INT NULL,
            user_id INT NULL, -- compte client (NULL si réservation invité)
            prestation_id INT NOT NULL,
            client_nom VARCHAR(100) NOT NULL,
            client_prenom VARCHAR(100) NULL,
            client_email VARCHAR(255) NULL,
            client_telephone VARCHAR(20) NULL,
            date DATE NOT NULL,
            heure_debut TIME NULL,
            heure_fin TIME NULL,
            duree INT NULL,
            prix DECIMAL(10,2) NULL,
            statut ENUM('en_attente', 'confirme', 'termine', 'annule') NOT NULL DEFAULT 'en_attente',
            commentaire TEXT NULL,
            reference VARCHAR(20) NULL, -- numéro de réservation public (ex. CF-000123)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (prestation_id) REFERENCES prestations(id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Journal d'activité (Audit Log) — actions importantes de l'admin.
        // user_id nullable : on conserve la trace même si le compte est
        // supprimé plus tard (ON DELETE SET NULL).
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50) NULL,
            entity_id INT NULL,
            ip_address VARCHAR(45) NULL, -- IPv4/IPv6
            details TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_audit_created (created_at),
            INDEX idx_audit_user (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Boutique produits (fonctionnalité isolée) — table DISTINCTE de
        // `produits` (qui reste inchangée). 1 salon -> plusieurs products.
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NOT NULL,
            nom VARCHAR(150) NOT NULL,
            description TEXT NULL,
            categorie VARCHAR(50) NULL,
            marque VARCHAR(100) NULL,
            prix DECIMAL(10,2) NOT NULL,
            prix_promo DECIMAL(10,2) NULL,
            stock INT NULL,
            disponibilite TINYINT(1) NOT NULL DEFAULT 1,
            images TEXT NULL, -- tableau JSON d'URLs (image principale + galerie)
            statut ENUM('draft','published') NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            INDEX idx_products_salon (salon_id),
            INDEX idx_products_statut (statut),
            INDEX idx_products_categorie (categorie)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Système d'abonnement payant (fonctionnalité isolée et additive).
        // Ces tables normalisées pilotent le cycle abonnement/paiement ; à
        // l'activation elles mettent à jour salons.statut/abonnement_* — le
        // gating public/réservation/login existant (basé sur salons.statut)
        // continue donc de fonctionner sans changement.
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS subscription_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(50) NOT NULL,
            prix DECIMAL(10,2) NOT NULL,
            duree_mois INT NOT NULL,
            description TEXT NULL,
            actif TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NOT NULL,
            plan_id INT NOT NULL,
            statut ENUM('pending','waiting_cash','waiting_card','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
            date_debut DATE NULL,
            date_fin DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
            INDEX idx_sub_salon (salon_id),
            INDEX idx_sub_statut (statut)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subscription_id INT NOT NULL,
            salon_id INT NOT NULL,
            methode VARCHAR(20) NOT NULL, -- 'cash', 'cib', extensible (edahabia, satim...)
            montant DECIMAL(10,2) NOT NULL,
            statut ENUM('pending','waiting_cash','waiting_card','paid','refused','cancelled') NOT NULL DEFAULT 'pending',
            reference VARCHAR(40) NOT NULL UNIQUE,
            checkout_url VARCHAR(500) NULL,
            validated_by INT NULL,
            validated_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            INDEX idx_pay_salon (salon_id),
            INDEX idx_pay_statut (statut)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Réinitialisation de mot de passe : jetons à usage unique, hachés,
        // avec expiration. Le token en clair n'est jamais stocké (seul son
        // hash SHA-256). `used_at` non nul => jeton déjà consommé.
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_prt_token (token_hash),
            INDEX idx_prt_user (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Historique / déduplication des notifications d'abonnement. Une ligne
        // par (salon, type, palier) : garantit qu'un même rappel n'est jamais
        // renvoyé (idempotence même en cas de redémarrages multiples du serveur).
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS subscription_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NOT NULL,
            type VARCHAR(40) NOT NULL, -- rappel_expiration | abonnement_expire | abonnement_suspendu | abonnement_renouvele
            palier INT NOT NULL DEFAULT 0, -- jours restants pour un rappel ; 0 pour les évènements ponctuels
            echeance DATE NOT NULL DEFAULT '1970-01-01', -- date de fin d'abonnement concernée : un renouvellement (nouvelle échéance) ré-autorise les rappels
            canal VARCHAR(20) NOT NULL DEFAULT 'email',
            statut VARCHAR(20) NOT NULL DEFAULT 'envoye', -- envoye | echec
            destinataire VARCHAR(255) NULL,
            details TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_notif (salon_id, type, palier, echeance),
            INDEX idx_notif_salon (salon_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Notifications in-app de l'Espace Coiffure (ex. nouvelle réservation).
        // Rattachées au salon ; `rendezvous_id` + clé unique garantissent
        // qu'un même rendez-vous ne génère jamais deux notifications.
        await conn.execute(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            salon_id INT NOT NULL,
            type VARCHAR(40) NOT NULL DEFAULT 'nouvelle_reservation',
            rendezvous_id INT NULL,
            reference VARCHAR(20) NULL,
            client_nom VARCHAR(200) NULL,
            prestation_nom VARCHAR(150) NULL,
            date_rdv DATE NULL,
            heure_rdv TIME NULL,
            lu TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
            UNIQUE KEY uniq_notif_rdv (rendezvous_id, type),
            INDEX idx_notif_salon_lu (salon_id, lu),
            INDEX idx_notif_salon_date (salon_id, created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // La table rendezvous existait déjà avec un schéma minimal avant P4.
        // Cette étape amène toute base existante (dev ou déjà déployée) au
        // nouveau modèle complet, de façon idempotente (sûre à rejouer à
        // chaque démarrage), sans système de migration dédié.
        await migrateRendezvousModel(conn);

        // Ajouts P6 : numéro de réservation public + index de recherche salons.
        await migratePublicBooking(conn);

        // Ajouts P7 : lien optionnel réservation -> compte client.
        await migrateClientAccount(conn);

        // Espace admin (Phase 0) : ajoute le rôle super_admin à l'enum userType
        // d'une base déjà existante, de façon idempotente.
        await migrateAdminRole(conn);

        // Espace admin (Phase 1) : cycle de vie salon (statut + abonnement),
        // avec rétro-remplissage des salons existants en `actif`.
        await migrateSalonSubscription(conn);

        // Espace admin (Phase 3) : statut de compte utilisateur (suspension).
        await migrateUserStatus(conn);

        // Espace admin : adresse du salon (saisie lors de la création par l'admin).
        await migrateSalonAdresse(conn);

        // Abonnements payants : seed des 3 plans par défaut (idempotent).
        await migrateSubscriptionPlans(conn);

        // Gestion des réservations (espace coiffeur) : colonnes additives
        // (horodatages, absence, motif d'annulation, notes internes). L'enum
        // `statut` existant n'est PAS modifié ; « Absent » est porté par le
        // flag `no_show`. Idempotent.
        await migrateReservationManagement(conn);

        // Mise en évidence des nouvelles réservations non encore consultées par
        // le coiffeur (fond vert dans le tableau). Idempotent + rétro-remplissage.
        await migrateReservationVue(conn);

        logger.info('Database initialized');
      } finally {
        conn.release();
      }
      return;
    } catch (error) {
      retries--;
      const code = (error as { code?: string })?.code;
      if (retries === 0) {
        logger.error(
          { err: error },
          `Échec de l'initialisation de la base de données après plusieurs tentatives (code: ${code ?? 'inconnu'}). ` +
          `Vérifiez que le service MySQL est démarré, que les identifiants de connexion sont corrects ` +
          `et que la base de données configurée existe.`
        );
        throw error;
      }
      logger.warn(
        `Initialisation de la base de données échouée (tentative restante : ${retries}, code: ${code ?? 'inconnu'}), nouvelle tentative dans 2s...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function columnExists(conn: PoolConnection, table: string, column: string): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function constraintExists(conn: PoolConnection, table: string, constraintName: string): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [table, constraintName]
  );
  return rows[0].cnt > 0;
}

async function indexExists(conn: PoolConnection, table: string, indexName: string): Promise<boolean> {
  const [rows]: any = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows[0].cnt > 0;
}

/**
 * Amène les tables prestations/rendezvous, si elles existaient déjà avec
 * l'ancien schéma minimal (avant P4), au nouveau modèle de réservation
 * complet. Chaque étape est idempotente (vérifiée avant d'être appliquée) :
 * rejouable à chaque démarrage sans erreur, que la base soit neuve ou déjà
 * migrée.
 */
async function migrateRendezvousModel(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'prestations', 'duree'))) {
    await conn.execute('ALTER TABLE prestations ADD COLUMN duree INT NULL');
  }

  const nouvellesColonnes: [string, string][] = [
    ['salon_id', 'INT NULL'],
    ['employe_id', 'INT NULL'],
    ['client_prenom', 'VARCHAR(100) NULL'],
    ['client_email', 'VARCHAR(255) NULL'],
    ['client_telephone', 'VARCHAR(20) NULL'],
    ['heure_debut', 'TIME NULL'],
    ['heure_fin', 'TIME NULL'],
    ['duree', 'INT NULL'],
    ['prix', 'DECIMAL(10,2) NULL'],
    ['statut', "ENUM('en_attente','confirme','termine','annule') NOT NULL DEFAULT 'en_attente'"],
    ['commentaire', 'TEXT NULL'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'],
    ['updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ];
  for (const [column, definition] of nouvellesColonnes) {
    if (!(await columnExists(conn, 'rendezvous', column))) {
      await conn.execute(`ALTER TABLE rendezvous ADD COLUMN ${column} ${definition}`);
    }
  }

  // Reprise des anciennes données : l'ancien champ unique "heure" devient heure_debut.
  // La colonne "heure" elle-même est conservée (pas de perte de données) mais
  // rendue nullable : le nouveau code n'écrit plus dedans, elle ne doit donc
  // plus bloquer les insertions.
  if (await columnExists(conn, 'rendezvous', 'heure')) {
    await conn.execute('ALTER TABLE rendezvous MODIFY COLUMN heure TIME NULL');
    await conn.execute('UPDATE rendezvous SET heure_debut = heure WHERE heure_debut IS NULL');
  }

  // Reprise de salon_id à partir de la prestation liée, pour les lignes déjà existantes.
  await conn.execute(`
    UPDATE rendezvous r
    JOIN prestations p ON p.id = r.prestation_id
    SET r.salon_id = p.salon_id
    WHERE r.salon_id IS NULL
  `);

  if (!(await constraintExists(conn, 'rendezvous', 'fk_rendezvous_salon'))) {
    await conn.execute(
      'ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE'
    );
  }

  if (!(await constraintExists(conn, 'rendezvous', 'fk_rendezvous_employe'))) {
    await conn.execute(
      'ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_employe FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL'
    );
  }

  if (!(await indexExists(conn, 'rendezvous', 'idx_salon_date'))) {
    await conn.execute('ALTER TABLE rendezvous ADD INDEX idx_salon_date (salon_id, date)');
  }

  if (!(await indexExists(conn, 'rendezvous', 'idx_employe_date'))) {
    await conn.execute('ALTER TABLE rendezvous ADD INDEX idx_employe_date (employe_id, date)');
  }
}

/**
 * Ajouts P6 (expérience client) : colonne `reference` (numéro de réservation
 * public) sur rendezvous, et index de recherche sur les colonnes de filtrage
 * publiques des salons. Idempotent, rejouable à chaque démarrage.
 */
async function migratePublicBooking(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'rendezvous', 'reference'))) {
    await conn.execute('ALTER TABLE rendezvous ADD COLUMN reference VARCHAR(20) NULL');
  }

  const indexesSalons: [string, string][] = [
    ['idx_salon_wilaya', 'wilaya'],
    ['idx_salon_ville', 'ville'],
    ['idx_salon_categorie', 'categorie'],
  ];
  for (const [indexName, column] of indexesSalons) {
    if (!(await indexExists(conn, 'salons', indexName))) {
      await conn.execute(`ALTER TABLE salons ADD INDEX ${indexName} (${column})`);
    }
  }
}

/**
 * Espace admin (Phase 0) : étend l'enum `users.userType` pour inclure
 * `super_admin` sur une base déjà existante (créée avant l'espace admin).
 * Idempotent : n'exécute l'ALTER que si la valeur manque encore.
 */
async function migrateAdminRole(conn: PoolConnection): Promise<void> {
  const [rows]: any = await conn.query(
    `SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'userType'`
  );
  const type: string = rows[0]?.type ?? '';
  if (!type.includes("'super_admin'")) {
    await conn.execute(
      "ALTER TABLE users MODIFY COLUMN userType ENUM('coiffeur','user','super_admin') NOT NULL"
    );
  }
}

/**
 * Gestion des réservations (espace coiffeur) : ajoute des colonnes de suivi au
 * rendez-vous, sans toucher aux colonnes/enum existants. Idempotent.
 */
async function migrateReservationManagement(conn: PoolConnection): Promise<void> {
  const colonnes: [string, string][] = [
    ['confirmed_at', 'TIMESTAMP NULL'],
    ['cancelled_at', 'TIMESTAMP NULL'],
    ['completed_at', 'TIMESTAMP NULL'],
    ['no_show', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['cancellation_reason', 'VARCHAR(500) NULL'],
    ['notes', 'TEXT NULL'],
  ];
  for (const [colonne, definition] of colonnes) {
    if (!(await columnExists(conn, 'rendezvous', colonne))) {
      await conn.execute(`ALTER TABLE rendezvous ADD COLUMN ${colonne} ${definition}`);
    }
  }
}

/**
 * Ajoute `vue_coiffeur` (0 = non consultée, 1 = consultée) au rendez-vous, pour
 * mettre en évidence en vert les nouvelles réservations non encore ouvertes par
 * le coiffeur. Les NOUVELLES réservations partent à 0 (DEFAULT), les EXISTANTES
 * sont rétro-remplies à 1 lors du premier ajout (elles ne doivent jamais
 * apparaître en vert). Idempotent.
 */
async function migrateReservationVue(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'rendezvous', 'vue_coiffeur'))) {
    await conn.execute('ALTER TABLE rendezvous ADD COLUMN vue_coiffeur TINYINT(1) NOT NULL DEFAULT 0');
    await conn.execute('UPDATE rendezvous SET vue_coiffeur = 1');
  }
}

/**
 * Abonnements payants : insère les 3 plans par défaut si la table est vide.
 * Idempotent (ne réinsère pas si des plans existent déjà).
 */
async function migrateSubscriptionPlans(conn: PoolConnection): Promise<void> {
  const [rows]: any = await conn.query('SELECT COUNT(*) AS n FROM subscription_plans');
  if (rows[0].n > 0) return;
  await conn.query(
    `INSERT INTO subscription_plans (nom, prix, duree_mois, description) VALUES
       ('Starter', 3000.00, 1, 'Abonnement 1 mois — visibilité et réservations en ligne.'),
       ('Pro', 8000.00, 3, 'Abonnement 3 mois — le meilleur rapport qualité/prix.'),
       ('Premium', 28000.00, 12, 'Abonnement 12 mois — 2 mois offerts.')`
  );
}

/**
 * Espace admin : colonne `adresse` du salon (facultative), saisie lors de la
 * création d'un salon par l'administrateur. Idempotent.
 */
async function migrateSalonAdresse(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'salons', 'adresse'))) {
    await conn.execute('ALTER TABLE salons ADD COLUMN adresse VARCHAR(255) NULL');
  }
}

/**
 * Espace admin (Phase 3) : statut de compte utilisateur, pour permettre à
 * l'admin de suspendre un compte (client/coiffeur). Le DEFAULT 'actif'
 * s'applique aux lignes existantes lors de l'ajout : aucun compte n'est bloqué.
 */
async function migrateUserStatus(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'users', 'statut'))) {
    await conn.execute(
      "ALTER TABLE users ADD COLUMN statut ENUM('actif','suspendu') NOT NULL DEFAULT 'actif'"
    );
  }
  // Dernière connexion (affichée dans la gestion des utilisateurs admin).
  // NULL tant que l'utilisateur ne s'est pas connecté depuis l'ajout. Idempotent.
  if (!(await columnExists(conn, 'users', 'last_login'))) {
    await conn.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL');
  }
}

/**
 * Espace admin (Phase 1) : cycle de vie du salon.
 * Ajoute le statut du compte, la date d'inscription et les champs
 * d'abonnement annuel. Idempotent.
 *
 * BACKFILL : au tout premier ajout de `statut`, les salons DÉJÀ présents sont
 * marqués `actif` et abonnés 1 an. Sans cela, on bloquerait les comptes
 * coiffeur existants (login gaté) et on masquerait leurs salons du site public
 * (listing filtré sur `actif`). Les NOUVELLES inscriptions, elles, partent en
 * `en_attente` (défaut de la colonne) et devront être validées par l'admin.
 */
async function migrateSalonSubscription(conn: PoolConnection): Promise<void> {
  const statutVientDetreAjoute = !(await columnExists(conn, 'salons', 'statut'));

  const nouvellesColonnes: [string, string][] = [
    ['statut', "ENUM('en_attente','actif','suspendu','expire') NOT NULL DEFAULT 'en_attente'"],
    ['createdAt', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'],
    ['abonnement_debut', 'DATE NULL'],
    ['abonnement_fin', 'DATE NULL'],
    ['abonnement_montant', 'DECIMAL(10,2) NULL'],
    ['paiement_statut', "ENUM('en_attente','paye','impaye') NOT NULL DEFAULT 'en_attente'"],
  ];
  for (const [column, definition] of nouvellesColonnes) {
    if (!(await columnExists(conn, 'salons', column))) {
      await conn.execute(`ALTER TABLE salons ADD COLUMN ${column} ${definition}`);
    }
  }

  // Backfill unique (uniquement à la première introduction de `statut`).
  if (statutVientDetreAjoute) {
    await conn.execute(`
      UPDATE salons
      SET statut = 'actif',
          paiement_statut = 'paye',
          abonnement_debut = CURDATE(),
          abonnement_fin = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
      WHERE statut = 'en_attente'
    `);
  }

  if (!(await indexExists(conn, 'salons', 'idx_salon_statut'))) {
    await conn.execute('ALTER TABLE salons ADD INDEX idx_salon_statut (statut)');
  }
}

/**
 * Ajouts P7 (espace client) : lien optionnel entre un rendez-vous et un
 * compte client (`user_id`), afin qu'un client connecté retrouve son
 * historique. NULL pour les réservations invité (sans compte). Idempotent.
 */
async function migrateClientAccount(conn: PoolConnection): Promise<void> {
  if (!(await columnExists(conn, 'rendezvous', 'user_id'))) {
    await conn.execute('ALTER TABLE rendezvous ADD COLUMN user_id INT NULL');
  }
  if (!(await constraintExists(conn, 'rendezvous', 'fk_rendezvous_user'))) {
    await conn.execute(
      'ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL'
    );
  }
  if (!(await indexExists(conn, 'rendezvous', 'idx_user_date'))) {
    await conn.execute('ALTER TABLE rendezvous ADD INDEX idx_user_date (user_id, date)');
  }
}

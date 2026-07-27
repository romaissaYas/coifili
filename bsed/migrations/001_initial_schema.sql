-- Instantané du schéma initial (users, salons, horaires, creneaux, produits,
-- prestations, employes, rendezvous minimal). Correspond à ce que
-- bsed/db/schema.ts exécute pour une base neuve, avant les évolutions
-- listées dans 002_rendezvous_booking_model.sql.
--
-- Ce fichier est un instantané documentaire : il n'est pas exécuté
-- automatiquement (voir bsed/migrations/README.md). Le comportement réel au
-- démarrage reste géré par bsed/db/schema.ts, sans changement de
-- fonctionnement introduit par la présence de ce fichier.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  userType ENUM('coiffeur', 'user') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  image VARCHAR(255) NOT NULL,
  userId INT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS horaires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  salon_id INT NOT NULL,
  jour VARCHAR(20) NOT NULL,
  ouvert TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_salon_jour (salon_id, jour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS creneaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  horaire_id INT NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  FOREIGN KEY (horaire_id) REFERENCES horaires(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  salon_id INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prestations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  salon_id INT NOT NULL,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  poste VARCHAR(100) NOT NULL,
  salon_id INT NOT NULL,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rendezvous (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_nom VARCHAR(100) NOT NULL,
  prestation_id INT NOT NULL,
  date DATE NOT NULL,
  heure TIME NOT NULL,
  FOREIGN KEY (prestation_id) REFERENCES prestations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

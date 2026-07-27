-- Évolution du modèle de réservation (P2-P4) : constraintes horaires,
-- élargissement de salons.image, durée des prestations, et refonte complète
-- de rendezvous. Correspond à ce que bsed/db/schema.ts applique via
-- migrateRendezvousModel() pour une base déjà existante.
--
-- Instantané documentaire, non exécuté automatiquement (voir README.md).

ALTER TABLE salons MODIFY image VARCHAR(255) NOT NULL;

ALTER TABLE horaires ADD CONSTRAINT uniq_salon_jour UNIQUE (salon_id, jour);

ALTER TABLE prestations ADD COLUMN duree INT NULL;

ALTER TABLE rendezvous
  ADD COLUMN salon_id INT NULL,
  ADD COLUMN employe_id INT NULL,
  ADD COLUMN client_prenom VARCHAR(100) NULL,
  ADD COLUMN client_email VARCHAR(255) NULL,
  ADD COLUMN client_telephone VARCHAR(20) NULL,
  ADD COLUMN heure_debut TIME NULL,
  ADD COLUMN heure_fin TIME NULL,
  ADD COLUMN duree INT NULL,
  ADD COLUMN prix DECIMAL(10,2) NULL,
  ADD COLUMN statut ENUM('en_attente','confirme','termine','annule') NOT NULL DEFAULT 'en_attente',
  ADD COLUMN commentaire TEXT NULL,
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE rendezvous MODIFY COLUMN heure TIME NULL;
UPDATE rendezvous SET heure_debut = heure WHERE heure_debut IS NULL;
UPDATE rendezvous r JOIN prestations p ON p.id = r.prestation_id
  SET r.salon_id = p.salon_id WHERE r.salon_id IS NULL;

ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_salon
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_employe
  FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL;

ALTER TABLE rendezvous ADD INDEX idx_salon_date (salon_id, date);
ALTER TABLE rendezvous ADD INDEX idx_employe_date (employe_id, date);

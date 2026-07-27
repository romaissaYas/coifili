-- P7 (espace client) : lien optionnel entre un rendez-vous et un compte
-- client (`user_id`). NULL pour les réservations invité. Correspond à ce que
-- bsed/db/schema.ts applique via migrateClientAccount() pour une base
-- déjà existante.
--
-- Instantané documentaire, non exécuté automatiquement (voir README.md).

ALTER TABLE rendezvous ADD COLUMN user_id INT NULL;
ALTER TABLE rendezvous ADD CONSTRAINT fk_rendezvous_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE rendezvous ADD INDEX idx_user_date (user_id, date);

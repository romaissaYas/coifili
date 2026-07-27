-- P6 (expérience client / réservation publique) : numéro de réservation
-- public sur rendezvous et index de recherche sur les colonnes de filtrage
-- publiques des salons. Correspond à ce que bsed/db/schema.ts applique via
-- migratePublicBooking() pour une base déjà existante.
--
-- Instantané documentaire, non exécuté automatiquement (voir README.md).

ALTER TABLE rendezvous ADD COLUMN reference VARCHAR(20) NULL;

ALTER TABLE salons ADD INDEX idx_salon_wilaya (wilaya);
ALTER TABLE salons ADD INDEX idx_salon_ville (ville);
ALTER TABLE salons ADD INDEX idx_salon_categorie (categorie);

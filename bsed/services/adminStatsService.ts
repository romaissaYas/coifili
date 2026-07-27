import { pool } from '../db/pool';

/** Agrégats du tableau de bord administrateur. */

async function scalar(sql: string): Promise<number> {
  const [rows]: any = await pool.query(sql);
  const row = rows[0] || {};
  return Number(row.n ?? row.total ?? 0);
}

export async function getDashboardStats() {
  const [
    totalSalons,
    totalClients,
    totalReservations,
    rdvAujourdhui,
    revenusAbonnements,
    revenusPrestations,
    nouveauxSalonsCeMois,
  ] = await Promise.all([
    scalar('SELECT COUNT(*) AS n FROM salons'),
    scalar("SELECT COUNT(*) AS n FROM users WHERE userType = 'user'"),
    scalar('SELECT COUNT(*) AS n FROM rendezvous'),
    scalar("SELECT COUNT(*) AS n FROM rendezvous WHERE date = CURDATE() AND statut <> 'annule'"),
    scalar("SELECT COALESCE(SUM(abonnement_montant), 0) AS total FROM salons WHERE paiement_statut = 'paye'"),
    scalar("SELECT COALESCE(SUM(prix), 0) AS total FROM rendezvous WHERE statut = 'termine'"),
    scalar(
      'SELECT COUNT(*) AS n FROM salons WHERE YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE())'
    ),
  ]);

  // Répartition des salons par statut.
  const [statutRows]: any = await pool.query('SELECT statut, COUNT(*) AS n FROM salons GROUP BY statut');
  const parStatut: Record<string, number> = { en_attente: 0, actif: 0, suspendu: 0, expire: 0 };
  for (const r of statutRows) parStatut[r.statut] = Number(r.n);

  return {
    totalSalons,
    totalClients,
    totalReservations,
    rdvAujourdhui,
    salonsActifs: parStatut.actif,
    salonsSuspendus: parStatut.suspendu,
    salonsEnAttente: parStatut.en_attente,
    salonsExpires: parStatut.expire,
    revenusAbonnements,
    revenusPrestations,
    revenusEstimes: revenusAbonnements + revenusPrestations,
    nouveauxSalonsCeMois,
  };
}

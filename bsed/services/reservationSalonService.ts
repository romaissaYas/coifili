import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { chargerPrestationDuSalon, verifierDisponibilite, addMinutesToTime } from '../utils/disponibilite';
import { envoyerEmailStatutReservation } from './reservationMailer';

/**
 * Gestion des réservations par le SALON propriétaire (espace coiffeur).
 * Fonctionnalité ADDITIVE : n'altère ni /api/rendezvous ni le service existant.
 * Chaque opération vérifie la propriété (rendez-vous du salon connecté).
 */

const LIST_SELECT = `
  r.id, r.reference, r.client_nom, r.client_prenom, r.client_email, r.client_telephone,
  r.date, r.heure_debut, r.heure_fin, r.duree, r.prix, r.statut, r.no_show, r.vue_coiffeur,
  r.created_at, r.confirmed_at, r.cancelled_at, r.completed_at, r.cancellation_reason, r.notes,
  r.prestation_id, r.employe_id,
  p.nom AS prestation_nom, e.nom AS employe_nom
`;

/** Charge un rendez-vous et vérifie qu'il appartient bien au salon. */
async function assertProprietaire(salonId: number, id: number) {
  const [rows]: any = await pool.query('SELECT * FROM rendezvous WHERE id = ?', [id]);
  const rdv = rows[0];
  if (!rdv) throw new ServiceError(404, 'Réservation introuvable.');
  if (rdv.salon_id !== salonId) throw new ServiceError(403, "Cette réservation n'appartient pas à votre salon.");
  return rdv;
}

type Filtres = {
  statut?: string;
  employe_id?: number;
  prestation_id?: number;
  q?: string;
  periode?: 'today' | 'tomorrow' | 'week' | 'month';
  date?: string;
};

export async function listerReservations(salonId: number, filtres: Filtres) {
  const conditions: string[] = ['r.salon_id = ?'];
  const values: any[] = [salonId];

  if (filtres.statut === 'no_show') {
    conditions.push('r.no_show = 1');
  } else if (filtres.statut) {
    conditions.push('r.statut = ? AND r.no_show = 0');
    values.push(filtres.statut);
  }
  if (filtres.employe_id) {
    conditions.push('r.employe_id = ?');
    values.push(filtres.employe_id);
  }
  if (filtres.prestation_id) {
    conditions.push('r.prestation_id = ?');
    values.push(filtres.prestation_id);
  }
  if (filtres.date) {
    conditions.push('r.date = ?');
    values.push(filtres.date);
  } else if (filtres.periode === 'today') {
    conditions.push('r.date = CURDATE()');
  } else if (filtres.periode === 'tomorrow') {
    conditions.push('r.date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)');
  } else if (filtres.periode === 'week') {
    conditions.push('YEARWEEK(r.date, 1) = YEARWEEK(CURDATE(), 1)');
  } else if (filtres.periode === 'month') {
    conditions.push('YEAR(r.date) = YEAR(CURDATE()) AND MONTH(r.date) = MONTH(CURDATE())');
  }
  if (filtres.q) {
    conditions.push('(r.client_nom LIKE ? OR r.client_prenom LIKE ? OR r.client_telephone LIKE ? OR r.client_email LIKE ? OR r.reference LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like, like, like);
  }

  const [rows] = await pool.query(
    `SELECT ${LIST_SELECT}
     FROM rendezvous r
     JOIN prestations p ON p.id = r.prestation_id
     LEFT JOIN employes e ON e.id = r.employe_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY r.date DESC, r.heure_debut DESC`,
    values
  );
  return rows;
}

export async function obtenirReservation(salonId: number, id: number) {
  await assertProprietaire(salonId, id);
  const [rows]: any = await pool.query(
    `SELECT ${LIST_SELECT}
     FROM rendezvous r
     JOIN prestations p ON p.id = r.prestation_id
     LEFT JOIN employes e ON e.id = r.employe_id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
}

export async function confirmer(salonId: number, id: number) {
  await assertProprietaire(salonId, id);
  await pool.execute("UPDATE rendezvous SET statut = 'confirme', confirmed_at = NOW(), no_show = 0 WHERE id = ?", [id]);
  void envoyerEmailStatutReservation(id, 'confirme');
  return obtenirReservation(salonId, id);
}

export async function annuler(salonId: number, id: number, motif?: string) {
  await assertProprietaire(salonId, id);
  await pool.execute("UPDATE rendezvous SET statut = 'annule', cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?", [motif ?? null, id]);
  void envoyerEmailStatutReservation(id, 'annule', motif ?? null);
  return obtenirReservation(salonId, id);
}

export async function terminer(salonId: number, id: number) {
  await assertProprietaire(salonId, id);
  await pool.execute("UPDATE rendezvous SET statut = 'termine', completed_at = NOW(), no_show = 0 WHERE id = ?", [id]);
  return obtenirReservation(salonId, id);
}

export async function marquerAbsent(salonId: number, id: number) {
  await assertProprietaire(salonId, id);
  await pool.execute('UPDATE rendezvous SET no_show = 1 WHERE id = ?', [id]);
  return obtenirReservation(salonId, id);
}

export async function mettreAJourCreneau(
  salonId: number,
  id: number,
  data: { date: string; heureDebut: string; employeId?: number | null }
) {
  const rdv = await assertProprietaire(salonId, id);
  const prestation = await chargerPrestationDuSalon(salonId, rdv.prestation_id);
  if (!prestation) throw new ServiceError(400, 'Prestation introuvable pour ce salon.');

  const dispoError = await verifierDisponibilite({
    salonId,
    prestation,
    employeId: data.employeId ?? null,
    date: data.date,
    heureDebut: data.heureDebut,
    excludeRendezvousId: id,
  });
  if (dispoError) throw new ServiceError(dispoError.status, dispoError.error);

  const heureFin = addMinutesToTime(data.heureDebut, prestation.duree);
  await pool.execute(
    'UPDATE rendezvous SET date = ?, heure_debut = ?, heure_fin = ?, employe_id = ? WHERE id = ?',
    [data.date, data.heureDebut, heureFin, data.employeId ?? null, id]
  );
  void envoyerEmailStatutReservation(id, 'modifie');
  return obtenirReservation(salonId, id);
}

/** Marque une réservation comme « consultée » par le coiffeur (retire le vert). */
export async function marquerVue(salonId: number, id: number) {
  await assertProprietaire(salonId, id);
  await pool.execute('UPDATE rendezvous SET vue_coiffeur = 1 WHERE id = ?', [id]);
  return obtenirReservation(salonId, id);
}

export async function mettreAJourNotes(salonId: number, id: number, notes: string) {
  await assertProprietaire(salonId, id);
  await pool.execute('UPDATE rendezvous SET notes = ? WHERE id = ?', [notes ?? null, id]);
  return obtenirReservation(salonId, id);
}

export async function supprimer(salonId: number, id: number) {
  const rdv = await assertProprietaire(salonId, id);
  if (rdv.statut !== 'annule') {
    throw new ServiceError(409, 'Seule une réservation annulée peut être supprimée.');
  }
  await pool.execute('DELETE FROM rendezvous WHERE id = ?', [id]);
}

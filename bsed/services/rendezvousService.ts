import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import {
  chargerPrestationDuSalon,
  verifierDisponibilite,
  reserverAvecVerrou,
  addMinutesToTime,
  calculerCreneauxDisponibles,
} from '../utils/disponibilite';
import { normalizeTime } from '../utils/dateTime';
import { envoyerEmailsReservation } from './reservationMailer';
import { creerNotificationReservation } from './notificationSalonService';
import { logger } from '../utils/logger';

type RendezVousDateHeure = {
  employeId?: number | null;
  date: string;
  heureDebut: string;
  commentaire?: string | null;
};

type CreerRendezVousInput = RendezVousDateHeure & {
  salonId: number;
  prestationId: number;
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
  // Compte client si la réservation est faite en étant connecté (sinon null :
  // réservation invité, comportement public inchangé).
  userId?: number | null;
};

/**
 * Crée un rendez-vous après avoir vérifié que la prestation existe pour ce
 * salon et que le créneau demandé est disponible (horaires, chevauchement,
 * passé...). Le prix et la durée sont figés au moment de la réservation
 * (snapshot de la prestation), pour ne pas être affectés par une
 * modification ultérieure de la prestation.
 */
export async function creerRendezVous(input: CreerRendezVousInput): Promise<{ id: number; reference: string }> {
  const { salonId, prestationId, employeId, clientNom, clientPrenom, clientEmail, clientTelephone, date, heureDebut, commentaire, userId } = input;

  // Lectures de référence (salon actif, prestation) hors verrou.
  const [salonRows]: any = await pool.execute('SELECT statut FROM salons WHERE id = ?', [salonId]);
  if (!salonRows[0] || salonRows[0].statut !== 'actif') {
    throw new ServiceError(404, "Ce salon n'est pas disponible à la réservation.");
  }
  const prestation = await chargerPrestationDuSalon(salonId, prestationId);
  if (!prestation) {
    throw new ServiceError(400, "Cette prestation n'existe pas pour ce salon.");
  }

  // Contrôle de disponibilité + insertion dans UNE transaction protégée par un
  // verrou tenu jusqu'après le COMMIT : deux réservations simultanées sur le
  // même créneau sont sérialisées, la seconde est rejetée (409). Plus de double
  // réservation possible.
  const { id, reference } = await reserverAvecVerrou(salonId, employeId ?? null, date, async (conn) => {
    const dispoError = await verifierDisponibilite({
      salonId,
      prestation,
      employeId: employeId ?? null,
      date,
      heureDebut,
      executor: conn,
    });
    if (dispoError) {
      throw new ServiceError(dispoError.status, dispoError.error);
    }

    const heureFin = addMinutesToTime(heureDebut, prestation.duree);

    const [result]: any = await conn.execute(
      `INSERT INTO rendezvous
        (salon_id, employe_id, user_id, prestation_id, client_nom, client_prenom, client_email, client_telephone,
         date, heure_debut, heure_fin, duree, prix, statut, commentaire)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', ?)`,
      [
        salonId, employeId ?? null, userId ?? null, prestationId,
        clientNom, clientPrenom, clientEmail, clientTelephone,
        date, heureDebut, heureFin, prestation.duree, prestation.prix,
        commentaire ?? null,
      ]
    );

    // Numéro de réservation public, dérivé de l'id (ex. CF-000123).
    const newId = result.insertId;
    const ref = `CF-${String(newId).padStart(6, '0')}`;
    await conn.execute('UPDATE rendezvous SET reference = ? WHERE id = ?', [ref, newId]);
    return { id: newId, reference: ref };
  });

  logger.info(`[creerRendezVous] réservation ${reference} enregistrée (id=${id}, salon=${salonId}) — déclenchement des emails.`);

  // Emails de confirmation (client + salon), en « fire-and-forget » : un échec
  // d'envoi est journalisé mais n'annule JAMAIS la réservation déjà créée.
  void envoyerEmailsReservation({
    salonId, prestationId, employeId: employeId ?? null, reference,
    date, heureDebut, clientNom, clientPrenom, clientEmail, clientTelephone,
  }).catch((err) => logger.error({ err: err }, '[creerRendezVous] envoi emails échoué :'));

  // Notification in-app pour l'Espace Coiffeur (fire-and-forget : un échec est
  // journalisé mais n'affecte jamais la réservation déjà créée).
  void creerNotificationReservation({
    salonId,
    rendezvousId: id,
    reference,
    clientNom: [clientPrenom, clientNom].filter(Boolean).join(' '),
    prestationId,
    date,
    heureDebut,
  }).catch((err) => logger.error({ err: err }, '[creerRendezVous] notification échouée :'));

  return { id, reference };
}

/**
 * Créneaux de début disponibles (public) pour une prestation d'un salon à une
 * date donnée, éventuellement pour un employé précis.
 */
export async function creneauxDisponibles(
  salonId: number,
  prestationId: number,
  date: string,
  employeId: number | null
): Promise<string[]> {
  const prestation = await chargerPrestationDuSalon(salonId, prestationId);
  if (!prestation) {
    throw new ServiceError(400, "Cette prestation n'existe pas pour ce salon.");
  }
  return calculerCreneauxDisponibles({ salonId, prestation, date, employeId });
}

/** Agenda du salon : tous les rendez-vous avec prestation/employé joints. */
export async function listerRendezVousDuSalon(salonId: number) {
  const [rows] = await pool.execute(
    `SELECT
       r.id, r.date, r.heure_debut, r.heure_fin, r.duree, r.prix, r.statut, r.commentaire,
       r.client_nom, r.client_prenom, r.client_email, r.client_telephone,
       r.employe_id, e.nom AS employe_nom,
       r.prestation_id, p.nom AS prestation_nom
     FROM rendezvous r
     JOIN prestations p ON p.id = r.prestation_id
     LEFT JOIN employes e ON e.id = r.employe_id
     WHERE r.salon_id = ?
     ORDER BY r.date ASC, r.heure_debut ASC`,
    [salonId]
  );
  return rows;
}

/** Statistiques du tableau de bord (RDV et chiffre d'affaires jour/semaine/mois, nouveaux clients, prestations populaires). */
export async function calculerStatistiques(salonId: number) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Semaine ISO en cours (lundi -> dimanche).
  const jsDay = now.getDay(); // 0 = dimanche
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const [[rdvAujourdhui]]: any = await pool.execute(
    "SELECT COUNT(*) AS total FROM rendezvous WHERE salon_id = ? AND date = ? AND statut != 'annule'",
    [salonId, today]
  );
  const [[rdvSemaine]]: any = await pool.execute(
    "SELECT COUNT(*) AS total FROM rendezvous WHERE salon_id = ? AND date BETWEEN ? AND ? AND statut != 'annule'",
    [salonId, mondayStr, sundayStr]
  );
  const [[rdvMois]]: any = await pool.execute(
    "SELECT COUNT(*) AS total FROM rendezvous WHERE salon_id = ? AND YEAR(date) = ? AND MONTH(date) = ? AND statut != 'annule'",
    [salonId, year, month]
  );
  const [[caJour]]: any = await pool.execute(
    "SELECT COALESCE(SUM(prix), 0) AS total FROM rendezvous WHERE salon_id = ? AND date = ? AND statut != 'annule'",
    [salonId, today]
  );
  const [[caMois]]: any = await pool.execute(
    "SELECT COALESCE(SUM(prix), 0) AS total FROM rendezvous WHERE salon_id = ? AND YEAR(date) = ? AND MONTH(date) = ? AND statut != 'annule'",
    [salonId, year, month]
  );
  // Nouveau client = son tout premier rendez-vous (jamais annulé) dans ce
  // salon tombe ce mois-ci (identifié par email).
  const [[nouveauxClients]]: any = await pool.execute(
    `SELECT COUNT(*) AS total FROM (
       SELECT client_email, MIN(date) AS premiere_date
       FROM rendezvous
       WHERE salon_id = ? AND statut != 'annule'
       GROUP BY client_email
     ) premiers
     WHERE YEAR(premiere_date) = ? AND MONTH(premiere_date) = ?`,
    [salonId, year, month]
  );
  const [prestationsPopulaires]: any = await pool.execute(
    `SELECT p.nom, COUNT(*) AS total
     FROM rendezvous r
     JOIN prestations p ON p.id = r.prestation_id
     WHERE r.salon_id = ? AND r.statut != 'annule'
     GROUP BY p.id, p.nom
     ORDER BY total DESC
     LIMIT 5`,
    [salonId]
  );

  return {
    rdvAujourdhui: rdvAujourdhui.total,
    rdvSemaine: rdvSemaine.total,
    rdvMois: rdvMois.total,
    chiffreAffairesJour: caJour.total,
    chiffreAffairesMois: caMois.total,
    nouveauxClientsMois: nouveauxClients.total,
    prestationsPopulaires,
  };
}

type ModifierRendezVousInput = RendezVousDateHeure & {
  id: number;
  salonId: number;
  clientNom: string;
  clientPrenom: string;
  clientEmail: string;
  clientTelephone: string;
};

/**
 * Modifie un rendez-vous (date/heure/employé/coordonnées client). La
 * prestation et le salon d'origine ne changent pas ; la disponibilité est
 * re-vérifiée en excluant le rendez-vous lui-même du contrôle de
 * chevauchement (il peut légitimement rester sur le même créneau).
 */
export async function modifierRendezVous(input: ModifierRendezVousInput): Promise<void> {
  const { id, salonId, employeId, clientNom, clientPrenom, clientEmail, clientTelephone, date, heureDebut, commentaire } = input;

  const [rows]: any = await pool.execute('SELECT prestation_id FROM rendezvous WHERE id = ?', [id]);
  const existing = rows[0];
  if (!existing) {
    throw new ServiceError(404, 'Rendez-vous introuvable.');
  }
  const prestation = await chargerPrestationDuSalon(salonId, existing.prestation_id);
  if (!prestation) {
    throw new ServiceError(400, "La prestation associée à ce rendez-vous est introuvable pour ce salon.");
  }

  await reserverAvecVerrou(salonId, employeId ?? null, date, async (conn) => {
    const dispoError = await verifierDisponibilite({
      salonId,
      prestation,
      employeId: employeId ?? null,
      date,
      heureDebut,
      excludeRendezvousId: id,
      executor: conn,
    });
    if (dispoError) {
      throw new ServiceError(dispoError.status, dispoError.error);
    }

    const heureFin = addMinutesToTime(heureDebut, prestation.duree);

    await conn.execute(
      `UPDATE rendezvous
       SET employe_id = ?, client_nom = ?, client_prenom = ?, client_email = ?, client_telephone = ?,
           date = ?, heure_debut = ?, heure_fin = ?, commentaire = ?
       WHERE id = ?`,
      [
        employeId ?? null, clientNom, clientPrenom, clientEmail, clientTelephone,
        date, heureDebut, heureFin, commentaire ?? null, id,
      ]
    );
  });
}

/** Change le statut d'un rendez-vous (en_attente, confirme, termine, annule). */
export async function changerStatutRendezVous(id: number, statut: string): Promise<void> {
  await pool.execute('UPDATE rendezvous SET statut = ? WHERE id = ?', [statut, id]);
}

/** Annulation "douce" (statut = annule) : préserve l'historique du salon. */
export async function annulerRendezVous(id: number): Promise<void> {
  await pool.execute("UPDATE rendezvous SET statut = 'annule' WHERE id = ?", [id]);
}

// ---------------------------------------------------------------------------
// Espace client (P7) : un client ne manipule que SES propres réservations
// (celles dont user_id correspond à son compte).
// ---------------------------------------------------------------------------

/** Liste les réservations d'un client, avec salon/prestation/employé joints. */
export async function listerMesReservations(userId: number) {
  const [rows] = await pool.execute(
    `SELECT
       r.id, r.date, r.heure_debut, r.heure_fin, r.duree, r.prix, r.statut, r.reference,
       r.commentaire, r.salon_id, s.nom AS salon_nom, s.ville AS salon_ville, s.wilaya AS salon_wilaya,
       r.employe_id, e.nom AS employe_nom,
       r.prestation_id, p.nom AS prestation_nom
     FROM rendezvous r
     JOIN prestations p ON p.id = r.prestation_id
     LEFT JOIN salons s ON s.id = r.salon_id
     LEFT JOIN employes e ON e.id = r.employe_id
     WHERE r.user_id = ?
     ORDER BY r.date DESC, r.heure_debut DESC`,
    [userId]
  );
  return rows;
}

/**
 * Charge un rendez-vous et vérifie qu'il appartient bien au client. Vérifie
 * aussi qu'il est encore modifiable/annulable par le client (statut actif +
 * dans le futur). Renvoie la ligne pour usage interne.
 */
async function chargerReservationModifiable(userId: number, rdvId: number): Promise<any> {
  const [rows]: any = await pool.execute(
    'SELECT id, salon_id, prestation_id, statut, date, heure_debut, user_id FROM rendezvous WHERE id = ?',
    [rdvId]
  );
  const rdv = rows[0];
  if (!rdv) throw new ServiceError(404, 'Rendez-vous introuvable.');
  // Contrôle de propriété : la réservation doit appartenir au client.
  if (rdv.user_id !== userId) {
    throw new ServiceError(403, "Vous n'avez pas accès à ce rendez-vous.");
  }
  if (rdv.statut === 'annule') throw new ServiceError(400, 'Ce rendez-vous est déjà annulé.');
  if (rdv.statut === 'termine') throw new ServiceError(400, 'Ce rendez-vous est déjà terminé.');

  const debut = new Date(`${rdv.date}T${normalizeTime(rdv.heure_debut)}`);
  if (Number.isNaN(debut.getTime()) || debut.getTime() <= Date.now()) {
    throw new ServiceError(400, 'Ce rendez-vous est passé et ne peut plus être modifié.');
  }
  return rdv;
}

/** Annulation par le client de sa propre réservation (règles respectées). */
export async function annulerMaReservation(userId: number, rdvId: number): Promise<void> {
  await chargerReservationModifiable(userId, rdvId);
  await pool.execute("UPDATE rendezvous SET statut = 'annule' WHERE id = ?", [rdvId]);
}

/**
 * Reprogrammation par le client (date/heure/employé). La prestation — donc le
 * prix et la durée — reste figée. La disponibilité est re-vérifiée avec la
 * même logique métier que partout ailleurs.
 */
export async function reprogrammerMaReservation(
  userId: number,
  rdvId: number,
  input: { date: string; heureDebut: string; employeId?: number | null }
): Promise<void> {
  const rdv = await chargerReservationModifiable(userId, rdvId);

  const prestation = await chargerPrestationDuSalon(rdv.salon_id, rdv.prestation_id);
  if (!prestation) {
    throw new ServiceError(400, 'La prestation associée à ce rendez-vous est introuvable.');
  }

  await reserverAvecVerrou(rdv.salon_id, input.employeId ?? null, input.date, async (conn) => {
    const dispoError = await verifierDisponibilite({
      salonId: rdv.salon_id,
      prestation,
      employeId: input.employeId ?? null,
      date: input.date,
      heureDebut: input.heureDebut,
      excludeRendezvousId: rdvId,
      executor: conn,
    });
    if (dispoError) {
      throw new ServiceError(dispoError.status, dispoError.error);
    }

    const heureFin = addMinutesToTime(input.heureDebut, prestation.duree);
    await conn.execute(
      'UPDATE rendezvous SET employe_id = ?, date = ?, heure_debut = ?, heure_fin = ? WHERE id = ?',
      [input.employeId ?? null, input.date, input.heureDebut, heureFin, rdvId]
    );
  });
}

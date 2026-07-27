import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { env } from '../config/env';
import { ServiceError } from '../utils/ServiceError';
import { isValidId, isValidCalendarDate } from '../validation';
import * as rendezvousService from '../services/rendezvousService';
import { logger } from '../utils/logger';

function handleError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, fallback);
  res.status(500).json({ error: 'Erreur serveur' });
}

/**
 * Récupère l'id du client à partir du token SI un token valide est présent.
 * La route de création reste publique (réservation invité possible) : un
 * token présent enrichit simplement la réservation avec le compte client.
 */
function getOptionalUserId(req: Request): number | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId?: number };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

// 📅 Créer un rendez-vous — route volontairement publique : le cahier des
// charges impose une prise de rendez-vous possible sans compte ni connexion.
// salon_id est donc légitimement fourni par le client (il navigue et choisit
// un salon public), contrairement aux routes du dashboard coiffeur où le
// salon est toujours dérivé du token.
export async function creer(req: Request, res: Response): Promise<void> {
  try {
    const {
      salon_id, prestation_id, employe_id,
      client_nom, client_prenom, client_email, client_telephone,
      date, heure_debut, commentaire,
    } = req.body;

    const { id, reference } = await rendezvousService.creerRendezVous({
      salonId: salon_id,
      prestationId: prestation_id,
      employeId: employe_id,
      clientNom: client_nom,
      clientPrenom: client_prenom,
      clientEmail: client_email,
      clientTelephone: client_telephone,
      date,
      heureDebut: heure_debut,
      commentaire,
      userId: getOptionalUserId(req),
    });

    res.status(201).json({ message: 'Rendez-vous enregistré avec succès', id, reference });
  } catch (error) {
    handleError(res, error, "Erreur lors de la création du rendez-vous :");
  }
}

// 🕑 Créneaux de début disponibles (public) — utilisé par le parcours de
// réservation client pour n'afficher que des créneaux réellement réservables.
export async function creneaux(req: Request, res: Response): Promise<void> {
  const salonId = Number(req.query.salon_id);
  const prestationId = Number(req.query.prestation_id);
  const date = String(req.query.date ?? '');
  const employeIdRaw = req.query.employe_id;
  const employeId = employeIdRaw ? Number(employeIdRaw) : null;

  if (!isValidId(salonId) || !isValidId(prestationId) || !isValidCalendarDate(date)) {
    res.status(400).json({ error: 'Paramètres invalides : salon_id, prestation_id et date (AAAA-MM-JJ) sont requis.' });
    return;
  }
  if (employeIdRaw && !isValidId(employeId)) {
    res.status(400).json({ error: 'employe_id invalide.' });
    return;
  }

  try {
    const creneauxDispo = await rendezvousService.creneauxDisponibles(salonId, prestationId, date, employeId);
    res.status(200).json({ creneaux: creneauxDispo });
  } catch (error) {
    handleError(res, error, 'Erreur lors du calcul des créneaux disponibles :');
  }
}

// 📋 Lister les rendez-vous du salon de l'utilisateur authentifié (agenda).
export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rows = await rendezvousService.listerRendezVousDuSalon(req.salonId!);
    res.status(200).json(rows);
  } catch (error) {
    handleError(res, error, 'Erreur lors de la récupération des rendez-vous :');
  }
}

// 📊 Statistiques du tableau de bord pour le salon de l'utilisateur authentifié.
export async function stats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const resultat = await rendezvousService.calculerStatistiques(req.salonId!);
    res.status(200).json(resultat);
  } catch (error) {
    handleError(res, error, 'Erreur lors du calcul des statistiques :');
  }
}

// ✏️ Modifier un rendez-vous (date/heure/employé/coordonnées client), avec
// re-vérification complète de la disponibilité.
export async function modifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      employe_id, client_nom, client_prenom, client_email, client_telephone,
      date, heure_debut, commentaire,
    } = req.body;

    await rendezvousService.modifierRendezVous({
      id: Number(id),
      salonId: req.salonId!,
      employeId: employe_id,
      clientNom: client_nom,
      clientPrenom: client_prenom,
      clientEmail: client_email,
      clientTelephone: client_telephone,
      date,
      heureDebut: heure_debut,
      commentaire,
    });

    res.status(200).json({ message: 'Rendez-vous modifié avec succès' });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la modification du rendez-vous :');
  }
}

// 🔄 Changer le statut d'un rendez-vous (en_attente, confirme, termine, annule).
export async function changerStatut(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    await rendezvousService.changerStatutRendezVous(Number(id), statut);
    res.status(200).json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    handleError(res, error, 'Erreur lors du changement de statut :');
  }
}

// ❌ Annuler un rendez-vous. Annulation "douce" (statut = annule) plutôt que
// suppression physique, afin de conserver l'historique pour les futures
// statistiques/revenus du salon.
export async function annuler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await rendezvousService.annulerRendezVous(Number(id));
    res.status(200).json({ message: 'Rendez-vous annulé avec succès' });
  } catch (error) {
    handleError(res, error, "Erreur lors de l'annulation du rendez-vous :");
  }
}

// -------- Espace client (P7) : le client ne gère que ses réservations -------

// 📋 Historique des réservations du client connecté.
export async function mesReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rows = await rendezvousService.listerMesReservations(req.userId!);
    res.status(200).json(rows);
  } catch (error) {
    handleError(res, error, 'Erreur lors de la récupération de vos réservations :');
  }
}

// ❌ Annulation par le client de sa propre réservation.
export async function annulerMienne(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await rendezvousService.annulerMaReservation(req.userId!, Number(req.params.id));
    res.status(200).json({ message: 'Rendez-vous annulé avec succès' });
  } catch (error) {
    handleError(res, error, "Erreur lors de l'annulation de votre rendez-vous :");
  }
}

// 🔁 Reprogrammation par le client (date/heure/employé).
export async function reprogrammerMienne(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, heure_debut, employe_id } = req.body;
    await rendezvousService.reprogrammerMaReservation(req.userId!, Number(req.params.id), {
      date,
      heureDebut: heure_debut,
      employeId: employe_id,
    });
    res.status(200).json({ message: 'Rendez-vous reprogrammé avec succès' });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la reprogrammation de votre rendez-vous :');
  }
}

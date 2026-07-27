import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as service from '../services/reservationSalonService';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Réservation salon (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

const id = (req: AuthenticatedRequest) => Number(req.params.id);
const sid = (req: AuthenticatedRequest) => req.salonId!;

export async function lister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { statut, employe_id, prestation_id, q, periode, date } = req.query;
    res.json(
      await service.listerReservations(sid(req), {
        statut: typeof statut === 'string' ? statut : undefined,
        employe_id: employe_id ? Number(employe_id) : undefined,
        prestation_id: prestation_id ? Number(prestation_id) : undefined,
        q: typeof q === 'string' ? q : undefined,
        periode: typeof periode === 'string' ? (periode as any) : undefined,
        date: typeof date === 'string' ? date : undefined,
      })
    );
  } catch (e) {
    fail(res, e, 'lister');
  }
}

export async function obtenir(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.obtenirReservation(sid(req), id(req)));
  } catch (e) {
    fail(res, e, 'obtenir');
  }
}

export async function confirmer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.confirmer(sid(req), id(req)));
  } catch (e) {
    fail(res, e, 'confirmer');
  }
}

export async function annuler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.annuler(sid(req), id(req), req.body?.motif));
  } catch (e) {
    fail(res, e, 'annuler');
  }
}

export async function terminer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.terminer(sid(req), id(req)));
  } catch (e) {
    fail(res, e, 'terminer');
  }
}

export async function absent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.marquerAbsent(sid(req), id(req)));
  } catch (e) {
    fail(res, e, 'absent');
  }
}

export async function mettreAJour(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { date, heure_debut, employe_id } = req.body;
    res.json(
      await service.mettreAJourCreneau(sid(req), id(req), {
        date,
        heureDebut: heure_debut,
        employeId: employe_id != null ? Number(employe_id) : null,
      })
    );
  } catch (e) {
    fail(res, e, 'mettreAJour');
  }
}

export async function marquerVue(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.marquerVue(sid(req), id(req)));
  } catch (e) {
    fail(res, e, 'marquerVue');
  }
}

export async function notes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    res.json(await service.mettreAJourNotes(sid(req), id(req), req.body?.notes ?? ''));
  } catch (e) {
    fail(res, e, 'notes');
  }
}

export async function supprimer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await service.supprimer(sid(req), id(req));
    res.status(204).send();
  } catch (e) {
    fail(res, e, 'supprimer');
  }
}

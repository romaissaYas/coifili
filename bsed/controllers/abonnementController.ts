import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as abonnementService from '../services/abonnementService';
import * as auditService from '../services/auditService';
import { CibPaymentProvider } from '../services/payment';
import { env } from '../config/env';
import { logger } from '../utils/logger';

function fail(res: Response, error: unknown, contexte: string): void {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, `Abonnement (${contexte}) :`);
  res.status(500).json({ error: 'Erreur serveur' });
}

// --- Public / salon ---
export async function plans(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await abonnementService.listerPlans());
  } catch (e) {
    fail(res, e, 'plans');
  }
}

export async function mine(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const data = await abonnementService.getAbonnementSalon(req.salonId!);
    // Indique au frontend si le paiement par carte est actuellement proposé
    // (cash-only tant que l'intégration SATIM n'est pas finalisée).
    res.json({ ...data, paiementCarteActive: env.paiementCarteActive });
  } catch (e) {
    fail(res, e, 'mine');
  }
}

export async function subscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { planId, methode } = req.body;
    const result = await abonnementService.souscrire(req.salonId!, Number(planId), methode);
    res.status(201).json(result);
  } catch (e) {
    fail(res, e, 'subscribe');
  }
}

// --- Admin ---
export async function adminListAbonnements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { statut, q } = req.query;
    res.json(
      await abonnementService.listerAbonnementsAdmin({
        statut: typeof statut === 'string' ? statut : undefined,
        q: typeof q === 'string' ? q : undefined,
      })
    );
  } catch (e) {
    fail(res, e, 'adminListAbonnements');
  }
}

export async function adminListPaiements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { statut } = req.query;
    res.json(await abonnementService.listerPaiementsAdmin({ statut: typeof statut === 'string' ? statut : undefined }));
  } catch (e) {
    fail(res, e, 'adminListPaiements');
  }
}

export async function adminValiderPaiement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const result = await abonnementService.validerPaiementEspeces(id, req.userId);
    void auditService.logAction({ userId: req.userId, action: 'PAYMENT_VALIDATE', entityType: 'payment', entityId: id, ip: req.ip });
    res.json(result);
  } catch (e) {
    fail(res, e, 'adminValiderPaiement');
  }
}

export async function adminChangerPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const salonId = Number(req.params.id);
    const planId = Number(req.body?.planId);
    if (!Number.isInteger(planId) || planId <= 0) {
      res.status(400).json({ error: 'planId invalide.' });
      return;
    }
    const result = await abonnementService.changerPlan(salonId, planId, req.userId);
    void auditService.logAction({ userId: req.userId, action: 'SALON_PLAN_CHANGE', entityType: 'salon', entityId: salonId, ip: req.ip, details: { planId } });
    res.json(result);
  } catch (e) {
    fail(res, e, 'adminChangerPlan');
  }
}

export async function adminProlonger(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const salonId = Number(req.params.id);
    const mois = Number(req.body?.mois);
    const result = await abonnementService.prolongerAbonnement(salonId, mois, req.userId);
    void auditService.logAction({ userId: req.userId, action: 'SALON_EXTEND', entityType: 'salon', entityId: salonId, ip: req.ip, details: { mois } });
    res.json(result);
  } catch (e) {
    fail(res, e, 'adminProlonger');
  }
}

export async function adminRefuserPaiement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    await abonnementService.refuserPaiement(id);
    void auditService.logAction({ userId: req.userId, action: 'PAYMENT_REFUSE', entityType: 'payment', entityId: id, ip: req.ip });
    res.json({ message: 'Paiement refusé.' });
  } catch (e) {
    fail(res, e, 'adminRefuserPaiement');
  }
}

// --- Webhook passerelle carte (CIB/SATIM) ---
// Public mais AUTHENTIFIÉ par signature HMAC (en-tête X-Signature) : la
// passerelle notifie le résultat du paiement, qui active l'abonnement.
export async function cibWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {});
    const signature = req.header('X-Signature') ?? req.header('x-signature');
    if (!CibPaymentProvider.verifierSignatureWebhook(rawBody, signature)) {
      res.status(401).json({ error: 'Signature invalide.' });
      return;
    }
    const { reference, paid } = CibPaymentProvider.analyserWebhook(req.body ?? {});
    if (!reference) {
      res.status(400).json({ error: 'Référence de paiement manquante.' });
      return;
    }
    if (!paid) {
      // Paiement non abouti : on accuse réception sans activer.
      res.status(200).json({ received: true, activated: false });
      return;
    }
    await abonnementService.confirmerPaiementCarteParReference(reference);
    void auditService.logAction({ userId: null, action: 'PAYMENT_CARD_CONFIRMED', entityType: 'payment', ip: req.ip, details: { reference } });
    res.status(200).json({ received: true, activated: true });
  } catch (e) {
    fail(res, e, 'cibWebhook');
  }
}

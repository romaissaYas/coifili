import express from 'express';
import { authMiddleware, attachSalonOwnership } from '../middleware/auth';
import { validateBody, souscrireSchema } from '../validation';
import * as abonnementController from '../controllers/abonnementController';

const router = express.Router();

// Liste publique des plans d'abonnement.
router.get('/plans', abonnementController.plans);

// Webhook passerelle carte (CIB/SATIM) : public, authentifié par signature HMAC
// (voir CibPaymentProvider.verifierSignatureWebhook). Active l'abonnement.
router.post('/cib/webhook', abonnementController.cibWebhook);

// Espace salon : « Mon abonnement » + souscription.
// attachSalonOwnership (et non requireSalonOwnership) : un salon `en_attente`
// doit pouvoir consulter/souscrire pour s'activer.
router.get('/mine', authMiddleware, attachSalonOwnership, abonnementController.mine);
router.post('/subscribe', authMiddleware, attachSalonOwnership, validateBody(souscrireSchema), abonnementController.subscribe);

export default router;

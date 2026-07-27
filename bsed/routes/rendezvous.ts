import express from 'express';
import {
  authMiddleware,
  requireSalonOwnership,
  requireOwnedResource,
} from '../middleware/auth';
import {
  validateBody,
  validateIdParam,
  rendezvousCreateSchema,
  rendezvousUpdateSchema,
  statutSchema,
  reprogrammationSchema,
} from '../validation';
import * as rendezvousController from '../controllers/rendezvousController';

const router = express.Router();

router.post('/', validateBody(rendezvousCreateSchema), rendezvousController.creer);

// Route publique (parcours de réservation client) : renvoie les créneaux
// réellement disponibles. Montée avant les routes /:id pour éviter toute
// ambiguïté de routage.
router.get('/creneaux-disponibles', rendezvousController.creneaux);

router.get('/', authMiddleware, requireSalonOwnership, rendezvousController.lister);

// Montée avant toute route /:id pour éviter toute ambiguïté de routage.
router.get('/stats', authMiddleware, requireSalonOwnership, rendezvousController.stats);

// --- Espace client (P7) : réservations du client connecté ---
// Auth simple (pas de salon) : la propriété est vérifiée par user_id dans le
// service. Montées avant les routes /:id.
router.get('/mine', authMiddleware, rendezvousController.mesReservations);

router.patch(
  '/mine/:id/annuler',
  authMiddleware,
  validateIdParam('id'),
  rendezvousController.annulerMienne
);

router.put(
  '/mine/:id',
  authMiddleware,
  validateIdParam('id'),
  validateBody(reprogrammationSchema),
  rendezvousController.reprogrammerMienne
);

router.put(
  '/:id',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  requireOwnedResource('rendezvous'),
  validateBody(rendezvousUpdateSchema),
  rendezvousController.modifier
);

router.patch(
  '/:id/statut',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  requireOwnedResource('rendezvous'),
  validateBody(statutSchema),
  rendezvousController.changerStatut
);

router.delete(
  '/:id',
  authMiddleware,
  requireSalonOwnership,
  validateIdParam('id'),
  requireOwnedResource('rendezvous'),
  rendezvousController.annuler
);

export default router;

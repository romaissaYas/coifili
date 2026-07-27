import express from 'express';
import { authMiddleware, requireSalonOwnership } from '../middleware/auth';
import { validateBody, validateIdParam, reprogrammationSchema, cancelReservationSchema, notesReservationSchema } from '../validation';
import * as controller from '../controllers/reservationSalonController';

const router = express.Router();

// Espace coiffeur : gestion de SES propres réservations.
// requireSalonOwnership dérive le salon du token ET n'autorise qu'un salon actif.
router.use(authMiddleware, requireSalonOwnership);

router.get('/', controller.lister);
router.get('/:id', validateIdParam('id'), controller.obtenir);
router.patch('/:id/confirm', validateIdParam('id'), controller.confirmer);
router.patch('/:id/cancel', validateIdParam('id'), validateBody(cancelReservationSchema), controller.annuler);
router.patch('/:id/complete', validateIdParam('id'), controller.terminer);
router.patch('/:id/no-show', validateIdParam('id'), controller.absent);
router.patch('/:id/seen', validateIdParam('id'), controller.marquerVue);
router.patch('/:id/update', validateIdParam('id'), validateBody(reprogrammationSchema), controller.mettreAJour);
router.patch('/:id/notes', validateIdParam('id'), validateBody(notesReservationSchema), controller.notes);
router.delete('/:id', validateIdParam('id'), controller.supprimer);

export default router;

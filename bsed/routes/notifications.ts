import express from 'express';
import { authMiddleware, requireSalonOwnership } from '../middleware/auth';
import { validateIdParam } from '../validation';
import * as controller from '../controllers/notificationSalonController';

const router = express.Router();

// Espace Coiffeur : chaque salon ne voit et ne gère QUE ses propres
// notifications (salonId dérivé du token par requireSalonOwnership).
router.use(authMiddleware, requireSalonOwnership);

router.get('/', controller.lister);
router.get('/page', controller.listerPage); // centre de notifications (paginé/filtré)
router.patch('/read-all', controller.marquerToutesLues);
router.patch('/:id/read', validateIdParam('id'), controller.marquerLue);
router.delete('/:id', validateIdParam('id'), controller.supprimer);

export default router;

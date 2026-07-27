import express from 'express';
import { authMiddleware, requireSalonOwnership } from '../middleware/auth';
import { validateIdParam } from '../validation';
import * as controller from '../controllers/notificationSalonController';

const router = express.Router();

// Espace Coiffeur : chaque salon ne voit et ne gère QUE ses propres
// notifications (salonId dérivé du token par requireSalonOwnership).
router.use(authMiddleware, requireSalonOwnership);

router.get('/', controller.lister);
router.patch('/read-all', controller.marquerToutesLues);
router.patch('/:id/read', validateIdParam('id'), controller.marquerLue);

export default router;

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateBody, profilSchema, changePasswordSchema, deleteAccountSchema } from '../validation';
import * as usersController from '../controllers/usersController';

const router = express.Router();

// Profil du compte connecté (client ou coiffeur). La propriété est garantie
// par le token : chaque compte n'accède qu'à ses propres informations.
router.get('/me', authMiddleware, usersController.me);
router.put('/me', authMiddleware, validateBody(profilSchema), usersController.updateMe);
router.put('/me/password', authMiddleware, validateBody(changePasswordSchema), usersController.updatePassword);

// RGPD / loi 18-07 (self-service) : export et suppression de son propre compte.
router.get('/me/export', authMiddleware, usersController.exportMe);
router.delete('/me', authMiddleware, validateBody(deleteAccountSchema), usersController.deleteMe);

export default router;

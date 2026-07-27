import express from 'express';
import { validateBody, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordWithTokenSchema } from '../validation';
import * as authController from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Montées à la racine (POST /register, POST /login) pour préserver
// exactement les chemins existants, consommés tels quels par le frontend.
// authLimiter (strict) protège ces endpoints du brute-force / énumération.
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordWithTokenSchema), authController.resetPassword);

export default router;

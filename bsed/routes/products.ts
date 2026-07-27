import express from 'express';
import { authMiddleware, requireSalonOwnership } from '../middleware/auth';
import { validateBody, validateIdParam, productSchema } from '../validation';
import * as productController from '../controllers/productController';

const router = express.Router();

// --- Public (aucune auth) ---
// '/published' AVANT '/:id' pour ne pas être capturé par la route paramétrée.
router.get('/published', productController.listerPublies);

// --- Espace salon (JWT + propriété du salon) ---
router.get('/', authMiddleware, requireSalonOwnership, productController.listerMes);
router.post('/', authMiddleware, requireSalonOwnership, validateBody(productSchema), productController.creer);
router.put('/:id', authMiddleware, requireSalonOwnership, validateIdParam('id'), validateBody(productSchema), productController.modifier);
router.delete('/:id', authMiddleware, requireSalonOwnership, validateIdParam('id'), productController.supprimer);
router.patch('/:id/publish', authMiddleware, requireSalonOwnership, validateIdParam('id'), productController.publier);
router.patch('/:id/unpublish', authMiddleware, requireSalonOwnership, validateIdParam('id'), productController.depublier);

// Détail public (produit publié). Enregistré après les routes ci-dessus.
router.get('/:id', validateIdParam('id'), productController.obtenirPublic);

export default router;

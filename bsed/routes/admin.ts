import express from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import {
  validateBody,
  validateIdParam,
  salonSchema,
  adminSalonCreateSchema,
  abonnementSchema,
  profilSchema,
  resetPasswordSchema,
  statutSchema,
} from '../validation';
import * as adminController from '../controllers/adminController';
import * as adminSalonController from '../controllers/adminSalonController';
import * as adminUserController from '../controllers/adminUserController';
import * as adminReservationController from '../controllers/adminReservationController';
import * as adminDashboardController from '../controllers/adminDashboardController';
import * as adminEmployeController from '../controllers/adminEmployeController';
import * as abonnementController from '../controllers/abonnementController';
import * as adminNotificationController from '../controllers/adminNotificationController';
import marketingRoutes from './marketing';

const router = express.Router();

// Garde globale de l'espace admin : JWT valide + rôle super_admin.
// Tout accès sans token -> 401 ; avec un token non-admin -> 403.
router.use(authMiddleware, requireSuperAdmin);

router.get('/me', adminController.me);

// --- Tableau de bord & journal (Phase 3) ---
router.get('/stats', adminDashboardController.stats);
router.get('/audit', adminDashboardController.audit);

// --- Abonnements : déclenchement manuel du traitement (Phase 4) ---
router.post('/subscriptions/run', adminDashboardController.runSubscriptions);

// --- Abonnements payants (plans/souscriptions/paiements) ---
router.get('/subscriptions', abonnementController.adminListAbonnements);
router.get('/payments', abonnementController.adminListPaiements);
router.post('/payments/:id/validate', validateIdParam('id'), abonnementController.adminValiderPaiement);
router.post('/payments/:id/refuse', validateIdParam('id'), abonnementController.adminRefuserPaiement);
router.post('/salons/:id/change-plan', validateIdParam('id'), abonnementController.adminChangerPlan);
router.post('/salons/:id/extend', validateIdParam('id'), abonnementController.adminProlonger);

// --- Gestion des salons (Phase 2) ---
router.get('/salons', adminSalonController.lister);
router.post('/salons', validateBody(adminSalonCreateSchema), adminSalonController.creer);
router.get('/salons/:id', validateIdParam('id'), adminSalonController.obtenir);
router.put('/salons/:id', validateIdParam('id'), validateBody(salonSchema), adminSalonController.modifier);
router.delete('/salons/:id', validateIdParam('id'), adminSalonController.supprimer);

// Actions de cycle de vie
router.post('/salons/:id/validate', validateIdParam('id'), adminSalonController.valider);
router.post('/salons/:id/refuse', validateIdParam('id'), adminSalonController.refuser);
router.post('/salons/:id/suspend', validateIdParam('id'), adminSalonController.suspendre);
router.post('/salons/:id/reactivate', validateIdParam('id'), adminSalonController.reactiver);

// Abonnement (dates, montant, statut de paiement)
router.put('/salons/:id/subscription', validateIdParam('id'), validateBody(abonnementSchema), adminSalonController.abonnement);

// --- Gestion des utilisateurs (Phase 3) ---
router.get('/users', adminUserController.lister);
router.get('/users/:id', validateIdParam('id'), adminUserController.obtenir);
router.put('/users/:id', validateIdParam('id'), validateBody(profilSchema), adminUserController.modifier);
router.delete('/users/:id', validateIdParam('id'), adminUserController.supprimer);
router.post('/users/:id/suspend', validateIdParam('id'), adminUserController.suspendre);
router.post('/users/:id/reactivate', validateIdParam('id'), adminUserController.reactiver);
router.post('/users/:id/reset-password', validateIdParam('id'), validateBody(resetPasswordSchema), adminUserController.reinitialiserMotDePasse);

// --- Gestion des réservations (Phase 3) ---
router.get('/reservations', adminReservationController.lister);
router.patch('/reservations/:id/statut', validateIdParam('id'), validateBody(statutSchema), adminReservationController.changerStatut);
router.post('/reservations/:id/cancel', validateIdParam('id'), adminReservationController.annuler);
router.delete('/reservations/:id', validateIdParam('id'), adminReservationController.supprimer);

// --- Gestion des employés (Phase 5) ---
router.get('/employes', adminEmployeController.lister);
router.delete('/employes/:id', validateIdParam('id'), adminEmployeController.supprimer);

// --- Notifications de l'administrateur ---
router.get('/notifications', adminNotificationController.lister);
router.get('/notifications/page', adminNotificationController.listerPage);
router.patch('/notifications/read-all', adminNotificationController.marquerToutesLues);
router.patch('/notifications/:id/read', validateIdParam('id'), adminNotificationController.marquerLue);
router.delete('/notifications/:id', validateIdParam('id'), adminNotificationController.supprimer);

// --- Module Marketing Instagram (sous /api/admin/marketing) ---
router.use('/marketing', marketingRoutes);

export default router;

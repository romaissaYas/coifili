import express from 'express';
import {
  validateBody, validateIdParam,
  igPostSchema, igReelSchema, igStorySchema, igHighlightSchema, igMediaSchema, igHashtagGroupSchema, igSettingsSchema,
  igScheduleSchema, igAiGenerateSchema, igAiImageSchema,
} from '../validation';
import * as posts from '../controllers/marketingPostController';
import { media, reels, stories, highlights, hashtags, settings, calendar, ai, meta } from '../controllers/marketingController';

/**
 * Module Marketing Instagram. Ce routeur est monté sous `/api/admin/marketing`
 * dans routes/admin.ts, APRÈS la garde globale `authMiddleware + requireSuperAdmin`
 * — toutes ces routes sont donc réservées au super administrateur.
 */
const router = express.Router();

// --- Publications ---
router.get('/posts', posts.lister);
router.get('/posts/stats', posts.stats);
router.get('/posts/:id', validateIdParam('id'), posts.obtenir);
router.post('/posts', validateBody(igPostSchema), posts.creer);
router.put('/posts/:id', validateIdParam('id'), validateBody(igPostSchema), posts.modifier);
router.delete('/posts/:id', validateIdParam('id'), posts.supprimer);
router.post('/posts/:id/duplicate', validateIdParam('id'), posts.dupliquer);

// --- Reels ---
router.get('/reels', reels.lister);
router.get('/reels/:id', validateIdParam('id'), reels.obtenir);
router.post('/reels', validateBody(igReelSchema), reels.creer);
router.put('/reels/:id', validateIdParam('id'), validateBody(igReelSchema), reels.modifier);
router.delete('/reels/:id', validateIdParam('id'), reels.supprimer);
router.post('/reels/:id/duplicate', validateIdParam('id'), reels.dupliquer);

// --- Stories ---
router.get('/stories', stories.lister);
router.get('/stories/:id', validateIdParam('id'), stories.obtenir);
router.post('/stories', validateBody(igStorySchema), stories.creer);
router.put('/stories/:id', validateIdParam('id'), validateBody(igStorySchema), stories.modifier);
router.delete('/stories/:id', validateIdParam('id'), stories.supprimer);

// --- Stories à la une (highlights) ---
router.get('/highlights', highlights.lister);
router.post('/highlights', validateBody(igHighlightSchema), highlights.creer);
router.put('/highlights/:id', validateIdParam('id'), validateBody(igHighlightSchema), highlights.modifier);
router.delete('/highlights/:id', validateIdParam('id'), highlights.supprimer);

// --- Médiathèque ---
router.get('/media', media.lister);
router.post('/media', validateBody(igMediaSchema), media.creer);
router.delete('/media/:id', validateIdParam('id'), media.supprimer);

// --- Banques de hashtags ---
router.get('/hashtags', hashtags.lister);
router.post('/hashtags', validateBody(igHashtagGroupSchema), hashtags.creer);
router.put('/hashtags/:id', validateIdParam('id'), validateBody(igHashtagGroupSchema), hashtags.modifier);
router.delete('/hashtags/:id', validateIdParam('id'), hashtags.supprimer);

// --- Paramètres (aucun secret : tokens Meta / clés IA via l'environnement) ---
router.get('/settings', settings.obtenir);
router.put('/settings', validateBody(igSettingsSchema), settings.modifier);

// --- Calendrier éditorial ---
router.get('/calendar', calendar.lister);
router.patch('/calendar/:type/:id', validateIdParam('id'), validateBody(igScheduleSchema), calendar.reprogrammer);

// --- Génération IA (active seulement si une clé est configurée dans l'env) ---
router.get('/ai/status', ai.etat);
router.post('/ai/generate', validateBody(igAiGenerateSchema), ai.generer);
router.post('/ai/image', validateBody(igAiImageSchema), ai.image);

// --- Connexion & publication Meta (OAuth Facebook/Instagram) ---
router.get('/meta/status', meta.etat);
router.get('/meta/connect-url', meta.connectUrl);
router.get('/meta/pages', meta.pages);
router.post('/meta/select-page', meta.selectPage);
router.post('/meta/disconnect', meta.disconnect);
router.post('/posts/:id/publish', validateIdParam('id'), meta.publierPost);           // Instagram seul
router.post('/posts/:id/publish-reseaux', validateIdParam('id'), meta.publierReseaux); // FB et/ou IG

export default router;

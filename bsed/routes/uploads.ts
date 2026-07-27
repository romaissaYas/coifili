import express, { Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, requireSalonOwnership } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimit';
import { uploadImage, UPLOAD_MAX_MB } from '../middleware/upload';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Traitement mutualisé : reçoit le fichier (même middleware multer que pour les
 * produits), gère les erreurs de validation/stockage et renvoie l'URL publique.
 * Réutilisé par tous les endpoints d'upload d'image du projet — aucune
 * duplication de logique.
 */
function traiterUpload(req: Request, res: Response, err: unknown): void {
  if (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: `Image trop volumineuse (taille maximale : ${UPLOAD_MAX_MB} Mo).` });
      return;
    }
    if (err instanceof Error && err.message === 'FORMAT_INVALIDE') {
      res.status(400).json({ error: 'Format non supporté. Formats acceptés : JPG, JPEG, PNG, WebP.' });
      return;
    }
    logger.error({ err: err }, 'Upload image :');
    res.status(400).json({ error: "Échec de l'envoi de l'image." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Aucune image reçue.' });
    return;
  }
  // URL absolue : les images sont servies par l'API (port/host distinct du
  // frontend), un chemin relatif ne résoudrait pas côté client.
  const base = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${base}/uploads/${req.file.filename}` });
}

/**
 * POST /api/uploads/image — image de PRODUIT. Réservé au salon propriétaire
 * (comportement inchangé).
 */
router.post('/image', authMiddleware, requireSalonOwnership, (req: Request, res: Response) => {
  uploadImage(req, res, (err: unknown) => traiterUpload(req, res, err));
});

/**
 * POST /api/uploads/salon-image — image de SALON, utilisée à l'inscription
 * (aucune session) et à la création d'un salon par l'admin. Public mais
 * rate-limité (uploadLimiter) et validé (format/taille) via le même middleware.
 */
router.post('/salon-image', uploadLimiter, (req: Request, res: Response) => {
  uploadImage(req, res, (err: unknown) => traiterUpload(req, res, err));
});

export default router;

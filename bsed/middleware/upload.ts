import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

/**
 * Upload d'images (multer, stockage disque).
 *
 * Les fichiers sont enregistrés dans <racine backend>/uploads et servis
 * publiquement via /uploads (voir serveur.ts). Seuls les formats image
 * courants sont acceptés, avec une taille maximale configurable
 * (UPLOAD_MAX_MB, 5 Mo par défaut).
 */
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const UPLOAD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 5);

const TYPES_AUTORISES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const EXT_PAR_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Nom aléatoire (jamais le nom d'origine, pour éviter collisions et
    // caractères dangereux) + extension dérivée du type MIME.
    const ext = EXT_PAR_TYPE[file.mimetype] || '.img';
    cb(null, `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (TYPES_AUTORISES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('FORMAT_INVALIDE'));
  }
}

/** Middleware prêt à l'emploi : un seul champ « image ». */
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
}).single('image');

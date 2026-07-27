/**
 * Règles d'upload d'image partagées (mêmes contraintes que le backend :
 * bsed/middleware/upload.ts). Source unique pour éviter toute divergence.
 */
export const TYPES_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const IMAGE_MAX_MB = 5;

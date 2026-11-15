import crypto from 'crypto';
import { ServiceError } from './ServiceError';

/**
 * Chiffrement symétrique des secrets stockés en base (jetons Meta).
 * AES-256-GCM. La clé est dérivée de `META_TOKEN_SECRET` (SHA-256 → 32 octets),
 * donc n'importe quelle chaîne forte convient comme secret d'environnement.
 *
 * Format de sortie (base64) : iv(12) || authTag(16) || ciphertext.
 * Les jetons ne transitent jamais en clair hors du serveur et ne sont déchiffrés
 * qu'au moment d'appeler l'API Meta.
 */
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function cle(): Buffer {
  const secret = process.env.META_TOKEN_SECRET;
  if (!secret) {
    throw new ServiceError(503, "META_TOKEN_SECRET est absent : impossible de chiffrer/déchiffrer les jetons Meta.");
  }
  return crypto.createHash('sha256').update(secret).digest(); // 32 octets
}

export function chiffrer(clair: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, cle(), iv);
  const ct = Buffer.concat([cipher.update(clair, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function dechiffrer(encode: string): string {
  const buf = Buffer.from(encode, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, cle(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

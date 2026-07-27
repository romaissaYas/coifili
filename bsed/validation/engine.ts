import { NextFunction, Request, Response } from 'express';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[0-9+()\s-]{6,20}$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export function isValidId(value: unknown): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Référence d'image acceptée : URL http(s) OU chemin relatif servi par le
 * frontend (`/img/...`). Rejette explicitement les schémas dangereux
 * (`javascript:`, `data:`, `vbscript:`...) pour couper toute injection via URL.
 */
export function isSafeImageRef(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') return true; // vide/optionnel
  const s = value.trim();
  return /^https?:\/\//i.test(s) || s.startsWith('/');
}

/** Chaque élément d'un tableau d'images doit être une référence sûre. */
export function isSafeImageArray(value: unknown): boolean {
  if (!Array.isArray(value)) return true; // le contrôle de type gère le reste
  return value.every((x) => typeof x === 'string' && isSafeImageRef(x));
}

export type FieldRule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly string[];
  validate?: (value: unknown) => boolean;
  message?: string;
};

export type Schema = Record<string, FieldRule>;

function validateField(value: unknown, rule: FieldRule): string | null {
  const isEmpty = value === undefined || value === null || value === '';

  if (isEmpty) {
    return rule.required ? 'est obligatoire.' : null;
  }

  if (rule.type === 'number') {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n) || !Number.isFinite(n)) return 'doit être un nombre valide.';
    if (rule.min !== undefined && n < rule.min) return `doit être supérieur ou égal à ${rule.min}.`;
    if (rule.max !== undefined && n > rule.max) return `doit être inférieur ou égal à ${rule.max}.`;
  }

  if (rule.type === 'string') {
    if (typeof value !== 'string') return 'doit être une chaîne de caractères.';
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `doit contenir au maximum ${rule.maxLength} caractères.`;
    }
    if (rule.pattern && !rule.pattern.test(value)) return rule.message || 'a un format invalide.';
  }

  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    return 'doit être un booléen.';
  }

  if (rule.type === 'array' && !Array.isArray(value)) {
    return 'doit être une liste.';
  }

  if (rule.enum && !rule.enum.includes(value as string)) {
    return `doit être l'une des valeurs suivantes : ${rule.enum.join(', ')}.`;
  }

  if (rule.validate && !rule.validate(value)) {
    return rule.message || 'est invalide.';
  }

  return null;
}

/**
 * Valide un objet brut (ex. req.body, ou un sous-objet comme salonData) selon
 * un schéma déclaratif. Retourne un dictionnaire { champ: message } vide si
 * tout est valide.
 */
export function getValidationErrors(data: Record<string, unknown> | undefined | null, schema: Schema): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, rule] of Object.entries(schema)) {
    const error = validateField(data?.[field], rule);
    if (error) errors[field] = error;
  }
  return errors;
}

/**
 * Middleware Express : valide req.body selon un schéma déclaratif et renvoie
 * une 400 avec le détail des champs invalides si nécessaire.
 */
export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = getValidationErrors(req.body, schema);
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Données invalides.', details: errors });
      return;
    }
    next();
  };
}

/**
 * Middleware Express : vérifie qu'un paramètre de route (ex. :id) est bien un
 * entier positif avant d'interroger la base de données.
 */
export function validateIdParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isValidId(req.params[paramName])) {
      res.status(400).json({ error: `Le paramètre ${paramName} doit être un identifiant numérique valide.` });
      return;
    }
    next();
  };
}

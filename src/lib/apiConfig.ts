/**
 * URL de base de l'API backend. Centralisée ici pour éviter de répéter
 * "http://localhost:5000" dans chaque page/composant — indispensable pour
 * pouvoir un jour pointer vers une URL de production sans tout modifier.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

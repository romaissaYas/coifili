import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ServiceError } from '../utils/ServiceError';
import * as usersService from '../services/usersService';
import { logger } from '../utils/logger';

function handleError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, fallback);
  res.status(500).json({ error: 'Erreur serveur' });
}

// 👤 Profil du compte connecté.
export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const profile = await usersService.getProfile(req.userId!);
    res.status(200).json(profile);
  } catch (error) {
    handleError(res, error, 'Erreur lors de la récupération du profil :');
  }
}

// ✏️ Mise à jour du profil (nom, prénom, email, téléphone).
export async function updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const profile = await usersService.updateProfile(req.userId!, { firstName, lastName, email, phone });
    res.status(200).json({ message: 'Profil mis à jour avec succès', user: profile });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la mise à jour du profil :');
  }
}

// 🔑 Changement de mot de passe (avec vérification du mot de passe actuel).
export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(req.userId!, currentPassword, newPassword);
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    handleError(res, error, 'Erreur lors du changement de mot de passe :');
  }
}

// 📥 Export RGPD des données personnelles du compte connecté (droit d'accès).
export async function exportMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const data = await usersService.exporterDonnees(req.userId!);
    res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-coifili.json"');
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error, 'Erreur lors de l’export des données :');
  }
}

// 🗑️ Suppression RGPD du compte connecté (droit à l'effacement).
export async function deleteMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { password } = req.body;
    await usersService.supprimerMonCompte(req.userId!, password);
    res.status(200).json({ message: 'Votre compte a été supprimé.' });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la suppression du compte :');
  }
}

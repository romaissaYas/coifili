import { Request, Response } from 'express';
import { ServiceError } from '../utils/ServiceError';
import * as authService from '../services/authService';
import * as auditService from '../services/auditService';
import { logger } from '../utils/logger';

// Les clés de réponse (`message` ici, `error` pour login) sont conservées
// telles qu'elles existaient avant cette refactorisation, pour ne pas
// changer le contrat de l'API.
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { token, user } = await authService.registerUser(req.body);
    res.status(201).json({ message: 'Utilisateur créé avec succès.', token, user });
  } catch (error) {
    if (error instanceof ServiceError) {
      const body: { message: string; details?: Record<string, string> } = { message: error.message };
      if (error.details) body.details = error.details;
      res.status(error.status).json(body);
      return;
    }
    logger.error({ err: error }, 'Erreur lors de l’inscription :');
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);

    // Journalise les connexions du Super Admin (fire-and-forget : n'impacte
    // jamais la réponse de connexion).
    if (user.userType === 'super_admin') {
      void auditService.logAction({ userId: user.id, action: 'ADMIN_LOGIN', ip: req.ip });
    }

    res.status(200).json({ message: 'Connexion réussie', token, user });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    logger.error({ err: error }, 'Login error:');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Demande de réinitialisation de mot de passe.
//
// Réponse volontairement neutre : elle ne révèle jamais si un compte existe
// pour cet email (bonne pratique anti-énumération). Le traitement réel
// (création d'un jeton haché + envoi de l'email) se fait en arrière-plan et
// n'influence jamais la réponse.
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  // Fire-and-forget : on ne bloque pas la réponse sur l'envoi de l'email, et
  // une éventuelle erreur interne ne doit pas révéler l'existence du compte.
  void authService.demanderReinitialisation(email).catch((err) => {
    logger.error({ err: err }, 'forgotPassword :');
  });
  res.status(200).json({
    message: "Si un compte existe pour cet email, un lien de réinitialisation vous sera envoyé.",
  });
}

// Réinitialisation effective à partir du jeton reçu par email.
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    await authService.reinitialiserMotDePasse(token, newPassword);
    res.status(200).json({ message: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.' });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    logger.error({ err: error }, 'resetPassword :');
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

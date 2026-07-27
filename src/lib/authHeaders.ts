/**
 * En-tête d'autorisation à joindre aux appels vers les routes protégées du
 * dashboard coiffeur. Le salon concerné est toujours dérivé de ce token côté
 * serveur (voir authMiddleware / requireSalonOwnership), jamais des données
 * envoyées par le client.
 */
export function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

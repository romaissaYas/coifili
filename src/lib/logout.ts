/**
 * Déconnexion propre et complète, indépendante de toute librairie de session
 * (l'app stocke l'authentification dans le localStorage — pas de refresh token
 * httpOnly ni de WebSocket dans cette architecture).
 *
 * Étapes :
 *  - purge du token JWT et de toutes les données utilisateur (localStorage +
 *    sessionStorage) ;
 *  - suppression des éventuels cookies non-httpOnly ;
 *  - redirection « dure » vers la page de connexion via window.location, ce qui
 *    réinitialise entièrement l'état applicatif en mémoire (contexte, hooks) et
 *    garantit qu'aucune page protégée n'est accessible ensuite, y compris après
 *    un rafraîchissement (les gardes lisent l'absence de token).
 */
export function logout(redirectTo: string = '/login'): void {
  try {
    // Clés d'authentification connues (retrait ciblé), puis purge complète.
    ['token', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* stockage indisponible : on poursuit la redirection */
  }

  // Suppression des cookies accessibles au JavaScript (les cookies httpOnly ne
  // le sont pas et ne sont de toute façon pas utilisés par cette application).
  try {
    document.cookie.split(';').forEach((c) => {
      const nom = c.split('=')[0].trim();
      if (nom) document.cookie = `${nom}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch {
    /* aucun cookie / accès restreint : sans effet */
  }

  // Redirection dure : réinitialise tout l'état en mémoire.
  window.location.assign(redirectTo);
}

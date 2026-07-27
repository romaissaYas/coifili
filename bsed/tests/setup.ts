/**
 * Setup exécuté AVANT le chargement des modules de test (vitest setupFiles).
 * Fournit des variables d'environnement neutres pour que l'app puisse être
 * importée sans .env (CI) : un JWT_SECRET factice (jamais utilisé pour signer
 * de vrais jetons ici) et NODE_ENV=test (journalisation de requêtes silencieuse,
 * aucune connexion réseau). Aucune base n'est requise : les tests d'intégration
 * ne visent que le pipeline routage/validation/auth, en amont de toute requête.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-for-production';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';

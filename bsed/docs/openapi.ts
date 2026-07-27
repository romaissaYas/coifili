/**
 * Spécification OpenAPI 3.0 (rédigée à la main, sans dépendance de génération).
 * Couvre la surface publique / client / authentification de l'API. Les routes
 * d'administration et de gestion coiffeur (protégées par Bearer JWT) sont
 * résumées ; leur contrat suit les mêmes conventions d'erreur.
 *
 * Servie par les routes de bsed/routes/docs.ts :
 *   GET /api/docs.json  → ce document
 *   GET /api/docs       → rendu HTML lisible
 */

const bearer = [{ bearerAuth: [] }];

const erreur = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erreur' } } },
});

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Coifili API',
    version: '1.0.0',
    description:
      "API de la plateforme Coifili (réservation de salons de coiffure et de beauté en Algérie). " +
      "Authentification par JWT (en-tête Authorization: Bearer <token>).",
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Développement local' },
    { url: '/', description: 'Même origine' },
  ],
  tags: [
    { name: 'Santé', description: 'Disponibilité du service' },
    { name: 'Authentification', description: 'Inscription, connexion, réinitialisation de mot de passe' },
    { name: 'Mon compte', description: 'Profil et données personnelles (RGPD)' },
    { name: 'Public', description: 'Salons, prestations et produits visibles sans authentification' },
    { name: 'Réservations', description: 'Prise et gestion de rendez-vous' },
    { name: 'Abonnements', description: 'Plans et souscription (espace salon)' },
    { name: 'Administration', description: 'Réservé au super administrateur (Bearer)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Erreur: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Ressource introuvable.' },
          details: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: ['error'],
      },
      Register: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'phone', 'password', 'userType'],
        properties: {
          firstName: { type: 'string', maxLength: 100 },
          lastName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          password: { type: 'string', minLength: 6 },
          userType: { type: 'string', enum: ['user', 'coiffeur'] },
          salonData: { type: 'object', description: "Requis si userType = 'coiffeur'" },
        },
      },
      Login: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { type: 'object' },
        },
      },
      Profil: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          userType: { type: 'string', enum: ['user', 'coiffeur', 'super_admin'] },
        },
      },
      ExportDonnees: {
        type: 'object',
        properties: {
          exporteLe: { type: 'string', format: 'date-time' },
          profil: { $ref: '#/components/schemas/Profil' },
          reservations: { type: 'array', items: { type: 'object' } },
          salons: { type: 'array', items: { type: 'object' } },
        },
      },
      Prestation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nom: { type: 'string' },
          prix: { type: 'number' },
          duree: { type: 'integer', description: 'Durée en minutes' },
        },
      },
      Produit: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nom: { type: 'string' },
          description: { type: 'string', nullable: true },
          categorie: { type: 'string', enum: ['cheveux', 'visage', 'maquillage', 'ongles', 'massage', 'parfum'] },
          marque: { type: 'string', nullable: true },
          prix: { type: 'number' },
          stock: { type: 'integer', nullable: true },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Santé'],
        summary: 'Sonde de disponibilité (vérifie la connexion à la base)',
        responses: {
          200: { description: 'Service opérationnel' },
          503: { description: 'Service dégradé (base injoignable)' },
        },
      },
    },
    '/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un compte (client ou coiffeur)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Register' } } },
        },
        responses: {
          201: { description: 'Compte créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: erreur('Données invalides ou email déjà utilisé'),
        },
      },
    },
    '/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Se connecter',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Login' } } },
        },
        responses: {
          200: { description: 'Connecté', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: erreur('Email ou mot de passe incorrect'),
          403: erreur('Compte suspendu'),
        },
      },
    },
    '/forgot-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Demander un lien de réinitialisation (réponse toujours neutre)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Demande prise en compte (aucune fuite d’existence)' } },
      },
    },
    '/reset-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Réinitialiser le mot de passe via un jeton',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 } } } } } },
        responses: { 200: { description: 'Mot de passe mis à jour' }, 400: erreur('Lien invalide ou expiré') },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Mon compte'], security: bearer,
        summary: 'Profil du compte connecté',
        responses: { 200: { description: 'Profil', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profil' } } } }, 401: erreur('Non authentifié') },
      },
      put: {
        tags: ['Mon compte'], security: bearer,
        summary: 'Mettre à jour son profil (nom, prénom, email, téléphone)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Profil' } } } },
        responses: { 200: { description: 'Profil mis à jour' }, 400: erreur('Email déjà utilisé'), 401: erreur('Non authentifié') },
      },
      delete: {
        tags: ['Mon compte'], security: bearer,
        summary: 'Supprimer son compte (RGPD, droit à l’effacement)',
        description: 'Confirme par le mot de passe. Anonymise les réservations puis supprime le compte. Réservé aux comptes client.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Compte supprimé' }, 400: erreur('Mot de passe incorrect'), 401: erreur('Non authentifié'), 403: erreur('Compte professionnel : contacter l’administrateur') },
      },
    },
    '/api/users/me/export': {
      get: {
        tags: ['Mon compte'], security: bearer,
        summary: 'Exporter ses données personnelles (RGPD, droit d’accès)',
        responses: { 200: { description: 'Export JSON', content: { 'application/json': { schema: { $ref: '#/components/schemas/ExportDonnees' } } } }, 401: erreur('Non authentifié') },
      },
    },
    '/api/users/me/password': {
      put: {
        tags: ['Mon compte'], security: bearer,
        summary: 'Changer son mot de passe',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } } } } },
        responses: { 200: { description: 'Mot de passe mis à jour' }, 400: erreur('Mot de passe actuel incorrect'), 401: erreur('Non authentifié') },
      },
    },
    '/api/prestations/salon/{salonId}': {
      get: {
        tags: ['Public'],
        summary: 'Prestations publiques d’un salon',
        parameters: [{ name: 'salonId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Liste', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Prestation' } } } } } },
      },
    },
    '/api/products/published': {
      get: {
        tags: ['Public'],
        summary: 'Produits publiés (boutique)',
        parameters: [
          { name: 'salon_id', in: 'query', schema: { type: 'integer' } },
          { name: 'categorie', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Active la pagination (enveloppe {data,total,...})' },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Liste (tableau) ou enveloppe paginée', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Produit' } } } } } },
      },
    },
    '/api/salons/public': {
      get: {
        tags: ['Public'],
        summary: 'Salons actifs visibles publiquement (filtres + pagination opt-in)',
        parameters: [
          { name: 'wilaya', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Liste de salons' } },
      },
    },
    '/api/rendezvous': {
      post: {
        tags: ['Réservations'],
        summary: 'Créer une réservation (client connecté ou invité)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 201: { description: 'Réservation créée' }, 400: erreur('Données invalides'), 409: erreur('Créneau indisponible') },
      },
    },
    '/api/subscriptions/plans': {
      get: {
        tags: ['Abonnements'],
        summary: 'Liste publique des plans d’abonnement',
        responses: { 200: { description: 'Plans disponibles' } },
      },
    },
    '/api/subscriptions/subscribe': {
      post: {
        tags: ['Abonnements'], security: bearer,
        summary: 'Souscrire à un plan (paiement en espèces ; carte selon configuration)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['planId', 'methode'], properties: { planId: { type: 'integer' }, methode: { type: 'string', enum: ['cash', 'cib'] } } } } } },
        responses: { 201: { description: 'Souscription enregistrée' }, 400: erreur('Méthode indisponible / plan invalide'), 401: erreur('Non authentifié') },
      },
    },
    '/api/admin/{...}': {
      get: {
        tags: ['Administration'], security: bearer,
        summary: 'Espace super administrateur (statistiques, salons, utilisateurs, réservations, paiements)',
        description:
          "Ensemble de routes protégées par Bearer JWT + rôle super_admin. Mêmes conventions : 401 sans token, 403 sans le rôle, 400 sur validation, enveloppe paginée si ?page fourni.",
        responses: { 200: { description: 'Selon la ressource' }, 401: erreur('Non authentifié'), 403: erreur('Accès refusé (rôle insuffisant)') },
      },
    },
  },
} as const;

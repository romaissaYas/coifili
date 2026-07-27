# Coifili

Plateforme de réservation de salons de coiffure/beauté pour l'Algérie
(recherche de salons par wilaya, prise de rendez-vous en ligne, tableau de
bord de gestion pour les coiffeurs).

## Architecture

Monorepo à deux applications indépendantes :

| Partie | Emplacement | Stack |
| --- | --- | --- |
| Frontend | racine du repo (`src/`) | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | `bsed/` | Express 5, MySQL (mysql2), JWT, bcrypt |

Le frontend et le backend sont deux serveurs distincts (ports 3000 et 5000),
sans proxy : le frontend appelle directement l'API backend via
`NEXT_PUBLIC_API_URL`.

## Prérequis

- Node.js 18+
- Un serveur MySQL 8 accessible (local ou distant)

## Installation

```bash
# Frontend (racine du repo)
npm install

# Backend
cd bsed
npm install
```

## Configuration (variables d'environnement)

Aucun identifiant n'est codé en dur : tout passe par des variables
d'environnement.

**Backend** — copier `bsed/.env.example` vers `bsed/.env` et renseigner :

```bash
cd bsed
cp .env.example .env
```

Voir `bsed/.env.example` pour le détail de chaque variable (connexion MySQL,
`JWT_SECRET`, `PORT`, `CORS_ORIGIN`).

**Frontend** — copier `.env.example` vers `.env.local` à la racine si l'URL
de l'API backend n'est pas `http://localhost:5000` :

```bash
cp .env.example .env.local
```

## Démarrage

```bash
# Terminal 1 : backend (depuis bsed/)
cd bsed
npm run dev
# -> http://localhost:5000, initialise/migre automatiquement le schéma MySQL

# Terminal 2 : frontend (depuis la racine)
npm run dev
# -> http://localhost:3000
```

## Base de données

Le schéma est géré en code dans `bsed/db/schema.ts`, exécuté au démarrage du
serveur : chaque table est créée avec `CREATE TABLE IF NOT EXISTS`, et une
étape de migration idempotente amène une base déjà existante au schéma le
plus récent. Voir `bsed/migrations/README.md` pour l'état actuel et la
stratégie de migration prévue pour la suite du projet.

## Structure du projet

```
coifili/
├── src/                          # Frontend Next.js (App Router)
│   ├── app/                      # Routes (une page.tsx par route)
│   │   ├── espacecoiffeur/       # Tableau de bord du coiffeur
│   │   ├── coiffeur|barbier|manucure|institut/  # Pages de recherche par catégorie
│   │   ├── login/ inscription/ pagedecoufer/
│   │   └── page.tsx              # Accueil
│   ├── components/
│   │   ├── dashboard/            # Composants du tableau de bord (StatCard, modals, onglets)
│   │   └── salon-search/         # Composants partagés des pages catégorie
│   ├── hooks/                    # Hooks personnalisés (données + logique d'un domaine)
│   ├── lib/                      # apiConfig (URL API), authHeaders
│   └── types/                    # Types partagés (évite les types dupliqués)
│
└── bsed/                         # Backend Express
    ├── serveur.ts                # Bootstrap de l'app (routes, middlewares, démarrage)
    ├── config/                   # Configuration (variables d'environnement)
    ├── db/                       # Pool MySQL + initialisation/migration du schéma
    ├── migrations/               # Instantanés SQL du schéma + stratégie de migration
    ├── routes/                   # Définition des endpoints (chemin + middlewares)
    ├── controllers/              # Traduction requête HTTP <-> service
    ├── services/                 # Logique métier (accès base de données inclus)
    ├── middleware/                # authMiddleware, requireSalonOwnership, ...
    └── validation/                # Moteur de validation + schémas par domaine
```

## Fonctionnalités

### Côté client

| Fonction | Description |
| --- | --- |
| Recherche d'un salon / service | Recherche par wilaya/ville, type de prestation |
| Prise de rendez-vous en ligne | Réservation rapide, sans compte obligatoire |
| Disponibilités en temps réel | Vérification des horaires, créneaux et chevauchements |

### Côté professionnel (tableau de bord `/espacecoiffeur`)

| Fonction | Description |
| --- | --- |
| Agenda | Vue jour/semaine/mois, filtres employé/statut, recherche client, détail d'un rendez-vous (modifier, confirmer, terminer, annuler) |
| Statistiques | RDV et chiffre d'affaires jour/semaine/mois, nouveaux clients, prestations populaires |
| Gestion des prestations et tarifs | Nom, prix, durée |
| Gestion des employés | Nombre de RDV, chiffre d'affaires généré, prochaine disponibilité |
| Horaires | Configuration des jours/créneaux d'ouverture |
| Produits à vendre | Catalogue simple |

### Non encore implémenté

Avis clients, notifications email/SMS, paiement en ligne, panel
administrateur — hors périmètre des priorités actuelles.

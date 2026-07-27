# Migrations — état actuel et stratégie prévue

## Aujourd'hui

Le schéma est géré en code, dans `bsed/db/schema.ts`, exécuté au démarrage du
serveur (`initializeDb()`) :
- chaque table est créée avec `CREATE TABLE IF NOT EXISTS` (idempotent) ;
- les évolutions de schéma sur une base déjà existante passent par
  `migrateRendezvousModel()`, qui vérifie l'existence de chaque
  colonne/contrainte/index avant de l'ajouter (également idempotent).

Les fichiers `.sql` de ce dossier (`001_initial_schema.sql`,
`002_rendezvous_booking_model.sql`) sont des **instantanés documentaires** de
ce que `bsed/db/schema.ts` a produit à chaque étape du projet. Ils ne sont
**pas exécutés automatiquement** : le comportement réel au démarrage n'est
pas modifié par leur présence.

## Pourquoi ce n'est pas encore un vrai système de migration

Un vrai outil de migration (ex. `node-pg-migrate`, `db-migrate`, les
migrations Knex/Prisma) apporte :
- un historique explicite et ordonné des changements de schéma ;
- une table `schema_migrations` qui trace ce qui a déjà été appliqué ;
- des migrations descendantes (`down`) pour revenir en arrière ;
- une exécution en dehors du code applicatif (CLI dédiée, CI/CD).

Ce n'était pas encore en place ici. Le mettre en place maintenant (réécrire
`initializeDb()` pour qu'il exécute ces fichiers via un vrai runner) est une
étape volontairement **non faite** dans cette passe de refactorisation, pour
ne prendre aucun risque de régression sur la partie la plus sensible du
projet (l'initialisation de la base). Le dossier existe pour que cette étape
soit simple à ajouter plus tard.

## Prochaine étape recommandée (V1+)

1. Choisir un outil (ex. `db-migrate` fonctionne bien avec MySQL et
   TypeScript, sans dépendance à un ORM).
2. Créer une table `schema_migrations` et importer `001_initial_schema.sql`
   et `002_rendezvous_booking_model.sql` comme les deux premières migrations
   déjà "appliquées" sur les environnements existants.
3. Remplacer l'appel à `initializeDb()` dans `bsed/serveur.ts` par la
   commande de migration de l'outil choisi, lancée avant `app.listen(...)`.
4. Toute nouvelle évolution de schéma devient alors un nouveau fichier
   `003_xxx.sql` numéroté, plutôt qu'une modification de
   `bsed/db/schema.ts`.

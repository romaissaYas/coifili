# Guide d'utilisation — Coifili

**Coifili** est la plateforme de réservation en ligne de salons de **coiffure, barbier, institut de beauté et manucure** en Algérie. Elle s'utilise depuis un **navigateur** (mobile, tablette ou ordinateur) — aucune application à installer.

Ce guide couvre les **3 profils** :
1. 👤 **Client** — réserver et gérer ses rendez-vous.
2. ✂️ **Espace Coiffure (salon)** — gérer son salon et ses réservations.
3. 🛠️ **Administrateur** — piloter toute la plateforme.

> **Important** : la réservation est **gratuite pour les clients**. Le paiement de la prestation se fait **au salon**. L'abonnement des salons se règle **en espèces**, validé par l'administration.

---

# 1. 👤 Guide CLIENT

## 1.1 Créer un compte
1. Cliquez sur **« Inscription »** (en haut à droite).
2. Renseignez : prénom, nom, e-mail, téléphone, mot de passe (min. 6 caractères) + confirmation.
3. Validez → votre compte client est créé et vous êtes connecté.

> L'inscription publique est réservée aux **clients**. Vous ne pouvez pas créer de salon ici (voir §2.1).

## 1.2 Se connecter / mot de passe oublié
- **Connexion** : page **« Connexion »** → e-mail + mot de passe.
- **Mot de passe oublié** : lien *« Mot de passe oublié »* → saisissez votre e-mail → vous recevez un **lien de réinitialisation** (valable 60 min).

## 1.3 Trouver un salon
1. Depuis l'accueil ou la page **« Salons »**.
2. Filtrez par **ville / wilaya** et par **catégorie** (Coiffeur, Barbier, Institut, Manucure).
3. Ouvrez la fiche d'un salon pour voir ses prestations, sa localisation et ses disponibilités.

## 1.4 Réserver un rendez-vous
1. Sur la fiche salon, cliquez sur **« Réserver »**.
2. Choisissez la **prestation**, puis un **créneau** disponible.
3. Confirmez → vous recevez un **e-mail de confirmation** avec les détails.

## 1.5 Gérer ses rendez-vous (« Mon compte »)
- Rubrique **« Mes rendez-vous »** : onglets **À venir / Passés / Annulés**.
- Sur un rendez-vous à venir : **Reprogrammer** ou **Annuler**.

## 1.6 Profil et données personnelles
- **Mon profil** : modifier nom, e-mail, téléphone ; changer le mot de passe.
- **Confidentialité (RGPD)** : **télécharger vos données** (JSON) ou **supprimer votre compte** (confirmation par mot de passe). Vos réservations passées sont alors anonymisées.

## 1.7 Déconnexion
Bouton **« Déconnexion »** dans l'en-tête de votre espace.

---

# 2. ✂️ Guide ESPACE COIFFURE (salon / coiffeur)

## 2.1 Obtenir un compte salon
> Les salons ne s'inscrivent **pas** eux-mêmes. **Votre salon et votre compte sont créés par l'administration Coifili.** Vous recevez ensuite vos **identifiants de connexion** (e-mail + mot de passe). Pour inscrire votre salon, **contactez l'équipe Coifili**.

Une fois votre salon créé et **actif**, connectez-vous via la page **« Connexion »**.

## 2.2 Tableau de bord
À la connexion, l'**Espace Pro** affiche votre **Dashboard** : statistiques de votre activité (rendez-vous, chiffre, etc.).

## 2.3 Agenda
- Vue d'ensemble de vos rendez-vous.
- Filtres par **employé**, par **statut**, recherche par **client**.

## 2.4 Réservations
- Liste de vos réservations à traiter.
- Actions : changer le **statut**, marquer **absent (no-show)**, ajouter des **notes internes**, reprogrammer/annuler.
- Les **nouvelles réservations non consultées** sont mises en évidence (fond vert) jusqu'à ouverture.

## 2.5 Horaires
Configurez vos **jours ouvrés** et **créneaux** : vos clients ne réservent qu'aux bons moments.

## 2.6 Prestations
Ajoutez vos prestations avec **nom, prix, durée** — ce que vos clients pourront réserver.

## 2.7 Mes Produits (boutique)
Présentez et publiez vos **produits** (nom, description, marque, prix, stock, catégorie, image). Les produits **publiés** sont visibles publiquement.

## 2.8 Employés
Gérez votre **équipe** (ajout/suppression) ; l'agenda peut être suivi par employé.

## 2.9 Notifications 🔔
- **Cloche** (en-tête) : badge rouge + nombre de non-lues + dernières notifications.
- Vous êtes notifié en temps quasi réel (**nouvelle réservation**, **paiement validé**…).
- Un **centre de notifications** complet permet de rechercher, filtrer, marquer comme lu et supprimer.

## 2.10 Mon abonnement
- Formules **Starter · Pro · Premium**.
- **Paiement en espèces** : vous recevez une **référence** ; un administrateur valide le paiement, puis votre salon devient/reste **actif** et visible.
- *(Le paiement par carte n'est pas disponible actuellement.)*

## 2.11 Déconnexion
Bouton **« Déconnexion »** dans la barre latérale de l'Espace Pro.

---

# 3. 🛠️ Guide ADMINISTRATEUR

L'espace **Administration** pilote toute la plateforme. Accès réservé au **super administrateur**.

## 3.1 Connexion
Connectez-vous avec le compte administrateur. Toutes les pages admin vérifient vos droits (accès refusé sinon).

## 3.2 Tableau de bord
Vue d'ensemble : nombre de salons, clients, réservations, revenus estimés, salons par statut, etc.

## 3.3 Salons — **créer un nouveau salon** (réservé à l'admin)
**C'est ici que les salons entrent sur la plateforme.**
1. Page **« Salons »** → bouton **« Nouveau salon »**.
2. Renseignez les informations du salon (**nom, e-mail, téléphone, wilaya, ville, type, catégorie, adresse, image**) **et** celles du **propriétaire** (prénom, nom, e-mail, téléphone, **mot de passe**).
3. À la création :
   - le **compte propriétaire** (coiffeur) est créé avec ses identifiants ;
   - le salon est créé **actif** par défaut (visible et réservable).
4. Communiquez les identifiants au propriétaire → il peut se connecter à son Espace Pro.

Depuis la liste, vous pouvez aussi **valider**, **suspendre** ou **supprimer** un salon, et gérer son **abonnement**.

## 3.4 Inscriptions
Suivi des demandes/états liés aux salons (validation, etc.).

## 3.5 Abonnements
- Voir les **demandes d'abonnement** et **paiements**.
- **Valider un paiement en espèces** → active l'abonnement du salon.
- Changer de formule, prolonger, refuser un paiement.

## 3.6 Utilisateurs
- Table complète : nom, prénom, e-mail, téléphone, rôle, statut, date de création, dernière connexion.
- **Rechercher, filtrer (rôle/statut), trier, paginer**.
- **Modifier**, **suspendre/réactiver**, **réinitialiser le mot de passe**, **supprimer** (la suppression définitive libère l'e-mail pour une réutilisation).

## 3.7 Employés & Réservations
Vues transverses pour gérer les employés et les réservations au niveau plateforme.

## 3.8 Notifications 🔔
Cloche dans l'**en-tête admin** (comme l'Espace Coiffure) : vous êtes alerté, par ex. lors d'une **nouvelle demande d'abonnement**, avec un lien direct vers la demande. Centre de notifications complet également.

## 3.9 Marketing Instagram
Module complet de gestion de contenu Instagram :
- **Publications, Reels, Stories, Stories à la une, Calendrier (glisser-déposer), Médiathèque, Hashtags, Paramètres.**
- **Génération par IA** (texte) et **publication automatique via Meta** sont disponibles **une fois les clés configurées** par l'équipe technique (sinon inactives).

## 3.10 Statistiques & Journal d'activité
- **Statistiques** de la plateforme.
- **Journal d'activité** : traçabilité des actions importantes.

## 3.11 Paramètres & Déconnexion
- **Paramètres** de la plateforme.
- **Déconnexion** : bouton tout en bas du menu latéral.

---

# 4. Questions fréquentes (FAQ)

**Coifili est-il payant pour les clients ?** Non, la réservation est gratuite. Vous payez la prestation au salon.

**Comment inscrire mon salon ?** Les salons sont créés par l'administration Coifili. Contactez l'équipe ; vous recevrez vos identifiants.

**Y a-t-il une application à installer ?** Non. Coifili fonctionne sur navigateur, mobile et ordinateur.

**Comment régler l'abonnement d'un salon ?** En **espèces** : une référence est fournie, un administrateur valide le paiement, le salon devient actif.

**J'ai oublié mon mot de passe.** Utilisez *« Mot de passe oublié »* sur la page de connexion : un lien sécurisé vous est envoyé par e-mail.

**Comment supprimer mon compte / mes données ?** Depuis *Mon compte → Confidentialité* : téléchargement des données ou suppression du compte (droit à l'effacement).

---

*Guide fondé sur les fonctionnalités réellement présentes dans Coifili. Les options « Génération IA » et « Publication Meta » du module Marketing nécessitent une configuration technique (clés API) pour être activées ; le paiement par carte n'est pas actif (espèces uniquement).*

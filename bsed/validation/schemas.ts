import { EMAIL_PATTERN, PHONE_PATTERN, DATE_PATTERN, TIME_PATTERN, isValidId, isValidCalendarDate, isSafeImageRef, isSafeImageArray, Schema } from './engine';
import { JOURS_SEMAINE } from '../utils/dateTime';

// Schémas réutilisés par plusieurs routes (ex. création de salon lors de
// l'inscription ET via POST /api/salons) pour éviter toute duplication.

export const salonSchema: Schema = {
  nom: { required: true, type: 'string', maxLength: 100 },
  email: { required: true, type: 'string', maxLength: 100, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  telephone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
  wilaya: { required: true, type: 'string', maxLength: 100 },
  ville: { required: true, type: 'string', maxLength: 100 },
  type: { required: true, type: 'string', enum: ['homme', 'femme', 'mixte'] },
  categorie: { required: true, type: 'string', enum: ['coiffeur', 'barbier', 'manucure', 'institut'] },
  image: { required: false, type: 'string', maxLength: 255, validate: isSafeImageRef, message: "doit être une URL http(s) ou un chemin d'image valide." },
  message: { required: false, type: 'string', maxLength: 1000 },
};

export const registerSchema: Schema = {
  firstName: { required: true, type: 'string', maxLength: 100 },
  lastName: { required: true, type: 'string', maxLength: 100 },
  email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  phone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
  password: { required: true, type: 'string', maxLength: 72, validate: (v) => typeof v === 'string' && v.length >= 6, message: 'doit contenir au moins 6 caractères.' },
  userType: { required: true, type: 'string', enum: ['coiffeur', 'user'] },
};

export const loginSchema: Schema = {
  email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  password: { required: true, type: 'string', maxLength: 72 },
};

// Modification du profil (espace client) : mêmes champs que register, sans
// mot de passe ni userType (le rôle n'est pas modifiable par le client).
export const profilSchema: Schema = {
  firstName: { required: true, type: 'string', maxLength: 100 },
  lastName: { required: true, type: 'string', maxLength: 100 },
  email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  phone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
};

export const forgotPasswordSchema: Schema = {
  email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
};

// Réinitialisation via le lien reçu par email : jeton opaque + nouveau mot de passe.
export const resetPasswordWithTokenSchema: Schema = {
  token: { required: true, type: 'string', maxLength: 200 },
  newPassword: { required: true, type: 'string', maxLength: 72, validate: (v) => typeof v === 'string' && v.length >= 6, message: 'doit contenir au moins 6 caractères.' },
};

export const changePasswordSchema: Schema = {
  currentPassword: { required: true, type: 'string', maxLength: 72 },
  newPassword: { required: true, type: 'string', maxLength: 72, validate: (v) => typeof v === 'string' && v.length >= 6, message: 'doit contenir au moins 6 caractères.' },
};

// Suppression de son propre compte (droit à l'effacement RGPD) : on exige le
// mot de passe actuel pour confirmer l'identité avant une action irréversible.
export const deleteAccountSchema: Schema = {
  password: { required: true, type: 'string', maxLength: 72 },
};

// Reprogrammation d'un rendez-vous par le client : seuls la date, l'heure et
// éventuellement l'employé changent (la prestation, donc prix/durée, reste
// figée).
export const reprogrammationSchema: Schema = {
  date: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  heure_debut: { required: true, type: 'string', pattern: TIME_PATTERN, message: 'doit être une heure valide au format HH:MM.' },
  employe_id: { required: false, type: 'number', validate: isValidId, message: 'doit être un identifiant valide.' },
};

export const prestationSchema: Schema = {
  nom: { required: true, type: 'string', maxLength: 100 },
  prix: { required: true, type: 'number', min: 0, max: 99999999.99 },
  duree: { required: true, type: 'number', min: 5, max: 480, message: 'doit être une durée en minutes comprise entre 5 et 480.' },
};

export const produitSchema: Schema = {
  nom: { required: true, type: 'string', maxLength: 100 },
  prix: { required: true, type: 'number', min: 0, max: 99999999.99 },
};

// Gestion des réservations (espace coiffeur).
export const cancelReservationSchema: Schema = {
  motif: { required: false, type: 'string', maxLength: 500 },
};
export const notesReservationSchema: Schema = {
  notes: { required: false, type: 'string', maxLength: 2000 },
};

// Souscription à un abonnement (salon).
export const souscrireSchema: Schema = {
  planId: { required: true, type: 'number', validate: isValidId, message: 'doit être un identifiant de plan valide.' },
  methode: { required: true, type: 'string', enum: ['cash', 'cib'] },
};

// Boutique produits (nouvelle fonctionnalité isolée). Ne remplace pas produitSchema.
export const PRODUCT_CATEGORIES = ['cheveux', 'visage', 'maquillage', 'ongles', 'massage', 'parfum'] as const;

export const productSchema: Schema = {
  nom: { required: true, type: 'string', maxLength: 150 },
  description: { required: false, type: 'string', maxLength: 2000 },
  categorie: { required: true, type: 'string', enum: PRODUCT_CATEGORIES },
  marque: { required: false, type: 'string', maxLength: 100 },
  prix: { required: true, type: 'number', min: 0, max: 99999999.99 },
  prix_promo: { required: false, type: 'number', min: 0, max: 99999999.99 },
  stock: { required: false, type: 'number', min: 0, max: 9999999 },
  disponibilite: { required: false, type: 'boolean' },
  images: { required: false, type: 'array', validate: isSafeImageArray, message: 'ne doit contenir que des URLs http(s) ou des chemins valides.' },
  statut: { required: false, type: 'string', enum: ['draft', 'published'] },
};

export const employeSchema: Schema = {
  nom: { required: true, type: 'string', maxLength: 100 },
  poste: { required: true, type: 'string', maxLength: 100 },
};

export const horaireSchema: Schema = {
  jour: { required: true, type: 'string', enum: JOURS_SEMAINE },
  ouvert: { required: true, type: 'boolean' },
};

// Champs communs à la création et à la modification d'un rendez-vous.
const rendezvousDateHeureSchema: Schema = {
  date: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  heure_debut: { required: true, type: 'string', pattern: TIME_PATTERN, message: 'doit être une heure valide au format HH:MM.' },
  employe_id: { required: false, type: 'number', validate: isValidId, message: 'doit être un identifiant valide.' },
  commentaire: { required: false, type: 'string', maxLength: 1000 },
};

// POST /api/rendezvous (public, réservation cliente sans compte).
export const rendezvousCreateSchema: Schema = {
  ...rendezvousDateHeureSchema,
  salon_id: { required: true, type: 'number', validate: isValidId, message: 'doit être un identifiant valide.' },
  prestation_id: { required: true, type: 'number', validate: isValidId, message: 'doit être un identifiant valide.' },
  client_nom: { required: true, type: 'string', maxLength: 100 },
  client_prenom: { required: true, type: 'string', maxLength: 100 },
  client_email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  client_telephone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
};

// PUT /api/rendezvous/:id (protégé, gestion par le salon propriétaire).
// salon_id et prestation_id ne sont volontairement pas modifiables : changer
// de prestation changerait le prix/la durée déjà figés à la création.
export const rendezvousUpdateSchema: Schema = {
  ...rendezvousDateHeureSchema,
  client_nom: { required: true, type: 'string', maxLength: 100 },
  client_prenom: { required: true, type: 'string', maxLength: 100 },
  client_email: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  client_telephone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
};

// Création d'un salon + compte propriétaire par l'admin.
export const adminSalonCreateSchema: Schema = {
  // Salon
  nom: { required: true, type: 'string', maxLength: 100 },
  email: { required: true, type: 'string', maxLength: 100, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  telephone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
  wilaya: { required: true, type: 'string', maxLength: 100 },
  ville: { required: true, type: 'string', maxLength: 100 },
  adresse: { required: false, type: 'string', maxLength: 255 },
  type: { required: true, type: 'string', enum: ['homme', 'femme', 'mixte'] },
  categorie: { required: true, type: 'string', enum: ['coiffeur', 'barbier', 'manucure', 'institut'] },
  image: { required: false, type: 'string', maxLength: 255, validate: isSafeImageRef, message: "doit être une URL http(s) ou un chemin d'image valide." },
  description: { required: false, type: 'string', maxLength: 1000 },
  // Propriétaire
  ownerFirstName: { required: true, type: 'string', maxLength: 100 },
  ownerLastName: { required: true, type: 'string', maxLength: 100 },
  ownerEmail: { required: true, type: 'string', maxLength: 255, pattern: EMAIL_PATTERN, message: 'doit être une adresse email valide.' },
  ownerPhone: { required: true, type: 'string', maxLength: 20, pattern: PHONE_PATTERN, message: 'doit être un numéro de téléphone valide.' },
  // Compte
  password: { required: true, type: 'string', maxLength: 72, validate: (v) => typeof v === 'string' && v.length >= 6, message: 'doit contenir au moins 6 caractères.' },
  // Abonnement
  abonnement_debut: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  abonnement_fin: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  statut: { required: false, type: 'string', enum: ['en_attente', 'actif', 'suspendu', 'expire'] },
};

// Réinitialisation du mot de passe d'un utilisateur par l'admin (Phase 3).
// newPassword optionnel : si absent, un mot de passe temporaire est généré.
export const resetPasswordSchema: Schema = {
  newPassword: { required: false, type: 'string', maxLength: 72, validate: (v) => typeof v === 'string' && v.length >= 6, message: 'doit contenir au moins 6 caractères.' },
};

// Mise à jour d'un abonnement salon par l'admin (Phase 2).
export const abonnementSchema: Schema = {
  abonnement_debut: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  abonnement_fin: { required: true, type: 'string', pattern: DATE_PATTERN, validate: (v) => isValidCalendarDate(v as string), message: 'doit être une date valide au format AAAA-MM-JJ.' },
  abonnement_montant: { required: false, type: 'number', min: 0, max: 99999999.99 },
  paiement_statut: { required: false, type: 'string', enum: ['en_attente', 'paye', 'impaye'] },
};

export const STATUTS_RENDEZVOUS = ['en_attente', 'confirme', 'termine', 'annule'] as const;

export const statutSchema: Schema = {
  statut: { required: true, type: 'string', enum: STATUTS_RENDEZVOUS },
};

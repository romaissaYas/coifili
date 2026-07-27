export type SalonStatut = 'en_attente' | 'actif' | 'suspendu' | 'expire';
export type PaiementStatut = 'en_attente' | 'paye' | 'impaye';

export type AdminSalon = {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  message: string | null;
  adresse: string | null;
  wilaya: string;
  ville: string;
  type: string;
  categorie: string;
  image: string;
  statut: SalonStatut;
  createdAt: string | null;
  abonnement_debut: string | null;
  abonnement_fin: string | null;
  abonnement_montant: number | null;
  paiement_statut: PaiementStatut;
  ownerId: number | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
};

export type AdminStats = {
  totalSalons: number;
  totalClients: number;
  totalReservations: number;
  rdvAujourdhui: number;
  salonsActifs: number;
  salonsSuspendus: number;
  salonsEnAttente: number;
  salonsExpires: number;
  revenusAbonnements: number;
  revenusPrestations: number;
  revenusEstimes: number;
  nouveauxSalonsCeMois: number;
};

export type UserStatut = 'actif' | 'suspendu';

export type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: 'coiffeur' | 'user' | 'super_admin';
  statut: UserStatut;
  createdAt: string | null;
  last_login: string | null;
  salonId: number | null;
  salonNom: string | null;
  salonStatut: SalonStatut | null;
};

export type AdminReservation = {
  id: number;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  duree: number | null;
  prix: number | null;
  statut: 'en_attente' | 'confirme' | 'termine' | 'annule';
  reference: string | null;
  client_nom: string;
  client_prenom: string | null;
  client_email: string | null;
  client_telephone: string | null;
  salon_id: number | null;
  salon_nom: string | null;
  prestation_id: number | null;
  prestation_nom: string | null;
};

export type AuditLog = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  ip_address: string | null;
  details: string | null;
  created_at: string;
  user_id: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type AdminEmploye = {
  id: number;
  nom: string;
  poste: string;
  salon_id: number | null;
  salon_nom: string | null;
};

export type AdminPayment = {
  id: number;
  subscription_id: number;
  salon_id: number;
  methode: string;
  montant: number | string;
  statut: string;
  reference: string;
  created_at: string;
  validated_at: string | null;
  salon_nom: string | null;
  salon_email: string | null;
  plan_nom: string | null;
};

export type AbonnementInput = {
  abonnement_debut: string;
  abonnement_fin: string;
  abonnement_montant?: number;
  paiement_statut?: PaiementStatut;
};

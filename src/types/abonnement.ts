export type Plan = {
  id: number;
  nom: string;
  prix: number | string;
  duree_mois: number;
  description: string | null;
  actif: number;
};

export type Paiement = {
  id: number;
  methode: string;
  montant: number | string;
  statut: string;
  reference: string;
  checkout_url: string | null;
  created_at: string;
  validated_at: string | null;
};

export type MonAbonnement = {
  abonnement: {
    id: number;
    statut: string;
    plan_nom: string;
    plan_prix: number | string;
    plan_duree: number;
    date_debut: string | null;
    date_fin: string | null;
  } | null;
  salonNom: string | null;
  salonStatut: string;
  abonnement_debut: string | null;
  abonnement_fin: string | null;
  joursRestants: number | null;
  paiements: Paiement[];
  /** Paiement par carte proposé (false = cash-only tant que SATIM non intégré). */
  paiementCarteActive?: boolean;
};

export const STATUT_LABELS: Record<string, string> = {
  pending: 'En attente',
  waiting_cash: 'Paiement espèces en attente',
  waiting_card: 'Paiement carte en attente',
  paid: 'Payé',
  refused: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

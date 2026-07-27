/**
 * Abstraction de fournisseur de paiement (Stripe-ready).
 *
 * Aujourd'hui les abonnements sont réglés HORS LIGNE : l'admin vérifie le
 * paiement et met à jour `paiement_statut`/`abonnement_fin` (voir Phase 2).
 * Cette interface prépare l'ajout ultérieur de Stripe (ou autre) sans toucher
 * au reste du code : il suffira d'implémenter `PaymentProvider` puis de
 * l'exposer via la factory `getPaymentProvider()`.
 */
export interface PaymentIntentInput {
  salonId: number;
  montant: number;
  description?: string;
}

export interface PaymentIntentResult {
  provider: string;
  /**
   * 'manual'       = à régler hors ligne (ancien comportement) ;
   * 'waiting_cash' = espèces, en attente de validation admin ;
   * 'waiting_card' = carte, redirection vers la passerelle (checkoutUrl) ;
   * 'pending'/'paid' = états génériques d'un fournisseur.
   */
  status: 'manual' | 'waiting_cash' | 'waiting_card' | 'pending' | 'paid';
  reference?: string;
  /** URL de paiement (ex. passerelle CIB/SATIM) quand applicable. */
  checkoutUrl?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Initialise un paiement d'abonnement. */
  creerPaiement(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  /** Vérifie l'état d'un paiement à partir de sa référence. */
  verifierPaiement(reference: string): Promise<{ paid: boolean }>;
}

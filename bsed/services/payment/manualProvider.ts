import { PaymentIntentInput, PaymentIntentResult, PaymentProvider } from './paymentProvider';

/**
 * Fournisseur « manuel » (par défaut) : aucun paiement en ligne. Le règlement
 * se fait hors ligne et l'admin met à jour l'abonnement à la main. Sert de
 * base à remplacer/compléter par un vrai fournisseur (Stripe...).
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = 'manual';

  async creerPaiement(_input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return { provider: this.name, status: 'manual' };
  }

  async verifierPaiement(_reference: string): Promise<{ paid: boolean }> {
    // Aucun suivi automatique : la vérification est faite par l'admin.
    return { paid: false };
  }
}

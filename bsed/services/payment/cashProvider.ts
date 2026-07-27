import crypto from 'crypto';
import { PaymentIntentInput, PaymentIntentResult, PaymentProvider } from './paymentProvider';

/**
 * Paiement en ESPÈCES : génère une référence unique et laisse le paiement en
 * attente de validation manuelle par l'administrateur (statut waiting_cash).
 */
export class CashPaymentProvider implements PaymentProvider {
  readonly name = 'cash';

  async creerPaiement(_input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const reference = `CASH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return { provider: this.name, status: 'waiting_cash', reference };
  }

  async verifierPaiement(_reference: string): Promise<{ paid: boolean }> {
    // Validation faite par l'admin (pas de suivi automatique).
    return { paid: false };
  }
}

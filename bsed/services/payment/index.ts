import { PaymentProvider } from './paymentProvider';
import { ManualPaymentProvider } from './manualProvider';
import { CashPaymentProvider } from './cashProvider';
import { CibPaymentProvider } from './cibProvider';

export * from './paymentProvider';
export { CashPaymentProvider } from './cashProvider';
export { CibPaymentProvider } from './cibProvider';

/**
 * Factory du fournisseur de paiement selon la méthode. Point d'extension
 * unique pour ajouter d'autres passerelles (edahabia, satim...) SANS modifier
 * le code appelant : il suffit d'ajouter un `case` ici.
 *
 * `getPaymentProvider()` sans argument conserve l'ancien comportement (manuel).
 */
export function getPaymentProvider(methode?: string): PaymentProvider {
  switch (methode) {
    case 'cash':
      return new CashPaymentProvider();
    case 'cib':
      return new CibPaymentProvider();
    default:
      return new ManualPaymentProvider();
  }
}

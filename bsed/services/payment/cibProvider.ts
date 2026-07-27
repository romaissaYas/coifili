import crypto from 'crypto';
import { PaymentIntentInput, PaymentIntentResult, PaymentProvider } from './paymentProvider';

/**
 * Paiement par CARTE CIB (compatible SATIM / passerelles algériennes).
 *
 * L'intégration réseau réelle de la passerelle n'est pas branchée (aucune clé
 * marchande disponible), MAIS toute l'architecture de confirmation est prête :
 *  - `creerPaiement`  : crée une intention (référence + URL de checkout) ;
 *  - `verifierSignatureWebhook` : valide l'authenticité d'un callback serveur
 *    (HMAC-SHA256 avec `SATIM_WEBHOOK_SECRET`) ;
 *  - `analyserWebhook` : normalise le payload de la passerelle en
 *    { reference, paid }.
 *
 * Le jour de l'intégration réelle, il suffira de renseigner les variables
 * SATIM_* et d'implémenter l'appel HTTP dans `creerPaiement`/`verifierPaiement`
 * (register/confirmOrder SATIM) — le reste du système (webhook, activation
 * d'abonnement) n'a pas à changer.
 */
export class CibPaymentProvider implements PaymentProvider {
  readonly name = 'cib';

  async creerPaiement(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const reference = `CIB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    // TODO(intégration SATIM) : appeler `register.do` pour obtenir formUrl+orderId.
    // En l'absence de passerelle, on renvoie une URL interne (page de simulation)
    // qui pourra POSTer sur le webhook ci-dessous une fois « payée ».
    const base = process.env.APP_URL || 'http://localhost:3000';
    const checkoutUrl = `${base}/paiement/cib?ref=${encodeURIComponent(reference)}&montant=${input.montant}`;
    return { provider: this.name, status: 'waiting_card', reference, checkoutUrl };
  }

  async verifierPaiement(_reference: string): Promise<{ paid: boolean }> {
    // TODO(intégration SATIM) : appeler `confirmOrder.do` / `getOrderStatus.do`.
    // Tant que la passerelle n'est pas branchée, la confirmation passe par le
    // webhook signé (analyserWebhook + verifierSignatureWebhook).
    return { paid: false };
  }

  /**
   * Vérifie la signature HMAC-SHA256 d'un callback de la passerelle.
   * - si `SATIM_WEBHOOK_SECRET` est défini : signature obligatoire et validée ;
   * - s'il est absent : accepté UNIQUEMENT en `npm run dev` (facilite les tests
   *   locaux), refusé en production (fail-safe).
   */
  static verifierSignatureWebhook(rawBody: string, signature: string | undefined): boolean {
    const secret = process.env.SATIM_WEBHOOK_SECRET;
    if (!secret) {
      const dev = process.env.TS_NODE_DEV === 'true' || (process.argv[1] ?? '').endsWith('.ts');
      return dev; // pas de secret : toléré en dev, refusé ailleurs
    }
    if (!signature) return false;
    const attendue = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    // Comparaison à temps constant.
    const a = Buffer.from(attendue);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  /** Normalise un payload de webhook en { reference, paid }. */
  static analyserWebhook(payload: Record<string, unknown>): { reference: string | null; paid: boolean } {
    const reference =
      (typeof payload.reference === 'string' && payload.reference) ||
      (typeof payload.orderId === 'string' && payload.orderId) ||
      null;
    // SATIM : orderStatus === 2 => paiement accepté. On accepte aussi un champ
    // générique `status` ('paid'/'accepted') pour rester agnostique.
    const paid =
      Number(payload.orderStatus) === 2 ||
      payload.status === 'paid' ||
      payload.status === 'accepted' ||
      payload.paid === true;
    return { reference, paid };
  }
}

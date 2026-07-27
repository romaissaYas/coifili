import { describe, it, expect } from 'vitest';
import { souscrire } from '../services/abonnementService';

/**
 * Gating du paiement par carte (SATIM non intégré → cash-only par défaut).
 * En environnement de test, PAIEMENT_CARTE_ACTIVE n'est pas défini : la carte
 * est donc désactivée. Le refus intervient AVANT tout accès base de données,
 * ce qui rend ce test déterministe et sans dépendance.
 */
describe('souscrire — gating paiement carte', () => {
  it('refuse la méthode "cib" quand le paiement carte est désactivé (400)', async () => {
    await expect(souscrire(1, 1, 'cib')).rejects.toMatchObject({ status: 400 });
  });

  it('refuse une méthode de paiement invalide (400)', async () => {
    // @ts-expect-error : méthode volontairement invalide pour le test
    await expect(souscrire(1, 1, 'paypal')).rejects.toMatchObject({ status: 400 });
  });
});

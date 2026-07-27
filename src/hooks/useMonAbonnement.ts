'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { Plan, MonAbonnement } from '@/types/abonnement';

/** État de l'abonnement du salon connecté : plans disponibles + abonnement courant. */
export function useMonAbonnement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mine, setMine] = useState<MonAbonnement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        axios.get<Plan[]>(`${API_URL}/api/subscriptions/plans`),
        axios.get<MonAbonnement>(`${API_URL}/api/subscriptions/mine`, { headers: getAuthHeaders() }),
      ]);
      setPlans(p.data);
      setMine(m.data);
    } catch (e) {
      console.error('Erreur chargement abonnement :', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const souscrire = async (planId: number, methode: 'cash' | 'cib'): Promise<void> => {
    try {
      const res = await axios.post(
        `${API_URL}/api/subscriptions/subscribe`,
        { planId, methode },
        { headers: getAuthHeaders() }
      );
      const data = res.data as { reference: string; checkoutUrl: string | null };

      if (methode === 'cib' && data.checkoutUrl) {
        // Redirection vers la passerelle de paiement (CIB/SATIM).
        window.location.href = data.checkoutUrl;
        return;
      }

      await fetchAll();
      await Swal.fire({
        icon: 'success',
        title: 'Demande enregistrée',
        html: `Votre référence de paiement en espèces :<br><code style="font-size:16px">${data.reference}</code><br><small>Présentez-la pour régler. Un administrateur validera votre paiement, puis votre salon sera activé.</small>`,
      });
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: (axios.isAxiosError(e) && e.response?.data?.error) || 'Impossible de souscrire.',
      });
    }
  };

  return { plans, mine, loading, fetchAll, souscrire };
}

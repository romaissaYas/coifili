'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';

export type NotificationSalon = {
  id: number;
  type: string;
  rendezvous_id: number | null;
  reference: string | null;
  client_nom: string | null;
  prestation_nom: string | null;
  date_rdv: string | null;
  heure_rdv: string | null;
  titre: string | null;
  message: string | null;
  lien: string | null;
  lu: number; // 0 | 1
  created_at: string;
};

/**
 * Notifications de l'Espace Coiffeur. Pas de temps réel côté serveur : on
 * interroge périodiquement l'API (polling léger) — la notification apparaît
 * donc automatiquement sans rechargement de page. Les erreurs réseau sont
 * silencieuses (on conserve l'état affiché).
 */
export function useNotifications(pollMs = 30000) {
  const [notifications, setNotifications] = useState<NotificationSalon[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await axios.get<{ notifications: NotificationSalon[]; nonLues: number }>(
        `${API_URL}/api/notifications`,
        { headers: getAuthHeaders() }
      );
      setNotifications(res.data.notifications ?? []);
      setNonLues(res.data.nonLues ?? 0);
    } catch {
      // Réseau / salon non actif : on garde l'état précédent, sans casser l'UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const t = setInterval(charger, pollMs);
    return () => clearInterval(t);
  }, [charger, pollMs]);

  const marquerLue = useCallback(async (id: number) => {
    // Mise à jour optimiste immédiate (UX), puis persistance serveur.
    setNotifications((liste) => liste.map((n) => (n.id === id ? { ...n, lu: 1 } : n)));
    setNonLues((c) => Math.max(0, c - 1));
    try {
      await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
    } catch {
      charger(); // resynchronise en cas d'échec
    }
  }, [charger]);

  const marquerToutesLues = useCallback(async () => {
    setNotifications((liste) => liste.map((n) => ({ ...n, lu: 1 })));
    setNonLues(0);
    try {
      await axios.patch(`${API_URL}/api/notifications/read-all`, {}, { headers: getAuthHeaders() });
    } catch {
      charger();
    }
  }, [charger]);

  return { notifications, nonLues, loading, charger, marquerLue, marquerToutesLues };
}

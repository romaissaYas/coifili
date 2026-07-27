'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';

export type NotificationAdmin = {
  id: number;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  ref_type: string | null;
  ref_id: number | null;
  lu: number; // 0 | 1
  created_at: string;
};

/**
 * Notifications de l'administrateur. Même stratégie que l'Espace Coiffure :
 * polling léger (pas de temps réel serveur), mises à jour optimistes, erreurs
 * réseau silencieuses.
 */
export function useAdminNotifications(pollMs = 30000) {
  const [notifications, setNotifications] = useState<NotificationAdmin[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const res = await axios.get<{ notifications: NotificationAdmin[]; nonLues: number }>(
        `${API_URL}/api/admin/notifications`,
        { headers: getAuthHeaders() }
      );
      setNotifications(res.data.notifications ?? []);
      setNonLues(res.data.nonLues ?? 0);
    } catch {
      // Réseau / non-admin : on conserve l'état affiché, sans casser l'UI.
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
    setNotifications((liste) => liste.map((n) => (n.id === id ? { ...n, lu: 1 } : n)));
    setNonLues((c) => Math.max(0, c - 1));
    try {
      await axios.patch(`${API_URL}/api/admin/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
    } catch {
      charger();
    }
  }, [charger]);

  const marquerToutesLues = useCallback(async () => {
    setNotifications((liste) => liste.map((n) => ({ ...n, lu: 1 })));
    setNonLues(0);
    try {
      await axios.patch(`${API_URL}/api/admin/notifications/read-all`, {}, { headers: getAuthHeaders() });
    } catch {
      charger();
    }
  }, [charger]);

  return { notifications, nonLues, loading, charger, marquerLue, marquerToutesLues };
}

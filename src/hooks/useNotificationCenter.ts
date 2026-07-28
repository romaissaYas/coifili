'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { CentreNotif, RawNotifRow } from '@/components/notifications/NotificationCenter';

type Filtres = { q: string; type: string; statut: string; tri: string };
const FILTRES_INIT: Filtres = { q: '', type: '', statut: '', tri: 'recent' };
const LIMIT = 15;

/**
 * Pilote un centre de notifications (liste paginée + filtres + actions), pour
 * un espace donné via son chemin de base (`/api/notifications` côté salon,
 * `/api/admin/notifications` côté admin). Le `normaliser` convertit les lignes
 * brutes de l'espace en éléments communs `CentreNotif`. Aucune régression : ces
 * endpoints paginés/DELETE sont additifs (la cloche garde ses propres routes).
 */
export function useNotificationCenter(
  base: string,
  normaliser: (row: RawNotifRow) => CentreNotif
) {
  const [items, setItems] = useState<CentreNotif[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_INIT);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: RawNotifRow[]; total: number; totalPages: number }>(
        `${API_URL}${base}/page`,
        { headers: getAuthHeaders(), params: { ...filtres, page, limit: LIMIT } }
      );
      setItems((res.data.data ?? []).map(normaliser));
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch {
      /* réseau : on conserve l'état affiché */
    } finally {
      setLoading(false);
    }
  }, [base, normaliser, filtres, page]);

  useEffect(() => { charger(); }, [charger]);

  // Tout changement de filtre ramène à la première page.
  const onFiltre = (champ: keyof Filtres, valeur: string) => {
    setFiltres((f) => ({ ...f, [champ]: valeur }));
    setPage(1);
  };

  const onLue = useCallback(async (id: number) => {
    setItems((liste) => liste.map((n) => (n.id === id ? { ...n, lu: 1 } : n)));
    try {
      await axios.patch(`${API_URL}${base}/${id}/read`, {}, { headers: getAuthHeaders() });
    } catch { charger(); }
  }, [base, charger]);

  const onToutMarquer = useCallback(async () => {
    setItems((liste) => liste.map((n) => ({ ...n, lu: 1 })));
    try {
      await axios.patch(`${API_URL}${base}/read-all`, {}, { headers: getAuthHeaders() });
    } catch { charger(); }
  }, [base, charger]);

  const onSupprimer = useCallback(async (id: number) => {
    const r = await Swal.fire({
      icon: 'warning', title: 'Supprimer cette notification ?',
      showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    setItems((liste) => liste.filter((n) => n.id !== id));
    try {
      await axios.delete(`${API_URL}${base}/${id}`, { headers: getAuthHeaders() });
      charger();
    } catch {
      charger();
    }
  }, [base, charger]);

  return {
    items, total, page, totalPages, loading, filtres,
    onFiltre, onPage: setPage, onLue, onSupprimer, onToutMarquer,
  };
}

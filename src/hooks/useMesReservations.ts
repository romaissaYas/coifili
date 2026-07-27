import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { MesReservation } from '@/types/reservation';

/** Charge et rafraîchit les réservations du client connecté. */
export function useMesReservations() {
  const [reservations, setReservations] = useState<MesReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/rendezvous/mine`, { headers: getAuthHeaders() });
      setReservations(res.data);
    } catch {
      setError('Impossible de charger vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return { reservations, loading, error, refresh: fetchReservations };
}

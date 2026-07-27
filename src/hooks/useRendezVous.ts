import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { RendezVous } from '@/types/rendezvous';
import type { Stats } from '@/types/stats';

/** Rendez-vous et statistiques du tableau de bord pour le salon connecté. */
export function useRendezVous() {
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [loadingRendezvous, setLoadingRendezvous] = useState(true);

  const fetchRendezvous = async () => {
    setLoadingRendezvous(true);
    try {
      const response = await axios.get(`${API_URL}/api/rendezvous`, { headers: getAuthHeaders() });
      setRendezvous(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous :', error);
    } finally {
      setLoadingRendezvous(false);
    }
  };

  useEffect(() => {
    fetchRendezvous();
  }, []);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${API_URL}/api/rendezvous/stats`, { headers: getAuthHeaders() });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques :', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { rendezvous, loadingRendezvous, fetchRendezvous, stats, loadingStats, fetchStats };
}

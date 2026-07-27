import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/apiConfig';
import type { SalonResult } from '@/types/salon';
import type { HoraireJourPublic, EmployePublic, PrestationPublic } from '@/types/booking';

/**
 * Charge en une fois toutes les données publiques d'un salon (fiche, horaires,
 * prestations, employés) via les endpoints publics du backend.
 */
export function useSalonDetail(id: string | number | undefined) {
  const [salon, setSalon] = useState<SalonResult | null>(null);
  const [horaires, setHoraires] = useState<HoraireJourPublic[]>([]);
  const [prestations, setPrestations] = useState<PrestationPublic[]>([]);
  const [employes, setEmployes] = useState<EmployePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sRes, hRes, pRes, eRes] = await Promise.all([
          fetch(`${API_URL}/api/salons/${id}`),
          fetch(`${API_URL}/api/horaires/${id}`),
          fetch(`${API_URL}/api/prestations/salon/${id}`),
          fetch(`${API_URL}/api/employes/salon/${id}`),
        ]);

        if (!sRes.ok) {
          if (!cancelled) setError('Salon introuvable.');
          return;
        }

        const [s, h, p, e] = await Promise.all([sRes.json(), hRes.json(), pRes.json(), eRes.json()]);
        if (cancelled) return;
        setSalon(s);
        setHoraires(Array.isArray(h) ? h : []);
        setPrestations(Array.isArray(p) ? p : []);
        setEmployes(Array.isArray(e) ? e : []);
      } catch {
        if (!cancelled) setError('Une erreur est survenue lors du chargement du salon.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { salon, horaires, prestations, employes, loading, error };
}

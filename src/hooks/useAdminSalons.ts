'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { AdminSalon } from '@/types/admin';

/** Charge la liste des salons (admin), filtrable par statut / recherche. */
export function useAdminSalons(params?: { statut?: string; q?: string }) {
  const statut = params?.statut;
  const q = params?.q;
  const [salons, setSalons] = useState<AdminSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSalons(await adminApi.listSalons({ statut, q }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [statut, q]);

  useEffect(() => {
    charger();
  }, [charger]);

  return { salons, loading, error, reload: charger };
}

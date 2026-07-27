'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Petit hook générique de liste admin : exécute un `fetcher` au montage et à
 * chaque changement de `deps`, expose data/loading/error/reload. Évite de
 * dupliquer la même mécanique dans chaque page.
 */
export function useAdminList<T>(fetcher: () => Promise<T[]>, deps: unknown[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

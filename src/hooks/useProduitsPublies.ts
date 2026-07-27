'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/apiConfig';
import type { Product } from '@/types/product';

const num = (v: number | string | null) => (v == null ? null : Number(v));

/**
 * Produits PUBLIÉS (public) pour la section accueil. Charge une fois via
 * /api/products/published (seuls les produits publiés de salons actifs), puis
 * filtre côté client par catégorie (ou « promotions ») et recherche.
 */
export function useProduitsPublies() {
  const [produits, setProduits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categorie, setCategorie] = useState(''); // '' = Tous, 'promotions' = en promo, sinon une catégorie
  const [q, setQ] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products/published`);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data = await res.json();
      setProduits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erreur chargement produits publiés :', e);
      setError('Impossible de charger les produits pour le moment.');
      setProduits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return produits.filter((p) => {
      const enPromo = num(p.prix_promo) != null && (num(p.prix_promo) as number) < (num(p.prix) as number);
      const matchCat =
        !categorie || (categorie === 'promotions' ? enPromo : p.categorie === categorie);
      const matchQ =
        !query ||
        [p.nom, p.marque, p.salon_nom]
          .filter((v): v is string => Boolean(v))
          .some((v) => v.toLowerCase().includes(query));
      return matchCat && matchQ;
    });
  }, [produits, categorie, q]);

  return { produits, filtered, loading, error, reload: charger, categorie, setCategorie, q, setQ };
}

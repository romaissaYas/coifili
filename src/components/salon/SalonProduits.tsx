'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/apiConfig';
import type { Product } from '@/types/product';

const DA = (v: number | string) => `${Number(v).toLocaleString('fr-FR')} DA`;
const num = (v: number | string | null) => (v == null ? null : Number(v));

/**
 * Rubrique publique « Produits du salon » (fiche salon). Affiche uniquement les
 * produits PUBLIÉS du salon (consultation seule, aucun achat en ligne).
 * Masquée si le salon n'a aucun produit publié.
 */
export default function SalonProduits({ salonId }: { salonId: number }) {
  const [produits, setProduits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let actif = true;
    fetch(`${API_URL}/api/products/published?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (actif) setProduits(Array.isArray(d) ? d : []);
      })
      .catch(() => actif && setProduits([]))
      .finally(() => actif && setLoading(false));
    return () => {
      actif = false;
    };
  }, [salonId]);

  if (loading || produits.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Produits du salon</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {produits.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-gray-100">
            <div className="relative h-32 w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0] || '/img/bg4.jpg'} alt={p.nom} loading="lazy" className="h-full w-full object-cover" />
              {num(p.prix_promo) != null && (
                <span className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">Promo</span>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{p.nom}</h3>
              <div className="mt-1 flex items-center gap-1.5">
                {num(p.prix_promo) != null ? (
                  <>
                    <span className="text-sm font-bold text-rose-600">{DA(p.prix_promo!)}</span>
                    <span className="text-xs text-gray-400 line-through">{DA(p.prix)}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-gray-900">{DA(p.prix)}</span>
                )}
              </div>
              {p.description && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.description}</p>}
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.disponibilite ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.disponibilite ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

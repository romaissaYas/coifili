'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/public/PublicHeader';
import { API_URL } from '@/lib/apiConfig';
import { WILAYAS, CATEGORIES } from '@/lib/wilayas';
import type { SalonResult } from '@/types/salon';

export default function SalonsPage() {
  const [nom, setNom] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [categorie, setCategorie] = useState('');
  const [resultats, setResultats] = useState<SalonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recherche, setRecherche] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rechercher = async () => {
    setLoading(true);
    setRecherche(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nom.trim()) params.set('nom', nom.trim());
      if (wilaya) params.set('wilaya', wilaya);
      if (categorie) params.set('categorie', categorie);
      const res = await fetch(`${API_URL}/api/salons?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur serveur');
      setResultats(await res.json());
    } catch {
      setError('Une erreur est survenue lors de la recherche.');
      setResultats([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trouver un salon</h1>

        {/* Filtres combinables */}
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <input
            type="text"
            placeholder="Nom du salon"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && rechercher()}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={wilaya}
            onChange={(e) => setWilaya(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Toutes les wilayas</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.nom}>{w.nom}</option>
            ))}
          </select>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={rechercher}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg px-4 py-2 transition"
          >
            Rechercher
          </button>
        </div>

        {loading && <p className="text-gray-500">Recherche en cours...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && recherche && resultats.length === 0 && !error && (
          <p className="text-gray-500 italic">Aucun salon ne correspond à votre recherche.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultats.map((salon) => (
            <Link
              key={salon.id}
              href={`/salon/${salon.id}`}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <div
                className="h-40 bg-cover bg-center bg-gray-200"
                style={salon.image ? { backgroundImage: `url(${salon.image})` } : undefined}
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{salon.nom}</h3>
                  <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full capitalize">
                    {salon.categorie}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1">📍 {salon.ville}, {salon.wilaya}</p>
                <span className="mt-3 inline-block text-sm text-rose-600 font-medium">Voir le salon →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

'use client';

import { Check, X } from 'lucide-react';
import { useAdminSalons } from '@/hooks/useAdminSalons';
import { salonActions } from '@/lib/adminActions';

export default function AdminInscriptionsPage() {
  const { salons, loading, error, reload } = useAdminSalons({ statut: 'en_attente' });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Inscriptions en attente</h1>
      <p className="mb-6 text-sm text-gray-500">Validez ou refusez les nouveaux salons inscrits.</p>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : salons.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Aucune inscription en attente. 🎉
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {salons.map((s) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{s.nom}</h3>
              <p className="mt-1 text-sm capitalize text-gray-500">{s.categorie} · {s.type}</p>
              <p className="mt-2 text-sm text-gray-600">📍 {s.ville}, {s.wilaya}</p>
              <p className="text-sm text-gray-600">📞 {s.telephone}</p>
              <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
                <p className="font-medium text-gray-700">
                  {[s.ownerFirstName, s.ownerLastName].filter(Boolean).join(' ') || 'Propriétaire'}
                </p>
                <p className="text-gray-500">{s.ownerEmail}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => salonActions.validate(s, reload)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Check className="h-4 w-4" /> Valider
                </button>
                <button
                  onClick={() => salonActions.refuse(s, reload)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

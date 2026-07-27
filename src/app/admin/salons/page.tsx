'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useAdminSalons } from '@/hooks/useAdminSalons';
import { salonActions } from '@/lib/adminActions';
import SalonStatutBadge, { PaiementBadge } from '@/components/admin/SalonStatutBadge';
import type { AdminSalon } from '@/types/admin';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actifs' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'suspendu', label: 'Suspendus' },
  { value: 'expire', label: 'Expirés' },
];

function Actions({ salon, reload }: { salon: AdminSalon; reload: () => void }) {
  const btn = 'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors';
  return (
    <div className="flex flex-wrap gap-1.5">
      {salon.statut === 'en_attente' && (
        <>
          <button onClick={() => salonActions.validate(salon, reload)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Valider</button>
          <button onClick={() => salonActions.refuse(salon, reload)} className={`${btn} bg-red-100 text-red-700 hover:bg-red-200`}>Refuser</button>
        </>
      )}
      {salon.statut === 'actif' && (
        <button onClick={() => salonActions.suspend(salon, reload)} className={`${btn} bg-orange-100 text-orange-700 hover:bg-orange-200`}>Suspendre</button>
      )}
      {(salon.statut === 'suspendu' || salon.statut === 'expire') && (
        <button onClick={() => salonActions.reactivate(salon, reload)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Réactiver</button>
      )}
      <button onClick={() => salonActions.subscription(salon, reload)} className={`${btn} bg-rose-100 text-rose-700 hover:bg-rose-200`}>Abonnement</button>
      <button onClick={() => salonActions.remove(salon, reload)} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`}>Supprimer</button>
    </div>
  );
}

export default function AdminSalonsPage() {
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const { salons, loading, error, reload } = useAdminSalons({ q, statut });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Salons</h1>
        <Link
          href="/admin/salons/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-pink-700"
        >
          <Plus className="h-4 w-4" /> Nouveau salon
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, email, ville…"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : salons.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucun salon.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Salon</th>
                <th className="px-4 py-3">Propriétaire</th>
                <th className="px-4 py-3">Localisation</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Abonnement</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salons.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{s.nom}</div>
                    <div className="text-xs capitalize text-gray-500">{s.categorie} · {s.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{[s.ownerFirstName, s.ownerLastName].filter(Boolean).join(' ') || '—'}</div>
                    <div className="text-xs text-gray-500">{s.ownerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.ville}, {s.wilaya}
                    <div className="text-xs text-gray-400">{s.telephone}</div>
                  </td>
                  <td className="px-4 py-3"><SalonStatutBadge statut={s.statut} /></td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{s.abonnement_fin ? `→ ${s.abonnement_fin}` : '—'}</div>
                    <div className="mt-1"><PaiementBadge statut={s.paiement_statut} /></div>
                  </td>
                  <td className="px-4 py-3"><Actions salon={s} reload={reload} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

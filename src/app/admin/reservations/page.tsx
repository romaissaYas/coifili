'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { useAdminList } from '@/hooks/useAdminList';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { AdminReservation } from '@/types/admin';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirme', label: 'Confirmés' },
  { value: 'termine', label: 'Terminés' },
  { value: 'annule', label: 'Annulés' },
];

export default function AdminReservationsPage() {
  const [statut, setStatut] = useState('');
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  // Consultation globale (lecture seule) : la gestion quotidienne des
  // réservations est faite par chaque coiffeur dans son Espace Coiffure (Agenda).
  const { data: reservations, loading, error } = useAdminList<AdminReservation>(
    () => adminApi.listReservations({ statut, date, q }),
    [statut, date, q]
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Réservations</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client…" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : reservations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucune réservation.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Salon</th>
                <th className="px-4 py-3">Prestation</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.date}</div>
                    <div className="text-xs text-gray-500">{r.heure_debut?.slice(0, 5)}{r.reference ? ` · ${r.reference}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {[r.client_prenom, r.client_nom].filter(Boolean).join(' ')}
                    <div className="text-xs text-gray-400">{r.client_telephone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.salon_nom ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.prestation_nom ?? '—'}
                    {r.prix != null && <div className="text-xs text-gray-400">{r.prix} DA</div>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge statut={r.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

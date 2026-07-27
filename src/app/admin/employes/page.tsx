'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { employeActions } from '@/lib/adminActions';
import { useAdminList } from '@/hooks/useAdminList';
import type { AdminEmploye } from '@/types/admin';

export default function AdminEmployesPage() {
  const [q, setQ] = useState('');
  const { data: employes, loading, error, reload } = useAdminList<AdminEmploye>(
    () => adminApi.listEmployes({ q }),
    [q]
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Employés</h1>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 sm:max-w-sm">
        <Search className="h-4 w-4 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom ou poste…" className="w-full bg-transparent py-2 text-sm outline-none" />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : employes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucun employé.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Salon</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employes.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{e.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{e.poste}</td>
                  <td className="px-4 py-3 text-gray-600">{e.salon_nom ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => employeActions.remove(e, reload)} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

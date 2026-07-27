'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { userActions } from '@/lib/adminActions';
import { UserStatutBadge } from '@/components/admin/SalonStatutBadge';
import type { AdminUser } from '@/types/admin';

const ROLES = [
  { value: '', label: 'Tous les rôles' },
  { value: 'user', label: 'Clients' },
  { value: 'coiffeur', label: 'Coiffeurs' },
];
const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actifs' },
  { value: 'suspendu', label: 'Suspendus' },
];
const TRIS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'ancien', label: 'Plus anciens' },
  { value: 'nom', label: 'Nom (A→Z)' },
];
const LIMIT = 15;

const fmtDate = (s: string | null) => (s ? new Date(s.replace(' ', 'T')).toLocaleDateString('fr-FR') : '—');
const fmtDateTime = (s: string | null) =>
  s ? new Date(s.replace(' ', 'T')).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais';

export default function AdminClientsPage() {
  const [role, setRole] = useState('');
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const [tri, setTri] = useState('recent');
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listUsersPage({ role, statut, q, tri, page, limit: LIMIT });
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [role, statut, q, tri, page]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Tout changement de filtre/tri/recherche ramène à la première page.
  const changer = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const btn = 'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors';
  const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Utilisateurs</h1>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => changer(setQ)(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <select value={role} onChange={(e) => changer(setRole)(e.target.value)} className={selectCls}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statut} onChange={(e) => changer(setStatut)(e.target.value)} className={selectCls}>
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={tri} onChange={(e) => changer(setTri)(e.target.value)} className={selectCls}>
          {TRIS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : users.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucun utilisateur.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3">Dernière connexion</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{[u.firstName, u.lastName].filter(Boolean).join(' ')}</div>
                      {u.salonNom && <div className="text-xs text-gray-500">Salon : {u.salonNom}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.email}
                      <div className="text-xs text-gray-400">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                        {u.userType === 'user' ? 'client' : u.userType === 'coiffeur' ? 'coiffeur' : 'admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><UserStatutBadge statut={u.statut} /></td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDateTime(u.last_login)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => userActions.edit(u, charger)} className={`${btn} bg-blue-100 text-blue-700 hover:bg-blue-200`}>Modifier</button>
                        {u.statut === 'actif' ? (
                          <button onClick={() => userActions.suspend(u, charger)} className={`${btn} bg-orange-100 text-orange-700 hover:bg-orange-200`}>Suspendre</button>
                        ) : (
                          <button onClick={() => userActions.reactivate(u, charger)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Réactiver</button>
                        )}
                        <button onClick={() => userActions.resetPassword(u, charger)} className={`${btn} bg-rose-100 text-rose-700 hover:bg-rose-200`}>Reset MDP</button>
                        <button onClick={() => userActions.remove(u, charger)} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {total} utilisateur{total > 1 ? 's' : ''} · page {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminSalons } from '@/hooks/useAdminSalons';
import { useAdminList } from '@/hooks/useAdminList';
import { adminApi } from '@/lib/adminApi';
import { salonActions, abonnementActions, paymentActions } from '@/lib/adminActions';
import SalonStatutBadge, { PaiementBadge } from '@/components/admin/SalonStatutBadge';
import type { AdminPayment } from '@/types/admin';

const PAY_STATUT_LABELS: Record<string, string> = {
  waiting_cash: 'Espèces en attente',
  waiting_card: 'Carte en attente',
  paid: 'Payé',
  refused: 'Refusé',
  pending: 'En attente',
  cancelled: 'Annulé',
};

function PaiementsPanel({ onChanged }: { onChanged: () => void }) {
  const [statut, setStatut] = useState('waiting_cash');
  const { data: paiements, loading, reload } = useAdminList<AdminPayment>(
    () => adminApi.listPayments({ statut }),
    [statut]
  );
  const rafraichir = () => {
    reload();
    onChanged();
  };
  const btn = 'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors';

  return (
    <div className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Paiements</h2>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
          <option value="waiting_cash">Espèces en attente</option>
          <option value="waiting_card">Carte en attente</option>
          <option value="paid">Payés</option>
          <option value="refused">Refusés</option>
          <option value="">Tous</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : paiements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500">Aucun paiement.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Salon</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiements.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{p.salon_nom ?? '—'}</div>
                    <div className="text-xs text-gray-500">{p.salon_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.plan_nom ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.methode === 'cash' ? 'Espèces' : p.methode === 'cib' ? 'Carte CIB' : p.methode}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{Number(p.montant).toLocaleString('fr-FR')} DA</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.statut === 'paid' ? 'bg-green-100 text-green-700' : p.statut === 'refused' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {PAY_STATUT_LABELS[p.statut] ?? p.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.methode === 'cash' && p.statut === 'waiting_cash' ? (
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => paymentActions.validate(p.id, p.reference, rafraichir)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Valider</button>
                        <button onClick={() => paymentActions.refuse(p.id, p.reference, rafraichir)} className={`${btn} bg-red-100 text-red-700 hover:bg-red-200`}>Refuser</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'actif', label: 'Actifs' },
  { value: 'expire', label: 'Expirés' },
  { value: 'suspendu', label: 'Suspendus' },
];

function joursRestants(fin: string | null): number | null {
  if (!fin) return null;
  const diff = new Date(`${fin}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(diff / 86400000);
}

export default function AdminAbonnementsPage() {
  const [statut, setStatut] = useState('');
  const [q, setQ] = useState('');
  const { salons, loading, error, reload } = useAdminSalons({ statut, q });
  const btn = 'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
        <button
          onClick={() => abonnementActions.runJob(reload)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-pink-700"
        >
          <RefreshCw className="h-4 w-4" /> Traiter les abonnements
        </button>
      </div>

      {/* Paiements d'abonnement (valider/refuser espèces) */}
      <PaiementsPanel onChanged={reload} />

      <h2 className="mb-3 text-lg font-semibold text-gray-800">Salons</h2>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un salon (nom, email, ville)…"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salons.map((s) => {
                const jours = joursRestants(s.abonnement_fin);
                const bientot = jours !== null && jours >= 0 && jours <= 30;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.nom}</td>
                    <td className="px-4 py-3"><SalonStatutBadge statut={s.statut} /></td>
                    <td className="px-4 py-3 text-gray-600">{s.abonnement_debut ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.abonnement_fin ?? '—'}
                      {jours !== null && (
                        <div className={`text-xs ${jours < 0 ? 'text-red-500' : bientot ? 'text-amber-600' : 'text-gray-400'}`}>
                          {jours < 0 ? `expiré (${-jours} j)` : `${jours} j restants`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.abonnement_montant != null ? `${s.abonnement_montant} DA` : '—'}</td>
                    <td className="px-4 py-3"><PaiementBadge statut={s.paiement_statut} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => salonActions.changePlan(s, reload)} className={`${btn} bg-indigo-100 text-indigo-700 hover:bg-indigo-200`}>Changer plan</button>
                        <button onClick={() => salonActions.extend(s, reload)} className={`${btn} bg-blue-100 text-blue-700 hover:bg-blue-200`}>Prolonger</button>
                        <button onClick={() => salonActions.subscription(s, reload)} className={`${btn} bg-rose-100 text-rose-700 hover:bg-rose-200`}>Dates</button>
                        {s.statut === 'actif' && (
                          <button onClick={() => salonActions.suspend(s, reload)} className={`${btn} bg-orange-100 text-orange-700 hover:bg-orange-200`}>Suspendre</button>
                        )}
                        {(s.statut === 'suspendu' || s.statut === 'expire') && (
                          <button onClick={() => salonActions.reactivate(s, reload)} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>Réactiver</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

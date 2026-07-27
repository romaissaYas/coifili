'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useAdminList } from '@/hooks/useAdminList';
import type { AuditLog } from '@/types/admin';

const ACTIONS = [
  '', 'ADMIN_LOGIN',
  'SALON_VALIDATE', 'SALON_REFUSE', 'SALON_SUSPEND', 'SALON_REACTIVATE', 'SALON_UPDATE', 'SALON_DELETE', 'SALON_SUBSCRIPTION_UPDATE',
  'USER_UPDATE', 'USER_SUSPEND', 'USER_REACTIVATE', 'USER_DELETE', 'USER_RESET_PASSWORD',
  'RESERVATION_STATUS', 'RESERVATION_CANCEL', 'RESERVATION_DELETE',
  'EMPLOYE_DELETE', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_JOB_RUN',
];

export default function AdminJournalPage() {
  const [action, setAction] = useState('');
  const { data: logs, loading, error } = useAdminList<AuditLog>(
    () => adminApi.listAudit({ action, limit: 200 }),
    [action]
  );

  const auteur = (l: AuditLog) =>
    l.firstName || l.lastName
      ? `${[l.firstName, l.lastName].filter(Boolean).join(' ')}`
      : l.user_id
        ? `#${l.user_id}`
        : 'Système';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Journal d&apos;activité</h1>

      <div className="mb-4">
        <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          {ACTIONS.map((a) => <option key={a} value={a}>{a === '' ? 'Toutes les actions' : a}</option>)}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : logs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">Aucune entrée.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-gray-700">{auteur(l)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.entity_type ? `${l.entity_type} #${l.entity_id ?? '—'}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{l.ip_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

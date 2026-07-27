'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { adminApi } from '@/lib/adminApi';
import type { AdminStats } from '@/types/admin';

function formatDA(n: number): string {
  return `${n.toLocaleString('fr-FR')} DA`;
}

export default function AdminStatistiquesPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>;
  if (!stats) return <p className="text-gray-500">Chargement…</p>;

  const statutData = [
    { name: 'Actifs', value: stats.salonsActifs, color: '#16a34a' },
    { name: 'En attente', value: stats.salonsEnAttente, color: '#d97706' },
    { name: 'Suspendus', value: stats.salonsSuspendus, color: '#ea580c' },
    { name: 'Expirés', value: stats.salonsExpires, color: '#dc2626' },
  ];

  const lignes: [string, string | number][] = [
    ['Total salons', stats.totalSalons],
    ['Salons actifs', stats.salonsActifs],
    ['Salons en attente', stats.salonsEnAttente],
    ['Salons suspendus', stats.salonsSuspendus],
    ['Salons expirés', stats.salonsExpires],
    ['Nouveaux salons ce mois', stats.nouveauxSalonsCeMois],
    ['Total clients', stats.totalClients],
    ['Total réservations', stats.totalReservations],
    ["Rendez-vous aujourd'hui", stats.rdvAujourdhui],
    ['Revenus abonnements', formatDA(stats.revenusAbonnements)],
    ['Revenus prestations', formatDA(stats.revenusPrestations)],
    ['Revenus estimés (total)', formatDA(stats.revenusEstimes)],
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Statistiques</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Salons par statut</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statutData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statutData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Indicateurs détaillés</h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-gray-100">
              {lignes.map(([label, value]) => (
                <tr key={label}>
                  <td className="py-2.5 text-gray-600">{label}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

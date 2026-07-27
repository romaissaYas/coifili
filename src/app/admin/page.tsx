'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import { adminApi } from '@/lib/adminApi';
import type { AdminStats } from '@/types/admin';

function formatDA(n: number): string {
  return `${n.toLocaleString('fr-FR')} DA`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>;
  }
  if (!stats) {
    return <p className="text-gray-500">Chargement du tableau de bord…</p>;
  }

  const statutData = [
    { name: 'Actifs', value: stats.salonsActifs, color: '#16a34a' },
    { name: 'En attente', value: stats.salonsEnAttente, color: '#d97706' },
    { name: 'Suspendus', value: stats.salonsSuspendus, color: '#ea580c' },
    { name: 'Expirés', value: stats.salonsExpires, color: '#dc2626' },
  ];

  const revenusData = [
    { name: 'Abonnements', value: stats.revenusAbonnements, color: '#e11d67' },
    { name: 'Prestations', value: stats.revenusPrestations, color: '#f59e0b' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tableau de bord</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Salons" value={stats.totalSalons} subtitle={`${stats.salonsActifs} actifs`} />
        <StatCard title="Clients" value={stats.totalClients} />
        <StatCard title="Réservations" value={stats.totalReservations} subtitle={`${stats.rdvAujourdhui} aujourd'hui`} />
        <StatCard title="Revenus estimés" value={formatDA(stats.revenusEstimes)} />
        <StatCard title="En attente" value={stats.salonsEnAttente} subtitle="à valider" />
        <StatCard title="Suspendus" value={stats.salonsSuspendus} />
        <StatCard title="Expirés" value={stats.salonsExpires} />
        <StatCard title="Nouveaux ce mois" value={stats.nouveauxSalonsCeMois} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Salons par statut</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statutData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statutData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Revenus estimés</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={revenusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {revenusData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatDA(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

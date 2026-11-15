'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, PencilLine, CalendarClock, CheckCircle2, Plus } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import type { IgPost, IgPostStats } from '@/types/marketing';

function Carte({ icon, label, valeur, couleur }: { icon: React.ReactNode; label: string; valeur: number; couleur: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${couleur}`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{valeur}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default function MarketingDashboard() {
  const [stats, setStats] = useState<IgPostStats | null>(null);
  const [prochains, setProchains] = useState<IgPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, prog] = await Promise.all([
          adminApi.marketing.postStats(),
          adminApi.marketing.listPosts({ statut: 'programme', tri: 'date_pub', limit: 5 }),
        ]);
        setStats(s);
        setProchains(prog.data);
      } catch {
        /* réseau : on garde l'état */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-gray-500">Chargement…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Vue d’ensemble</h2>
        <Link
          href="/admin/marketing/publications"
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" /> Nouvelle publication
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Carte icon={<FileText className="h-5 w-5 text-gray-600" />} label="Publications" valeur={stats?.total ?? 0} couleur="bg-gray-100" />
        <Carte icon={<PencilLine className="h-5 w-5 text-amber-600" />} label="Brouillons" valeur={stats?.brouillon ?? 0} couleur="bg-amber-100" />
        <Carte icon={<CalendarClock className="h-5 w-5 text-blue-600" />} label="Programmées" valeur={stats?.programme ?? 0} couleur="bg-blue-100" />
        <Carte icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} label="Publiées" valeur={stats?.publie ?? 0} couleur="bg-green-100" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Prochains contenus programmés</h3>
        {prochains.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune publication programmée pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {prochains.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="min-w-0 truncate text-sm font-medium text-gray-800">{p.titre}</span>
                <span className="shrink-0 text-xs text-gray-500">
                  {p.date_publication ? new Date(p.date_publication.replace(' ', 'T')).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Reels, Stories, Stories à la une, Calendrier, Médiathèque et publication automatique via Meta arrivent dans les prochaines étapes.
      </p>
    </div>
  );
}

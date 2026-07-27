import { CalendarCheck, CalendarDays, CalendarRange, Wallet, Coins, UserPlus, TrendingUp } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { CARD, PageHeading, SectionTitle, EmptyState } from '@/components/dashboard/ui';
import type { Stats } from '@/types/stats';

type Props = {
  stats: Stats | null;
  loadingStats: boolean;
};

const DA = (v: number | string) => `${Number(v).toLocaleString('fr-FR')} DA`;

export default function DashboardTab({ stats, loadingStats }: Props) {
  const maxPresta = stats ? Math.max(...stats.prestationsPopulaires.map((p) => p.total), 1) : 1;

  return (
    <>
      <PageHeading
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre activité"
        icon={<TrendingUp size={20} />}
      />

      {loadingStats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${CARD} h-28 animate-pulse`} />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Rendez-vous aujourd'hui" value={stats.rdvAujourdhui} icon={<CalendarCheck size={20} />} accent="rose" />
            <StatCard title="Rendez-vous cette semaine" value={stats.rdvSemaine} icon={<CalendarDays size={20} />} accent="blue" />
            <StatCard title="Rendez-vous ce mois" value={stats.rdvMois} icon={<CalendarRange size={20} />} accent="violet" />
            <StatCard title="Chiffre d'affaires du jour" value={DA(stats.chiffreAffairesJour)} icon={<Wallet size={20} />} accent="green" />
            <StatCard title="Chiffre d'affaires du mois" value={DA(stats.chiffreAffairesMois)} icon={<Coins size={20} />} accent="amber" />
            <StatCard title="Nouveaux clients ce mois" value={stats.nouveauxClientsMois} icon={<UserPlus size={20} />} accent="slate" />
          </div>

          <div className={`${CARD} mt-6 p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <SectionTitle>Prestations les plus réservées</SectionTitle>
            </div>
            {stats.prestationsPopulaires.length === 0 ? (
              <EmptyState>Aucune donnée pour le moment.</EmptyState>
            ) : (
              <ul className="space-y-4">
                {stats.prestationsPopulaires.map((p) => (
                  <li key={p.nom}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{p.nom}</span>
                      <span className="font-semibold text-slate-500">{p.total} réservation(s)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all"
                        style={{ width: `${(p.total / maxPresta) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

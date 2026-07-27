import { Search, CalendarDays } from 'lucide-react';
import StatusBadge from '@/components/dashboard/StatusBadge';
import RendezVousDetailModal from '@/components/dashboard/RendezVousDetailModal';
import { CARD, INPUT, PageHeading, EmptyState } from '@/components/dashboard/ui';
import type { RendezVous } from '@/types/rendezvous';
import type { EmployeStats } from '@/types/stats';
import type { VueAgenda } from '@/hooks/useAgendaFiltre';

type Props = {
  loadingRendezvous: boolean;
  agendaFiltre: RendezVous[];
  employes: EmployeStats[];
  vueAgenda: VueAgenda;
  setVueAgenda: (vue: VueAgenda) => void;
  filtreEmployeId: string;
  setFiltreEmployeId: (id: string) => void;
  filtreStatut: string;
  setFiltreStatut: (statut: string) => void;
  rechercheClient: string;
  setRechercheClient: (recherche: string) => void;
  selectedRendezVous: RendezVous | null;
  setSelectedRendezVous: (rdv: RendezVous | null) => void;
  onUpdated: () => void;
};

const initiale = (rdv: RendezVous) => (rdv.client_prenom || rdv.client_nom || '?').charAt(0).toUpperCase();

export default function AgendaTab({
  loadingRendezvous,
  agendaFiltre,
  employes,
  vueAgenda,
  setVueAgenda,
  filtreEmployeId,
  setFiltreEmployeId,
  filtreStatut,
  setFiltreStatut,
  rechercheClient,
  setRechercheClient,
  selectedRendezVous,
  setSelectedRendezVous,
  onUpdated,
}: Props) {
  return (
    <>
      <PageHeading
        title="Agenda"
        subtitle="Vos rendez-vous par jour, semaine ou mois"
        icon={<CalendarDays size={20} />}
      />

      <div className={`${CARD} mb-6 space-y-4 p-4`}>
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {(['jour', 'semaine', 'mois'] as const).map((vue) => (
            <button
              key={vue}
              onClick={() => setVueAgenda(vue)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                vueAgenda === vue ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {vue === 'jour' ? "Aujourd'hui" : vue === 'semaine' ? 'Cette semaine' : 'Ce mois'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={filtreEmployeId} onChange={(e) => setFiltreEmployeId(e.target.value)} className={INPUT}>
            <option value="">Tous les employés</option>
            {employes.map((e) => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>

          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className={INPUT}>
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirme">Confirmé</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>

          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rechercheClient}
              onChange={(e) => setRechercheClient(e.target.value)}
              placeholder="Rechercher un client…"
              className={`${INPUT} pl-9`}
            />
          </div>
        </div>
      </div>

      {loadingRendezvous && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${CARD} h-20 animate-pulse`} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {!loadingRendezvous && agendaFiltre.length === 0 && (
          <EmptyState>Aucun rendez-vous ne correspond à ces critères.</EmptyState>
        )}
        {agendaFiltre.map((rdv) => (
          <button
            key={rdv.id}
            onClick={() => setSelectedRendezVous(rdv)}
            className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition hover:border-rose-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
              {initiale(rdv)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">
                {rdv.client_prenom} {rdv.client_nom}
              </p>
              <p className="truncate text-sm text-slate-500">
                {new Date(`${rdv.date}T00:00:00`).toLocaleDateString('fr-FR')} à {rdv.heure_debut.slice(0, 5)}
                {rdv.employe_nom ? ` — ${rdv.employe_nom}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-slate-500">{rdv.prestation_nom}</p>
              <p className="text-base font-bold text-slate-900">{rdv.prix} DA</p>
              <div className="mt-1 flex justify-end">
                <StatusBadge statut={rdv.statut} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedRendezVous && (
        <RendezVousDetailModal
          rendezvous={selectedRendezVous}
          employes={employes}
          onClose={() => setSelectedRendezVous(null)}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}

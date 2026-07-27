import { Plus, Users, X, CalendarClock, TrendingUp } from 'lucide-react';
import { CARD, INPUT, BTN_PRIMARY, PageHeading, EmptyState } from '@/components/dashboard/ui';
import type { EmployeStats } from '@/types/stats';

type Props = {
  employes: EmployeStats[];
  loadingEmployes: boolean;
  popupOpen: boolean;
  setPopupOpen: (open: boolean) => void;
  nom: string;
  setNom: (nom: string) => void;
  poste: string;
  setPoste: (poste: string) => void;
  message: string;
  handleAddEmploye: (e: React.FormEvent) => void;
};

const initiales = (nom: string) =>
  nom
    .split(' ')
    .map((m) => m.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

export default function EmployesTab({
  employes,
  loadingEmployes,
  popupOpen,
  setPopupOpen,
  nom,
  setNom,
  poste,
  setPoste,
  message,
  handleAddEmploye,
}: Props) {
  return (
    <>
      <PageHeading
        title="Employés"
        subtitle="Votre équipe et ses performances"
        icon={<Users size={20} />}
        actions={
          <button onClick={() => setPopupOpen(true)} className={BTN_PRIMARY}>
            <Plus size={18} /> Ajouter un employé
          </button>
        }
      />

      {loadingEmployes && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={`${CARD} h-40 animate-pulse`} />
          ))}
        </div>
      )}

      {!loadingEmployes && employes.length === 0 ? (
        <EmptyState>Aucun employé pour le moment. Cliquez sur « Ajouter un employé ».</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {employes.map((emp) => (
            <div key={emp.id} className={`${CARD} p-5 transition hover:shadow-md`}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white">
                  {initiales(emp.nom)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-900">{emp.nom}</h3>
                  <p className="truncate text-sm font-medium text-rose-600">{emp.poste}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-400">Rendez-vous</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{emp.rdv_count}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <TrendingUp size={12} /> Généré
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{emp.revenue} DA</p>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-sm text-slate-500">
                <CalendarClock size={14} className="shrink-0 text-slate-400" />
                Prochaine dispo :{' '}
                {emp.prochaine_disponibilite
                  ? `${new Date(`${emp.prochaine_disponibilite.date}T00:00:00`).toLocaleDateString('fr-FR')} à ${emp.prochaine_disponibilite.heure}`
                  : 'aucune dans les 14 prochains jours'}
              </p>
            </div>
          ))}
        </div>
      )}

      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setPopupOpen(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un employé</h3>
              <button onClick={() => setPopupOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEmploye} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet" className={INPUT} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Poste</label>
                <input type="text" value={poste} onChange={(e) => setPoste(e.target.value)} placeholder="Ex. Coiffeuse" className={INPUT} required />
              </div>
              <button type="submit" className={`${BTN_PRIMARY} w-full`}>
                Enregistrer
              </button>
              {message && <p className="text-center text-sm font-medium text-emerald-600">{message}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

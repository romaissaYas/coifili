import { Plus, Scissors, Clock, X } from 'lucide-react';
import { CARD, INPUT, BTN_PRIMARY, BTN_GHOST, PageHeading, EmptyState } from '@/components/dashboard/ui';
import type { Prestation } from '@/types/prestation';

type NewPrestation = { nom: string; prix: string; duree: string; salonId: number | undefined };

type Props = {
  prestations: Prestation[];
  showAddPopup: boolean;
  setShowAddPopup: (show: boolean) => void;
  newPrestation: NewPrestation;
  setNewPrestation: (prestation: NewPrestation) => void;
  handleAddPrestation: () => void;
};

export default function PrestationsTab({
  prestations,
  showAddPopup,
  setShowAddPopup,
  newPrestation,
  setNewPrestation,
  handleAddPrestation,
}: Props) {
  return (
    <>
      <PageHeading
        title="Prestations"
        subtitle="Le catalogue de services proposés par votre salon"
        icon={<Scissors size={20} />}
        actions={
          <button onClick={() => setShowAddPopup(true)} className={BTN_PRIMARY}>
            <Plus size={18} /> Ajouter
          </button>
        }
      />

      {prestations.length === 0 ? (
        <EmptyState>Aucune prestation pour le moment. Cliquez sur « Ajouter ».</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {prestations.map((prestation, idx) => (
            <div
              key={idx}
              className={`${CARD} flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{prestation?.nom}</h3>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                  <Scissors size={18} />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{prestation?.prix} DA</p>
              {prestation?.duree != null && (
                <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock size={14} /> {prestation.duree} min
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setShowAddPopup(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Ajouter une prestation</h2>
              <button onClick={() => setShowAddPopup(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom de la prestation</label>
                <input
                  type="text"
                  placeholder="Ex. Coupe femme"
                  value={newPrestation.nom}
                  onChange={(e) => setNewPrestation({ ...newPrestation, nom: e.target.value })}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Prix (DA)</label>
                <input
                  type="number"
                  placeholder="Ex. 2500"
                  value={newPrestation.prix}
                  onChange={(e) => setNewPrestation({ ...newPrestation, prix: e.target.value })}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Durée (minutes)</label>
                <input
                  type="number"
                  placeholder="Ex. 45"
                  value={newPrestation.duree}
                  onChange={(e) => setNewPrestation({ ...newPrestation, duree: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAddPopup(false)} className={BTN_GHOST}>
                Annuler
              </button>
              <button onClick={handleAddPrestation} className={BTN_PRIMARY}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

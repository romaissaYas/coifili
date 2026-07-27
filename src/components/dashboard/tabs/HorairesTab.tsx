import { Clock, Plus, Save, FileDown } from 'lucide-react';
import { CARD, INPUT, BTN_PRIMARY, BTN_GHOST, PageHeading } from '@/components/dashboard/ui';
import type { HoraireJour } from '@/types/horaire';

type Props = {
  horaires: HoraireJour[];
  toggleOuvert: (jourIndex: number) => void;
  ajouterCreneau: (jourIndex: number) => void;
  changerCreneau: (jourIndex: number, creneauIndex: number, champ: 'debut' | 'fin', valeur: string) => void;
  enregistrerHoraires: () => void;
  telechargerPDF: () => void;
};

export default function HorairesTab({
  horaires,
  toggleOuvert,
  ajouterCreneau,
  changerCreneau,
  enregistrerHoraires,
  telechargerPDF,
}: Props) {
  return (
    <>
      <PageHeading
        title="Horaires & créneaux"
        subtitle="Définissez vos jours et heures d'ouverture"
        icon={<Clock size={20} />}
      />

      <div className="mx-auto max-w-4xl">
        <div className={`${CARD} p-6`}>
          <div className="space-y-4">
            {horaires.map((h, jourIndex) => (
              <div key={h.jour} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-base font-semibold text-slate-800">{h.jour}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.ouvert}
                      onChange={() => toggleOuvert(jourIndex)}
                      className="h-5 w-5 cursor-pointer accent-emerald-500"
                    />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        h.ouvert ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {h.ouvert ? 'Ouvert' : 'Fermé'}
                    </span>
                  </span>
                </label>

                {h.ouvert && (
                  <div className="mt-4 space-y-3">
                    {h.creneaux.map((c, creneauIndex) => (
                      <div key={creneauIndex} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={c.debut}
                          onChange={(e) => changerCreneau(jourIndex, creneauIndex, 'debut', e.target.value)}
                          className={INPUT}
                        />
                        <span className="font-bold text-slate-400">—</span>
                        <input
                          type="time"
                          value={c.fin}
                          onChange={(e) => changerCreneau(jourIndex, creneauIndex, 'fin', e.target.value)}
                          className={INPUT}
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => ajouterCreneau(jourIndex)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <Plus size={16} /> Ajouter un créneau
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={enregistrerHoraires} className={`${BTN_PRIMARY} flex-1 py-3 text-base`}>
              <Save size={18} /> Enregistrer
            </button>
            <button onClick={telechargerPDF} className={`${BTN_GHOST} flex-1 py-3 text-base`}>
              <FileDown size={18} /> Télécharger le PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

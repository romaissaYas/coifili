import { JOURS_SEMAINE } from '@/types/horaire';
import type { HoraireJourPublic } from '@/types/booking';

/** Horaires d'ouverture du salon, affichés dans l'ordre de la semaine. */
export default function SalonHoraires({ horaires }: { horaires: HoraireJourPublic[] }) {
  const parJour = new Map(horaires.map((h) => [h.jour, h]));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Horaires</h2>
      <ul className="divide-y divide-gray-100">
        {JOURS_SEMAINE.map((jour) => {
          const h = parJour.get(jour);
          const ouvert = h && h.ouvert && h.creneaux.length > 0;
          return (
            <li key={jour} className="flex justify-between py-2 text-sm">
              <span className="font-medium text-gray-700">{jour}</span>
              {ouvert ? (
                <span className="text-gray-600 text-right">
                  {h!.creneaux
                    .map((c) => `${c.debut.slice(0, 5)} - ${c.fin.slice(0, 5)}`)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-red-500">Fermé</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

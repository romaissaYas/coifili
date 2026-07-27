import type { PrestationPublic } from '@/types/booking';

/** Liste des prestations du salon avec tarif et durée. */
export default function SalonPrestations({ prestations }: { prestations: PrestationPublic[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Prestations</h2>
      {prestations.length === 0 ? (
        <p className="text-gray-500 italic">Aucune prestation renseignée pour le moment.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {prestations.map((p) => (
            <li key={p.id} className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-gray-800">{p.nom}</p>
                {p.duree != null && <p className="text-sm text-gray-500">{p.duree} min</p>}
              </div>
              <span className="font-semibold text-rose-600">{Number(p.prix)} DA</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

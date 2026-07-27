import type { SalonResult } from '@/types/salon';

/** En-tête de la fiche salon : image, nom, localisation, contact, description. */
export default function SalonInfo({ salon }: { salon: SalonResult }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div
        className="h-56 bg-cover bg-center bg-gray-200"
        style={salon.image ? { backgroundImage: `url(${salon.image})` } : undefined}
      />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{salon.nom}</h1>
            <p className="text-gray-600 mt-1">
              📍 {salon.ville}, {salon.wilaya}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-sm px-3 py-1 bg-rose-100 text-rose-700 rounded-full capitalize">
              {salon.categorie}
            </span>
            <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
              {salon.type}
            </span>
          </div>
        </div>

        {salon.telephone && (
          <p className="text-gray-700 mt-3">📞 {salon.telephone}</p>
        )}

        {salon.message && (
          <p className="text-gray-600 mt-4 leading-relaxed">{salon.message}</p>
        )}
      </div>
    </div>
  );
}

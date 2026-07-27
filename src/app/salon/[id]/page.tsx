'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicHeader from '@/components/public/PublicHeader';
import SalonInfo from '@/components/salon/SalonInfo';
import SalonHoraires from '@/components/salon/SalonHoraires';
import SalonPrestations from '@/components/salon/SalonPrestations';
import SalonEmployes from '@/components/salon/SalonEmployes';
import SalonProduits from '@/components/salon/SalonProduits';
import { useSalonDetail } from '@/hooks/useSalonDetail';

export default function SalonPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { salon, horaires, prestations, employes, loading, error } = useSalonDetail(id);

  return (
    <div className="min-h-screen bg-rose-50">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
            <p className="mt-4 text-gray-500">Chargement du salon...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-gray-700 text-lg">{error}</p>
            <Link href="/salons" className="mt-4 inline-block text-rose-600 underline">
              Revenir à la recherche
            </Link>
          </div>
        )}

        {!loading && !error && salon && (
          <div className="space-y-6">
            <SalonInfo salon={salon} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SalonPrestations prestations={prestations} />
              <div className="space-y-6">
                <SalonHoraires horaires={horaires} />
                <SalonEmployes employes={employes} />
              </div>
            </div>

            {/* Rubrique publique « Produits du salon » (masquée si aucun produit). */}
            <SalonProduits salonId={salon.id} />

            <div className="sticky bottom-4 flex justify-center">
              <Link
                href={`/salon/${salon.id}/reserver`}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition"
              >
                Prendre rendez-vous
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

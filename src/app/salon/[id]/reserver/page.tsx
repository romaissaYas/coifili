'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicHeader from '@/components/public/PublicHeader';
import BookingFlow from '@/components/booking/BookingFlow';
import { useSalonDetail } from '@/hooks/useSalonDetail';
import type { ClientForm } from '@/hooks/useBooking';

export default function ReserverPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { salon, prestations, employes, loading, error } = useSalonDetail(id);

  // Pré-remplissage si un client est connecté : ses coordonnées sont reprises
  // et la réservation sera rattachée à son compte.
  const [prefill, setPrefill] = useState<Partial<ClientForm> | undefined>(undefined);
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      const u = JSON.parse(stored);
      if (u.userType === 'user') {
        setPrefill({ prenom: u.firstName || '', nom: u.lastName || '', email: u.email || '' });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-rose-50">
      <PublicHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        )}

        {!loading && (error || !salon) && (
          <div className="text-center py-20">
            <p className="text-gray-700 text-lg">{error || 'Salon introuvable.'}</p>
            <Link href="/salons" className="mt-4 inline-block text-rose-600 underline">
              Revenir à la recherche
            </Link>
          </div>
        )}

        {!loading && salon && (
          <>
            <div className="mb-6">
              <Link href={`/salon/${salon.id}`} className="text-sm text-gray-500 hover:underline">
                ← {salon.nom}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Prendre rendez-vous</h1>
            </div>
            <BookingFlow salonId={salon.id} prestations={prestations} employes={employes} prefill={prefill} />
          </>
        )}
      </main>
    </div>
  );
}

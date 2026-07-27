'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import { useMesReservations } from '@/hooks/useMesReservations';
import ReservationCard from '@/components/client/ReservationCard';
import ReprogrammerModal from '@/components/client/ReprogrammerModal';
import type { MesReservation } from '@/types/reservation';

type Onglet = 'a_venir' | 'passes' | 'annules';

function estFutur(r: MesReservation): boolean {
  return new Date(`${r.date}T${r.heure_debut}`).getTime() > Date.now();
}

export default function MesReservationsPage() {
  const { reservations, loading, error, refresh } = useMesReservations();
  const [onglet, setOnglet] = useState<Onglet>('a_venir');
  const [aReprogrammer, setAReprogrammer] = useState<MesReservation | null>(null);

  const groupes = useMemo(() => {
    const a_venir: MesReservation[] = [];
    const passes: MesReservation[] = [];
    const annules: MesReservation[] = [];
    for (const r of reservations) {
      if (r.statut === 'annule') annules.push(r);
      else if (estFutur(r)) a_venir.push(r);
      else passes.push(r);
    }
    // À venir : du plus proche au plus lointain.
    a_venir.reverse();
    return { a_venir, passes, annules };
  }, [reservations]);

  const annuler = async (r: MesReservation) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Annuler ce rendez-vous ?',
      text: 'Cette action est irréversible.',
      showCancelButton: true,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Retour',
      confirmButtonColor: '#dc2626',
    });
    if (!confirmation.isConfirmed) return;
    try {
      await axios.patch(`${API_URL}/api/rendezvous/mine/${r.id}/annuler`, {}, { headers: getAuthHeaders() });
      Swal.fire({ icon: 'success', title: 'Rendez-vous annulé', timer: 1500, showConfirmButton: false });
      refresh();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      Swal.fire({ icon: 'error', title: 'Erreur', text: message || "L'annulation a échoué." });
    }
  };

  const onglets: { key: Onglet; label: string; liste: MesReservation[] }[] = [
    { key: 'a_venir', label: 'À venir', liste: groupes.a_venir },
    { key: 'passes', label: 'Passés', liste: groupes.passes },
    { key: 'annules', label: 'Annulés', liste: groupes.annules },
  ];
  const courant = onglets.find((o) => o.key === onglet)!;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes rendez-vous</h1>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {onglets.map((o) => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
              onglet === o.key ? 'border-rose-600 text-rose-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {o.label} ({o.liste.length})
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Chargement de vos réservations...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        courant.liste.length === 0 ? (
          <p className="text-gray-500 italic">Aucun rendez-vous dans cette catégorie.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courant.liste.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                modifiable={onglet === 'a_venir'}
                onReprogrammer={setAReprogrammer}
                onAnnuler={annuler}
              />
            ))}
          </div>
        )
      )}

      {aReprogrammer && (
        <ReprogrammerModal
          reservation={aReprogrammer}
          onClose={() => setAReprogrammer(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}

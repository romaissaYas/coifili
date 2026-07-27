'use client';

import Link from 'next/link';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { MesReservation } from '@/types/reservation';

type Props = {
  reservation: MesReservation;
  /** Actions (annuler/reprogrammer) uniquement pour les RDV à venir et actifs. */
  modifiable: boolean;
  onReprogrammer: (r: MesReservation) => void;
  onAnnuler: (r: MesReservation) => void;
};

export default function ReservationCard({ reservation, modifiable, onReprogrammer, onAnnuler }: Props) {
  const dateLisible = new Date(`${reservation.date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/salon/${reservation.salon_id}`} className="text-lg font-semibold text-gray-900 hover:text-rose-600">
            {reservation.salon_nom}
          </Link>
          <p className="text-sm text-gray-500">{reservation.salon_ville}, {reservation.salon_wilaya}</p>
        </div>
        <StatusBadge statut={reservation.statut} />
      </div>

      <div className="mt-3 text-sm text-gray-700 space-y-1">
        <p>{reservation.prestation_nom} — {Number(reservation.prix)} DA ({reservation.duree} min)</p>
        <p>{dateLisible} à {reservation.heure_debut.slice(0, 5)}</p>
        <p>Professionnel : {reservation.employe_nom || 'Sans préférence'}</p>
        {reservation.reference && (
          <p className="text-gray-500">Réf. <span className="font-mono">{reservation.reference}</span></p>
        )}
      </div>

      {modifiable && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onReprogrammer(reservation)}
            className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-lg text-sm font-medium"
          >
            Reprogrammer
          </button>
          <button
            onClick={() => onAnnuler(reservation)}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

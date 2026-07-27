import Link from 'next/link';
import type { ConfirmationReservation } from '@/types/booking';

/** Écran de confirmation : numéro de réservation + récapitulatif. */
export default function BookingConfirmation({
  confirmation,
  salonId,
}: {
  confirmation: ConfirmationReservation;
  salonId: number;
}) {
  const { reference, prestation, employe, date, heure, client } = confirmation;
  const dateLisible = new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">Réservation confirmée !</h2>
      <p className="text-gray-600 mt-2">
        Votre numéro de réservation :{' '}
        <span className="font-mono font-bold text-rose-600">{reference}</span>
      </p>

      <div className="mt-6 text-left bg-rose-50 rounded-xl p-5 space-y-2 text-sm">
        <p><span className="font-medium text-gray-500">Prestation :</span> {prestation.nom} — {Number(prestation.prix)} DA ({prestation.duree} min)</p>
        <p><span className="font-medium text-gray-500">Professionnel :</span> {employe ? employe.nom : 'Sans préférence'}</p>
        <p><span className="font-medium text-gray-500">Date :</span> {dateLisible}</p>
        <p><span className="font-medium text-gray-500">Heure :</span> {heure}</p>
        <p><span className="font-medium text-gray-500">Client :</span> {client.prenom} {client.nom}</p>
        <p><span className="font-medium text-gray-500">Contact :</span> {client.telephone} · {client.email}</p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/salon/${salonId}`}
          className="border border-gray-300 px-6 py-2 rounded-full hover:bg-gray-50 transition"
        >
          Retour au salon
        </Link>
        <Link
          href="/salons"
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-full transition"
        >
          Chercher un autre salon
        </Link>
      </div>
    </div>
  );
}

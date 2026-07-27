'use client';

import { useBooking, type BookingStep, type ClientForm } from '@/hooks/useBooking';
import BookingConfirmation from './BookingConfirmation';
import type { EmployePublic, PrestationPublic } from '@/types/booking';

type Props = {
  salonId: number;
  prestations: PrestationPublic[];
  employes: EmployePublic[];
  prefill?: Partial<ClientForm>;
};

const ETAPES: { key: BookingStep; label: string }[] = [
  { key: 'prestation', label: 'Prestation' },
  { key: 'employe', label: 'Professionnel' },
  { key: 'creneau', label: 'Date & heure' },
  { key: 'coordonnees', label: 'Coordonnées' },
];

const aujourdhui = new Date().toISOString().slice(0, 10);

export default function BookingFlow({ salonId, prestations, employes, prefill }: Props) {
  const b = useBooking(salonId, prestations, employes, prefill);

  if (b.confirmation) {
    return <BookingConfirmation confirmation={b.confirmation} salonId={salonId} />;
  }

  const etapesVisibles = ETAPES.filter((e) => e.key !== 'employe' || employes.length > 0);
  const currentIndex = etapesVisibles.findIndex((e) => e.key === b.step);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Fil d'étapes */}
      <div className="flex items-center justify-between mb-6">
        {etapesVisibles.map((e, i) => (
          <div key={e.key} className="flex-1 flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentIndex ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className={`ml-2 text-xs hidden sm:inline ${i <= currentIndex ? 'text-gray-800' : 'text-gray-400'}`}>
              {e.label}
            </span>
            {i < etapesVisibles.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {b.error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{b.error}</div>
      )}

      {/* Étape 1 : Prestation */}
      {b.step === 'prestation' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Choisissez une prestation</h2>
          {prestations.length === 0 ? (
            <p className="text-gray-500 italic">Ce salon n&apos;a pas encore de prestation réservable.</p>
          ) : (
            <div className="space-y-2">
              {prestations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => b.choisirPrestation(p.id)}
                  className="w-full flex justify-between items-center border border-gray-200 rounded-xl px-4 py-3 hover:border-rose-400 hover:bg-rose-50 transition text-left"
                >
                  <span>
                    <span className="font-medium text-gray-800">{p.nom}</span>
                    {p.duree != null && <span className="text-sm text-gray-500 ml-2">{p.duree} min</span>}
                  </span>
                  <span className="font-semibold text-rose-600">{Number(p.prix)} DA</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Étape 2 : Employé (optionnel) */}
      {b.step === 'employe' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Avec quel professionnel ?</h2>
          <div className="space-y-2">
            <button
              onClick={() => { b.choisirEmploye(null); b.setStep('creneau'); }}
              className={`w-full text-left border rounded-xl px-4 py-3 transition ${
                b.employeId === null ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800">Sans préférence</span>
            </button>
            {employes.map((e) => (
              <button
                key={e.id}
                onClick={() => { b.choisirEmploye(e.id); b.setStep('creneau'); }}
                className={`w-full text-left border rounded-xl px-4 py-3 transition ${
                  b.employeId === e.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-800">{e.nom}</span>
                <span className="text-sm text-gray-500 ml-2">{e.poste}</span>
              </button>
            ))}
          </div>
          <button onClick={() => b.setStep('prestation')} className="mt-4 text-sm text-gray-500 hover:underline">
            ← Retour
          </button>
        </div>
      )}

      {/* Étape 3 : Date & créneau */}
      {b.step === 'creneau' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Choisissez une date et un créneau</h2>
          <input
            type="date"
            min={aujourdhui}
            value={b.date}
            onChange={(e) => b.chargerCreneaux(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
          />

          {b.loadingCreneaux && <p className="text-gray-500 text-sm">Chargement des créneaux...</p>}

          {!b.loadingCreneaux && b.date && b.creneaux.length === 0 && (
            <p className="text-gray-500 italic text-sm">Aucun créneau disponible ce jour-là. Essayez une autre date.</p>
          )}

          {b.creneaux.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {b.creneaux.map((c) => (
                <button
                  key={c}
                  onClick={() => { b.setHeure(c); b.setStep('coordonnees'); }}
                  className={`py-2 rounded-lg text-sm font-medium border transition ${
                    b.heure === c ? 'border-rose-500 bg-rose-500 text-white' : 'border-gray-200 hover:border-rose-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => b.setStep(employes.length > 0 ? 'employe' : 'prestation')}
            className="mt-4 text-sm text-gray-500 hover:underline"
          >
            ← Retour
          </button>
        </div>
      )}

      {/* Étape 4 : Coordonnées */}
      {b.step === 'coordonnees' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Vos coordonnées</h2>
          <div className="text-sm text-gray-600 bg-rose-50 rounded-lg px-4 py-2 mb-4">
            {b.prestation?.nom} · {new Date(`${b.date}T00:00:00`).toLocaleDateString('fr-FR')} à {b.heure}
            {b.employe ? ` · ${b.employe.nom}` : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Prénom *"
              value={b.client.prenom}
              onChange={(e) => b.setClient({ ...b.client, prenom: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              placeholder="Nom *"
              value={b.client.nom}
              onChange={(e) => b.setClient({ ...b.client, nom: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              placeholder="Téléphone *"
              value={b.client.telephone}
              onChange={(e) => b.setClient({ ...b.client, telephone: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              placeholder="Email *"
              type="email"
              value={b.client.email}
              onChange={(e) => b.setClient({ ...b.client, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Commentaire (facultatif)"
            value={b.client.commentaire}
            onChange={(e) => b.setClient({ ...b.client, commentaire: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full mt-3"
          />

          <div className="flex items-center justify-between mt-4">
            <button onClick={() => b.setStep('creneau')} className="text-sm text-gray-500 hover:underline">
              ← Retour
            </button>
            <button
              onClick={b.confirmer}
              disabled={b.submitting}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-full transition"
            >
              {b.submitting ? 'Réservation...' : 'Confirmer la réservation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

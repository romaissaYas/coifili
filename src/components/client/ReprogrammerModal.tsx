'use client';

import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { MesReservation } from '@/types/reservation';

const aujourdhui = new Date().toISOString().slice(0, 10);

type Props = {
  reservation: MesReservation;
  onClose: () => void;
  onDone: () => void;
};

export default function ReprogrammerModal({ reservation, onClose, onDone }: Props) {
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chargerCreneaux = async (nouvelleDate: string) => {
    setDate(nouvelleDate);
    setHeure('');
    setError(null);
    if (!nouvelleDate) {
      setCreneaux([]);
      return;
    }
    setLoadingCreneaux(true);
    try {
      const params = new URLSearchParams({
        salon_id: String(reservation.salon_id),
        prestation_id: String(reservation.prestation_id),
        date: nouvelleDate,
      });
      if (reservation.employe_id) params.set('employe_id', String(reservation.employe_id));
      const res = await fetch(`${API_URL}/api/rendezvous/creneaux-disponibles?${params.toString()}`);
      const data = await res.json();
      setCreneaux(Array.isArray(data.creneaux) ? data.creneaux : []);
    } catch {
      setError('Impossible de charger les créneaux.');
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  };

  const confirmer = async () => {
    if (!date || !heure) {
      setError('Veuillez choisir une date et un créneau.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await axios.put(
        `${API_URL}/api/rendezvous/mine/${reservation.id}`,
        { date, heure_debut: heure, employe_id: reservation.employe_id ?? undefined },
        { headers: getAuthHeaders() }
      );
      Swal.fire({ icon: 'success', title: 'Rendez-vous reprogrammé', timer: 1500, showConfirmButton: false });
      onDone();
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'La reprogrammation a échoué.');
      if (axios.isAxiosError(err) && err.response?.status === 409) await chargerCreneaux(date);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 text-2xl" aria-label="Fermer">
          &times;
        </button>
        <h3 className="text-xl font-bold text-rose-700 mb-1">Reprogrammer</h3>
        <p className="text-sm text-gray-600 mb-4">
          {reservation.prestation_nom} · {reservation.salon_nom}
          {reservation.employe_nom ? ` · ${reservation.employe_nom}` : ''}
        </p>

        {error && <div className="mb-3 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}

        <label className="block text-xs font-medium text-gray-500 mb-1">Nouvelle date</label>
        <input
          type="date"
          min={aujourdhui}
          value={date}
          onChange={(e) => chargerCreneaux(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
        />

        {loadingCreneaux && <p className="text-gray-500 text-sm">Chargement des créneaux...</p>}
        {!loadingCreneaux && date && creneaux.length === 0 && (
          <p className="text-gray-500 italic text-sm">Aucun créneau disponible ce jour-là.</p>
        )}

        {creneaux.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {creneaux.map((c) => (
              <button
                key={c}
                onClick={() => setHeure(c)}
                className={`py-2 rounded-lg text-sm font-medium border transition ${
                  heure === c ? 'border-rose-500 bg-rose-500 text-white' : 'border-gray-200 hover:border-rose-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={confirmer}
            disabled={submitting || !heure}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold"
          >
            {submitting ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

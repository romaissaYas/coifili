'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { ReservationSalon } from '@/types/reservationSalon';

export type ReservationFiltres = {
  statut?: string;
  periode?: string;
  employe_id?: string;
  prestation_id?: string;
  q?: string;
};

type Employe = { id: number; nom: string };

function qs(f: ReservationFiltres): string {
  const entries = Object.entries(f).filter(([, v]) => v);
  return entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&') : '';
}

/** Réservations du salon connecté : liste filtrable + actions de gestion. */
export function useReservationsSalon() {
  const [reservations, setReservations] = useState<ReservationSalon[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState<ReservationFiltres>({});

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<ReservationSalon[]>(`${API_URL}/api/reservations${qs(filtres)}`, { headers: getAuthHeaders() });
      setReservations(res.data);
    } catch (e) {
      console.error('Erreur chargement réservations :', e);
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    axios
      .get<Employe[]>(`${API_URL}/api/employes`, { headers: getAuthHeaders() })
      .then((r) => setEmployes(r.data))
      .catch(() => setEmployes([]));
  }, []);

  const setFiltre = (k: keyof ReservationFiltres, v: string) => setFiltres((f) => ({ ...f, [k]: v }));

  const notif = (title: string) => Swal.fire({ icon: 'success', title, timer: 1500, showConfirmButton: false });
  const erreur = (e: unknown) =>
    Swal.fire({ icon: 'error', title: 'Erreur', text: (axios.isAxiosError(e) && e.response?.data?.error) || 'Une erreur est survenue.' });
  const patch = async (path: string, body: unknown, msg: string) => {
    try {
      await axios.patch(`${API_URL}/api/reservations/${path}`, body ?? {}, { headers: getAuthHeaders() });
      await charger();
      notif(msg);
      return true;
    } catch (e) {
      erreur(e);
      return false;
    }
  };

  const confirmer = (id: number) => patch(`${id}/confirm`, {}, 'Réservation confirmée — email envoyé au client');
  const terminer = (id: number) => patch(`${id}/complete`, {}, 'Rendez-vous terminé');
  const absent = (id: number) => patch(`${id}/no-show`, {}, 'Client marqué absent');

  /** Marque une réservation comme consultée (retire le surlignage vert). Mise à
   *  jour optimiste immédiate, sans notification ni ré-tri ; resync si échec. */
  const marquerVue = async (id: number) => {
    setReservations((liste) => liste.map((r) => (r.id === id ? { ...r, vue_coiffeur: 1 } : r)));
    try {
      await axios.patch(`${API_URL}/api/reservations/${id}/seen`, {}, { headers: getAuthHeaders() });
    } catch {
      await charger(); // erreur de synchronisation : on recharge l'état réel
    }
  };

  const annuler = async (id: number) => {
    const { value, isConfirmed } = await Swal.fire({
      title: 'Annuler cette réservation ?',
      input: 'text',
      inputLabel: 'Motif (optionnel)',
      inputPlaceholder: 'Ex. indisponibilité…',
      showCancelButton: true,
      confirmButtonText: 'Annuler la réservation',
      cancelButtonText: 'Retour',
      confirmButtonColor: '#e11d67',
    });
    if (isConfirmed) patch(`${id}/cancel`, { motif: value || undefined }, 'Réservation annulée — email envoyé au client');
  };

  const supprimer = async (id: number) => {
    const r = await Swal.fire({ title: 'Supprimer définitivement ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#e11d67' });
    if (!r.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/api/reservations/${id}`, { headers: getAuthHeaders() });
      await charger();
      notif('Réservation supprimée');
    } catch (e) {
      erreur(e);
    }
  };

  const enregistrerNotes = (id: number, notes: string) => patch(`${id}/notes`, { notes }, 'Notes enregistrées');

  const modifier = async (r: ReservationSalon) => {
    const optionsEmployes = `<option value="">Sans employé</option>` +
      employes.map((e) => `<option value="${e.id}" ${e.id === r.employe_id ? 'selected' : ''}>${e.nom}</option>`).join('');
    const { value, isConfirmed } = await Swal.fire({
      title: 'Modifier la réservation',
      html: `
        <label class="swal2-label" style="display:block;text-align:left;font-size:13px">Date</label>
        <input id="r-date" type="date" class="swal2-input" value="${r.date}">
        <label class="swal2-label" style="display:block;text-align:left;font-size:13px">Heure</label>
        <input id="r-heure" type="time" class="swal2-input" value="${(r.heure_debut ?? '').slice(0, 5)}">
        <select id="r-emp" class="swal2-input">${optionsEmployes}</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e11d67',
      preConfirm: () => {
        const date = (document.getElementById('r-date') as HTMLInputElement).value;
        const heure = (document.getElementById('r-heure') as HTMLInputElement).value;
        const emp = (document.getElementById('r-emp') as HTMLSelectElement).value;
        if (!date || !heure) {
          Swal.showValidationMessage('Date et heure requises.');
          return false;
        }
        return { date, heure_debut: heure, employe_id: emp ? Number(emp) : undefined };
      },
    });
    if (isConfirmed && value) patch(`${r.id}/update`, value, 'Réservation modifiée — email envoyé au client');
  };

  return { reservations, employes, loading, filtres, setFiltre, setFiltres, charger, confirmer, annuler, terminer, absent, supprimer, enregistrerNotes, modifier, marquerVue };
}

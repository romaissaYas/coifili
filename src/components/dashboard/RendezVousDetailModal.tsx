'use client';

import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { X, Mail, Phone, Scissors } from 'lucide-react';
import StatusBadge, { Statut } from './StatusBadge';
import { INPUT, BTN_PRIMARY } from './ui';
import { getAuthHeaders } from '@/lib/authHeaders';
import { API_URL } from '@/lib/apiConfig';
import type { RendezVous, Employe } from '@/types/rendezvous';

type Props = {
  rendezvous: RendezVous;
  employes: Employe[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function RendezVousDetailModal({ rendezvous, employes, onClose, onUpdated }: Props) {
  const [date, setDate] = useState(rendezvous.date);
  const [heure, setHeure] = useState(rendezvous.heure_debut.slice(0, 5));
  const [employeId, setEmployeId] = useState(rendezvous.employe_id ? String(rendezvous.employe_id) : '');
  const [saving, setSaving] = useState(false);
  const dejaAnnule = rendezvous.statut === 'annule';

  const afficherErreur = (error: unknown, fallback: string) => {
    const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
    Swal.fire({ icon: 'error', title: 'Erreur', text: message || fallback });
  };

  const changerStatut = async (statut: Statut, question: string) => {
    const confirmation = await Swal.fire({
      icon: 'question',
      title: question,
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e11d48',
    });
    if (!confirmation.isConfirmed) return;

    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/api/rendezvous/${rendezvous.id}/statut`,
        { statut },
        { headers: getAuthHeaders() }
      );
      Swal.fire({ icon: 'success', title: 'Mis à jour', timer: 1500, showConfirmButton: false });
      onUpdated();
      onClose();
    } catch (error) {
      afficherErreur(error, 'Impossible de mettre à jour le statut.');
    } finally {
      setSaving(false);
    }
  };

  const annulerRendezVous = async () => {
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

    setSaving(true);
    try {
      await axios.delete(`${API_URL}/api/rendezvous/${rendezvous.id}`, { headers: getAuthHeaders() });
      Swal.fire({ icon: 'success', title: 'Rendez-vous annulé', timer: 1500, showConfirmButton: false });
      onUpdated();
      onClose();
    } catch (error) {
      afficherErreur(error, "Impossible d'annuler ce rendez-vous.");
    } finally {
      setSaving(false);
    }
  };

  const enregistrerModification = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/api/rendezvous/${rendezvous.id}`,
        {
          client_nom: rendezvous.client_nom,
          client_prenom: rendezvous.client_prenom,
          client_email: rendezvous.client_email,
          client_telephone: rendezvous.client_telephone,
          date,
          heure_debut: heure,
          employe_id: employeId ? Number(employeId) : null,
        },
        { headers: getAuthHeaders() }
      );
      Swal.fire({ icon: 'success', title: 'Rendez-vous modifié', timer: 1500, showConfirmButton: false });
      onUpdated();
      onClose();
    } catch (error) {
      afficherErreur(error, 'Impossible de modifier ce rendez-vous (créneau indisponible ?).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <h3 className="pr-10 text-xl font-bold text-slate-900">
          {rendezvous.client_prenom} {rendezvous.client_nom}
        </h3>
        <div className="mt-2">
          <StatusBadge statut={rendezvous.statut} />
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-medium text-slate-800">
            <Scissors size={15} className="text-rose-500" />
            {rendezvous.prestation_nom} — {rendezvous.prix} DA ({rendezvous.duree} min)
          </p>
          {rendezvous.client_email && (
            <p className="flex items-center gap-2">
              <Mail size={15} className="text-slate-400" /> {rendezvous.client_email}
            </p>
          )}
          {rendezvous.client_telephone && (
            <p className="flex items-center gap-2">
              <Phone size={15} className="text-slate-400" /> {rendezvous.client_telephone}
            </p>
          )}
          {rendezvous.commentaire && <p className="italic text-slate-500">&quot;{rendezvous.commentaire}&quot;</p>}
        </div>

        {!dejaAnnule && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Heure</label>
                <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={INPUT} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Employé</label>
                <select value={employeId} onChange={(e) => setEmployeId(e.target.value)} className={INPUT}>
                  <option value="">Aucun employé assigné</option>
                  {employes.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={enregistrerModification}
              disabled={saving}
              className={`${BTN_PRIMARY} mt-4 w-full py-2.5`}
            >
              Enregistrer les modifications
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => changerStatut('confirme', 'Confirmer ce rendez-vous ?')}
                disabled={saving || rendezvous.statut === 'confirme'}
                className="flex-1 rounded-lg bg-blue-50 py-2 font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-100 disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => changerStatut('termine', 'Marquer ce rendez-vous comme terminé ?')}
                disabled={saving || rendezvous.statut === 'termine'}
                className="flex-1 rounded-lg bg-emerald-50 py-2 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                Terminer
              </button>
              <button
                onClick={annulerRendezVous}
                disabled={saving}
                className="flex-1 rounded-lg bg-red-50 py-2 font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-100 disabled:opacity-50"
              >
                Annuler le RDV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { API_URL } from '@/lib/apiConfig';
import type { EmployePublic, PrestationPublic, ConfirmationReservation } from '@/types/booking';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\s-]{6,20}$/;

export type BookingStep = 'prestation' | 'employe' | 'creneau' | 'coordonnees';

export type ClientForm = {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  commentaire: string;
};

const CLIENT_VIDE: ClientForm = { prenom: '', nom: '', telephone: '', email: '', commentaire: '' };

/**
 * Orchestration du parcours de réservation client : sélection prestation →
 * employé (optionnel) → date/créneau → coordonnées → confirmation. Les
 * créneaux affichés proviennent du backend (uniquement les créneaux
 * réellement disponibles).
 */
export function useBooking(
  salonId: number,
  prestations: PrestationPublic[],
  employes: EmployePublic[],
  prefill?: Partial<ClientForm>
) {
  const [step, setStep] = useState<BookingStep>('prestation');

  const [prestationId, setPrestationId] = useState<number | null>(null);
  const [employeId, setEmployeId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');

  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);

  // Pré-remplissage si un client est connecté (voir page reserver).
  const [client, setClient] = useState<ClientForm>({ ...CLIENT_VIDE, ...prefill });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationReservation | null>(null);

  const prestation = prestations.find((p) => p.id === prestationId) ?? null;
  const employe = employes.find((e) => e.id === employeId) ?? null;

  const choisirPrestation = (id: number) => {
    setPrestationId(id);
    setHeure('');
    setCreneaux([]);
    setStep(employes.length > 0 ? 'employe' : 'creneau');
  };

  const choisirEmploye = (id: number | null) => {
    setEmployeId(id);
    setHeure('');
    setCreneaux([]);
  };

  const chargerCreneaux = async (nouvelleDate: string) => {
    setDate(nouvelleDate);
    setHeure('');
    setError(null);
    if (!nouvelleDate || !prestationId) {
      setCreneaux([]);
      return;
    }
    setLoadingCreneaux(true);
    try {
      const params = new URLSearchParams({
        salon_id: String(salonId),
        prestation_id: String(prestationId),
        date: nouvelleDate,
      });
      if (employeId) params.set('employe_id', String(employeId));
      const res = await fetch(`${API_URL}/api/rendezvous/creneaux-disponibles?${params.toString()}`);
      const data = await res.json();
      setCreneaux(Array.isArray(data.creneaux) ? data.creneaux : []);
    } catch {
      setError('Impossible de charger les créneaux disponibles.');
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  };

  const validerCoordonnees = (): string | null => {
    if (!client.prenom.trim() || !client.nom.trim()) return 'Veuillez renseigner votre prénom et votre nom.';
    if (!PHONE_PATTERN.test(client.telephone.trim())) return 'Veuillez saisir un numéro de téléphone valide.';
    if (!EMAIL_PATTERN.test(client.email.trim())) return 'Veuillez saisir une adresse email valide.';
    return null;
  };

  const confirmer = async () => {
    setError(null);
    const validationError = validerCoordonnees();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!prestation || !date || !heure) {
      setError('Veuillez compléter toutes les étapes.');
      return;
    }

    setSubmitting(true);
    try {
      // Si un client est connecté, on joint son token : la réservation est
      // alors rattachée à son compte (user_id) et apparaîtra dans son
      // historique. Sinon, réservation invité (comportement inchangé).
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/rendezvous`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          salon_id: salonId,
          prestation_id: prestation.id,
          employe_id: employeId ?? undefined,
          client_nom: client.nom.trim(),
          client_prenom: client.prenom.trim(),
          client_email: client.email.trim(),
          client_telephone: client.telephone.trim(),
          date,
          heure_debut: heure,
          commentaire: client.commentaire.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'La réservation a échoué. Veuillez réessayer.');
        // Un 409 signifie que le créneau vient d'être pris : on recharge.
        if (res.status === 409) await chargerCreneaux(date);
        return;
      }
      setConfirmation({
        reference: data.reference,
        prestation,
        employe,
        date,
        heure,
        client: { prenom: client.prenom.trim(), nom: client.nom.trim(), telephone: client.telephone.trim(), email: client.email.trim() },
      });
    } catch {
      setError('Erreur serveur. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step, setStep,
    prestationId, prestation, choisirPrestation,
    employeId, employe, choisirEmploye,
    date, heure, setHeure, chargerCreneaux,
    creneaux, loadingCreneaux,
    client, setClient,
    submitting, error, confirmation, confirmer,
  };
}

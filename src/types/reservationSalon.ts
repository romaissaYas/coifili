export type ReservationStatut = 'en_attente' | 'confirme' | 'termine' | 'annule';

export type ReservationSalon = {
  id: number;
  reference: string | null;
  client_nom: string;
  client_prenom: string | null;
  client_email: string | null;
  client_telephone: string | null;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  duree: number | null;
  prix: number | string | null;
  statut: ReservationStatut;
  no_show: number; // 0 | 1
  vue_coiffeur: number; // 0 = non consultée (fond vert), 1 = consultée
  created_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  prestation_id: number;
  employe_id: number | null;
  prestation_nom: string | null;
  employe_nom: string | null;
};

/** Statut « effectif » pour l'affichage : « Absent » prime sur le statut. */
export type StatutEffectif = ReservationStatut | 'no_show';
export function statutEffectif(r: ReservationSalon): StatutEffectif {
  return r.no_show ? 'no_show' : r.statut;
}

export const STATUT_META: Record<StatutEffectif, { label: string; classe: string; couleur: string }> = {
  en_attente: { label: 'En attente', classe: 'bg-amber-100 text-amber-700', couleur: '#f59e0b' },
  confirme: { label: 'Confirmée', classe: 'bg-blue-100 text-blue-700', couleur: '#3b82f6' },
  termine: { label: 'Terminée', classe: 'bg-green-100 text-green-700', couleur: '#16a34a' },
  annule: { label: 'Annulée', classe: 'bg-gray-200 text-gray-600', couleur: '#9ca3af' },
  no_show: { label: 'Absent', classe: 'bg-red-100 text-red-700', couleur: '#dc2626' },
};

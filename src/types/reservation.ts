import type { Statut } from '@/components/dashboard/StatusBadge';

/** Réservation telle que renvoyée par GET /api/rendezvous/mine (espace client). */
export type MesReservation = {
  id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  duree: number;
  prix: string | number;
  statut: Statut;
  reference: string | null;
  commentaire: string | null;
  salon_id: number;
  salon_nom: string;
  salon_ville: string;
  salon_wilaya: string;
  employe_id: number | null;
  employe_nom: string | null;
  prestation_id: number;
  prestation_nom: string;
};

export type Profil = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: string;
};

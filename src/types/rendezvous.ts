import type { Statut } from '@/components/dashboard/StatusBadge';

export type RendezVous = {
  id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  duree: number;
  prix: number;
  statut: Statut;
  commentaire: string | null;
  client_nom: string;
  client_prenom: string;
  client_email: string;
  client_telephone: string;
  employe_id: number | null;
  employe_nom: string | null;
  prestation_id: number;
  prestation_nom: string;
};

export type Employe = {
  id: number;
  nom: string;
  poste: string;
};

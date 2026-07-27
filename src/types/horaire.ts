export type Creneau = { debut: string; fin: string };

export type HoraireJour = {
  jour: string;
  ouvert: boolean;
  creneaux: Creneau[];
};

export const JOURS_SEMAINE = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche',
] as const;

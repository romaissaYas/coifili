import type { Employe } from './rendezvous';

export type EmployeStats = Employe & {
  rdv_count: number;
  revenue: number;
  prochaine_disponibilite: { date: string; heure: string } | null;
};

export type Stats = {
  rdvAujourdhui: number;
  rdvSemaine: number;
  rdvMois: number;
  chiffreAffairesJour: number;
  chiffreAffairesMois: number;
  nouveauxClientsMois: number;
  prestationsPopulaires: { nom: string; total: number }[];
};

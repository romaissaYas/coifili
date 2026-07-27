/** Types du parcours de réservation client (données publiques uniquement). */

export type HoraireJourPublic = {
  jour: string;
  ouvert: number; // 0 | 1 (TINYINT MySQL)
  creneaux: { debut: string; fin: string }[];
};

export type EmployePublic = {
  id: number;
  nom: string;
  poste: string;
};

export type PrestationPublic = {
  id: number;
  nom: string;
  prix: string | number; // DECIMAL renvoyé en chaîne par mysql2
  duree: number;
};

export type ConfirmationReservation = {
  reference: string;
  prestation: PrestationPublic;
  employe: EmployePublic | null;
  date: string;
  heure: string;
  client: { prenom: string; nom: string; telephone: string; email: string };
};

import { useMemo, useState } from 'react';
import type { RendezVous } from '@/types/rendezvous';

export type VueAgenda = 'jour' | 'semaine' | 'mois';

/** Filtres de l'agenda (période, employé, statut, recherche client). */
export function useAgendaFiltre(rendezvous: RendezVous[]) {
  const [vueAgenda, setVueAgenda] = useState<VueAgenda>('jour');
  const [filtreEmployeId, setFiltreEmployeId] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [rechercheClient, setRechercheClient] = useState('');

  const agendaFiltre = useMemo(() => {
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    const jourSemaineIndex = (aujourdhui.getDay() + 6) % 7; // 0 = lundi
    debutSemaine.setDate(aujourdhui.getDate() - jourSemaineIndex);
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    const todayStr = formatDate(aujourdhui);
    const debutSemaineStr = formatDate(debutSemaine);
    const finSemaineStr = formatDate(finSemaine);
    const moisCourant = aujourdhui.getMonth();
    const anneeCourante = aujourdhui.getFullYear();

    return rendezvous
      .filter((rdv) => {
        if (vueAgenda === 'jour') return rdv.date === todayStr;
        if (vueAgenda === 'semaine') return rdv.date >= debutSemaineStr && rdv.date <= finSemaineStr;
        const rdvDate = new Date(`${rdv.date}T00:00:00`);
        return rdvDate.getMonth() === moisCourant && rdvDate.getFullYear() === anneeCourante;
      })
      .filter((rdv) => !filtreEmployeId || String(rdv.employe_id) === filtreEmployeId)
      .filter((rdv) => !filtreStatut || rdv.statut === filtreStatut)
      .filter((rdv) => {
        if (!rechercheClient.trim()) return true;
        const recherche = rechercheClient.trim().toLowerCase();
        return `${rdv.client_prenom} ${rdv.client_nom}`.toLowerCase().includes(recherche);
      });
  }, [rendezvous, vueAgenda, filtreEmployeId, filtreStatut, rechercheClient]);

  return {
    vueAgenda,
    setVueAgenda,
    filtreEmployeId,
    setFiltreEmployeId,
    filtreStatut,
    setFiltreStatut,
    rechercheClient,
    setRechercheClient,
    agendaFiltre,
  };
}

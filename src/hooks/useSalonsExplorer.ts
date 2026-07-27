import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/apiConfig';
import type { SalonResult } from '@/types/salon';

export type SalonFiltres = {
  type: string;
  categorie: string;
  wilaya: string;
  ville: string;
};

const FILTRES_VIDES: SalonFiltres = { type: '', categorie: '', wilaya: '', ville: '' };

const uniqueTri = (valeurs: (string | undefined | null)[]): string[] =>
  [...new Set(valeurs.filter((v): v is string => Boolean(v && v.trim())))].sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );

/**
 * Charge les salons au montage puis les filtre côté client, sans aucun
 * rechargement réseau. Chaque changement de filtre (type, catégorie, wilaya,
 * ville) met à jour instantanément la liste — plus de bouton « Rechercher ».
 *
 * @param categorieFixe  Si fourni (pages catégorie : coiffeur, barbier...), on
 *   ne charge que cette catégorie via l'API ; le filtre « catégorie » n'est
 *   alors plus proposé. Sinon (accueil), on charge TOUS les salons.
 *
 * Les listes d'options sont dérivées des données réelles ; les villes proposées
 * dépendent de la wilaya sélectionnée.
 */
export function useSalonsExplorer(categorieFixe?: string) {
  const [salons, setSalons] = useState<SalonResult[]>([]);
  const [filtres, setFiltres] = useState<SalonFiltres>(FILTRES_VIDES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = categorieFixe
        ? `${API_URL}/api/salons?categorie=${encodeURIComponent(categorieFixe)}`
        : `${API_URL}/api/salons`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      const data = await res.json();
      setSalons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement salons :', err);
      setError(
        'Impossible de charger les salons pour le moment. Vérifiez votre connexion et réessayez.'
      );
      setSalons([]);
    } finally {
      setLoading(false);
    }
  }, [categorieFixe]);

  useEffect(() => {
    charger();
  }, [charger]);

  /** Change un filtre ; réinitialise la ville quand la wilaya change. */
  const setFiltre = useCallback(<K extends keyof SalonFiltres>(cle: K, valeur: string) => {
    setFiltres((prev) => {
      const suivant = { ...prev, [cle]: valeur };
      if (cle === 'wilaya') suivant.ville = '';
      return suivant;
    });
  }, []);

  const reset = useCallback(() => setFiltres(FILTRES_VIDES), []);

  /** Options des listes déroulantes, dérivées des salons chargés. */
  const options = useMemo(
    () => ({
      types: uniqueTri(salons.map((s) => s.type)),
      categories: uniqueTri(salons.map((s) => s.categorie)),
      wilayas: uniqueTri(salons.map((s) => s.wilaya)),
      villes: uniqueTri(
        salons
          .filter((s) => !filtres.wilaya || s.wilaya === filtres.wilaya)
          .map((s) => s.ville)
      ),
    }),
    [salons, filtres.wilaya]
  );

  const filtered = useMemo(
    () =>
      salons.filter(
        (s) =>
          (!filtres.type || s.type === filtres.type) &&
          (!filtres.categorie || s.categorie === filtres.categorie) &&
          (!filtres.wilaya || s.wilaya === filtres.wilaya) &&
          (!filtres.ville || s.ville === filtres.ville)
      ),
    [salons, filtres]
  );

  const filtresActifs =
    Boolean(filtres.type || filtres.categorie || filtres.wilaya || filtres.ville);

  return {
    salons,
    filtered,
    filtres,
    setFiltre,
    reset,
    options,
    loading,
    error,
    reload: charger,
    filtresActifs,
  };
}

'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import SalonSlider from '@/components/salon-search/SalonSlider';
import { useSalonsExplorer } from '@/hooks/useSalonsExplorer';

/** Fonds défilants de la bannière d'accueil. */
const BACKGROUNDS = ['/img/bg1.jpg', '/img/bg2.jpg', '/img/bg3.jpg'];

type Props = {
  /** Catégorie verrouillée (pages coiffeur/barbier/...). Absent = accueil. */
  categorieFixe?: string;
  title: string;
  subtitle: string;
  /** Image de bannière fixe (utilisée quand `rotating` est faux). */
  bannerImage?: string;
  /** Accueil : fond défilant plutôt qu'une image fixe. */
  rotating?: boolean;
};

/**
 * Bloc « exploration des salons » commun à l'accueil ET aux pages catégorie :
 * bannière + filtres automatiques (type, catégorie, wilaya, ville) + slider
 * avec skeleton / erreur / état vide. La seule différence entre l'accueil et
 * une page catégorie est la présence de `categorieFixe` (qui pré-filtre les
 * salons et masque le filtre « catégorie »).
 */
export default function SalonsExplorer({
  categorieFixe,
  title,
  subtitle,
  bannerImage,
  rotating = false,
}: Props) {
  const { filtered, filtres, setFiltre, reset, options, loading, error, reload, filtresActifs } =
    useSalonsExplorer(categorieFixe);

  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    if (!rotating) return;
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [rotating]);

  const backgroundImage = rotating
    ? `url(${BACKGROUNDS[bgIndex]})`
    : bannerImage
      ? `url('${bannerImage}')`
      : undefined;

  const selectClass =
    'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-700 outline-none focus:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60 md:flex-1';

  return (
    <>
      {/* Bannière + filtres */}
      <section className="relative min-h-[440px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-black/65" />

        <div className="relative z-10 mx-auto flex min-h-[440px] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-sm md:text-5xl">{title}</h1>
          <p className="mt-3 text-white/90">{subtitle}</p>

          {/* Filtres — recherche automatique, sans bouton */}
          <div className="mt-8 flex w-full max-w-4xl flex-col items-stretch gap-3 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur md:flex-row md:items-center">
            <select
              value={filtres.type}
              onChange={(e) => setFiltre('type', e.target.value)}
              className={selectClass}
              aria-label="Filtrer par type"
            >
              <option value="">Tous les types</option>
              {options.types.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>

            {/* Filtre catégorie masqué sur les pages catégorie (déjà verrouillé) */}
            {!categorieFixe && (
              <select
                value={filtres.categorie}
                onChange={(e) => setFiltre('categorie', e.target.value)}
                className={selectClass}
                aria-label="Filtrer par catégorie"
              >
                <option value="">Toutes les catégories</option>
                {options.categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtres.wilaya}
              onChange={(e) => setFiltre('wilaya', e.target.value)}
              className={selectClass}
              aria-label="Filtrer par wilaya"
            >
              <option value="">Toutes les wilayas</option>
              {options.wilayas.map((w) => (
                <option key={w} value={w} className="capitalize">
                  {w}
                </option>
              ))}
            </select>

            <select
              value={filtres.ville}
              onChange={(e) => setFiltre('ville', e.target.value)}
              disabled={options.villes.length === 0}
              className={selectClass}
              aria-label="Filtrer par ville"
            >
              <option value="">Toutes les villes</option>
              {options.villes.map((v) => (
                <option key={v} value={v} className="capitalize">
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Résultats (chargés automatiquement) */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nos salons</h2>
            {!loading && !error && (
              <p className="mt-1 text-sm text-gray-500">
                {filtered.length} salon{filtered.length > 1 ? 's' : ''} disponible
                {filtered.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {filtresActifs && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          )}
        </div>

        <SalonSlider
          salons={filtered}
          loading={loading}
          error={error}
          emptyText="Aucun salon trouvé."
          emptyHint="Essayez de modifier les filtres."
          onRetry={reload}
        />
      </section>
    </>
  );
}

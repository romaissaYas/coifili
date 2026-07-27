import { memo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Clock, Tag, Scissors, ArrowRight } from 'lucide-react';
import type { SalonResult } from '@/types/salon';

/**
 * Le backend ne renvoie pas encore prix / durée / note / avis au niveau salon.
 * On les déclare optionnels pour un affichage « si disponible » : dès que ces
 * champs existeront côté API, la carte les affichera sans autre modification.
 */
type SalonCardData = SalonResult &
  Partial<{
    prix: number;
    duree: number;
    note: number;
    avis: number;
    description: string;
  }>;

type Props = {
  salon: SalonCardData;
  /** Index dans la liste : sert au décalage de l'animation d'apparition. */
  index?: number;
};

function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

function SalonCard({ salon, index = 0 }: Props) {
  const href = `/salon/${salon.id}`;
  const description = salon.description ?? salon.message;
  const lieu = [salon.ville, salon.wilaya].filter(Boolean).join(', ');

  // Repli élégant si l'image est absente OU si son URL échoue au chargement
  // (ex. valeur invalide en base). Évite l'icône « image cassée ».
  const [imgError, setImgError] = useState(false);
  const afficherImage = Boolean(salon.image) && !imgError;

  return (
    <article
      className="cf-fade-in-up group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(0,0,0,0.14)]"
      style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
    >
      {/* Visuel */}
      <div className="relative h-52 w-full overflow-hidden">
        {afficherImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={salon.image}
            alt={salon.nom}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100">
            <Scissors className="h-12 w-12 text-rose-400" />
          </div>
        )}

        {/* Voile dégradé pour la lisibilité des badges */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

        {/* Catégorie */}
        {salon.categorie && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-rose-600 shadow-sm backdrop-blur">
            {salon.categorie}
          </span>
        )}

        {/* Note (si disponible) */}
        {typeof salon.note === 'number' && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {salon.note.toFixed(1)}
            {typeof salon.avis === 'number' && (
              <span className="font-normal text-gray-500">({salon.avis})</span>
            )}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-bold text-gray-900">{salon.nom}</h3>

        {lieu && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="line-clamp-1">{lieu}</span>
          </p>
        )}

        {salon.type && (
          <span className="mt-2 inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
            {salon.type}
          </span>
        )}

        {/* Prix / durée (si disponibles) */}
        {(typeof salon.prix === 'number' || typeof salon.duree === 'number') && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {typeof salon.prix === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-700">
                <Tag className="h-3.5 w-3.5" />
                {salon.prix} DA
              </span>
            )}
            {typeof salon.duree === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                {formatDuree(salon.duree)}
              </span>
            )}
          </div>
        )}

        {description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3 pt-1">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-600 hover:to-pink-700 hover:shadow-md"
          >
            Réserver maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
          >
            Détails
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(SalonCard);

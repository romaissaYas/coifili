'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { SearchX, AlertTriangle, RotateCcw } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import type { SalonResult } from '@/types/salon';
import SalonCard from './SalonCard';

type Props = {
  salons: SalonResult[];
  loading: boolean;
  error: string | null;
  emptyText: string;
  /** Sous-texte de l'état vide (invite à ajuster la recherche/les filtres). */
  emptyHint?: string;
  onRetry: () => void;
};

/** Nombre de cartes fantômes affichées pendant le chargement. */
const SKELETON_COUNT = 4;

function SkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <div className="cf-skeleton h-52 w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="cf-skeleton h-5 w-3/4 rounded" />
        <div className="cf-skeleton h-4 w-1/2 rounded" />
        <div className="cf-skeleton h-4 w-full rounded" />
        <div className="mt-4 flex gap-3">
          <div className="cf-skeleton h-10 flex-1 rounded-full" />
          <div className="cf-skeleton h-10 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SalonSlider({
  salons,
  loading,
  error,
  emptyText,
  emptyHint = 'Essayez de modifier votre recherche.',
  onRetry,
}: Props) {
  // 1) Chargement → skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // 2) Erreur → message clair + réessai
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-4 max-w-md text-red-700">{error}</p>
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }

  // 3) Aucun résultat → état vide élégant
  if (salons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center">
        <SearchX className="h-10 w-10 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-700">{emptyText}</p>
        <p className="mt-1 text-sm text-gray-400">{emptyHint}</p>
      </div>
    );
  }

  // 4) Résultats → slider premium
  return (
    <div className="cf-slider">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        grabCursor
        loop={salons.length > 4}
        spaceBetween={24}
        slidesPerView={1.1}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 24 },
          768: { slidesPerView: 3, spaceBetween: 24 },
          1024: { slidesPerView: 4, spaceBetween: 28 },
        }}
      >
        {salons.map((salon, i) => (
          <SwiperSlide key={salon.id ?? i} className="!h-auto pb-2">
            <SalonCard salon={salon} index={i} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Search, SearchX, AlertTriangle, RotateCcw } from 'lucide-react';

import { useProduitsPublies } from '@/hooks/useProduitsPublies';
import ProduitCard from './ProduitCard';
import ProduitDetailModal from './ProduitDetailModal';
import type { Product } from '@/types/product';

const CHIPS = [
  { v: '', l: 'Tous' },
  { v: 'cheveux', l: 'Cheveux' },
  { v: 'visage', l: 'Visage' },
  { v: 'maquillage', l: 'Maquillage' },
  { v: 'ongles', l: 'Ongles' },
  { v: 'massage', l: 'Massage' },
  { v: 'parfum', l: 'Parfum' },
  { v: 'promotions', l: 'Promotions' },
];

function SkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      <div className="cf-skeleton h-52 w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="cf-skeleton h-4 w-1/3 rounded" />
        <div className="cf-skeleton h-5 w-3/4 rounded" />
        <div className="cf-skeleton h-4 w-1/2 rounded" />
        <div className="cf-skeleton mt-3 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function ProduitsSection() {
  const { filtered, loading, error, reload, categorie, setCategorie, q, setQ } = useProduitsPublies();
  const [detail, setDetail] = useState<Product | null>(null);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Boutique</h2>
        <h3 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">Nos Produits Beauté</h3>

        {/* Recherche */}
        <div className="mb-4 flex max-w-md items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-rose-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit, une marque, un salon…"
            className="w-full bg-transparent text-sm outline-none"
            aria-label="Rechercher un produit"
          />
        </div>

        {/* Filtres catégorie */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.v}
              onClick={() => setCategorie(c.v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categorie === c.v ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              {c.l}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="mt-4 text-red-700">{error}</p>
            <button onClick={reload} className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
              <RotateCcw className="h-4 w-4" /> Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center">
            <SearchX className="h-10 w-10 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-700">Aucun produit trouvé.</p>
            <p className="mt-1 text-sm text-gray-400">Essayez une autre catégorie ou recherche.</p>
          </div>
        ) : (
          <div className="cf-slider">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              grabCursor
              loop={filtered.length > 4}
              spaceBetween={24}
              slidesPerView={1.1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 24 },
                1024: { slidesPerView: 4, spaceBetween: 28 },
              }}
            >
              {filtered.map((p, i) => (
                <SwiperSlide key={p.id} className="!h-auto pb-2">
                  <ProduitCard produit={p} index={i} onVoir={setDetail} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      <ProduitDetailModal produit={detail} onClose={() => setDetail(null)} />
    </section>
  );
}

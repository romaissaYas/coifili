'use client';

import { motion } from 'framer-motion';
import { PRODUCT_CATEGORIE_LABELS, type Product } from '@/types/product';

const num = (v: number | string | null) => (v == null ? null : Number(v));
const DA = (v: number | string | null) => `${Number(v ?? 0).toLocaleString('fr-FR')} DA`;
const estNouveau = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() < 14 * 24 * 60 * 60 * 1000; // < 14 jours

export default function ProduitCard({
  produit,
  index = 0,
  onVoir,
}: {
  produit: Product;
  index?: number;
  onVoir: (p: Product) => void;
}) {
  const promo = num(produit.prix_promo) != null && (num(produit.prix_promo) as number) < (num(produit.prix) as number);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
      whileHover={{ y: -6 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.14)]"
    >
      <div className="relative h-52 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={produit.images[0] || '/img/bg4.jpg'}
          alt={produit.nom}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {promo && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">Promo</span>}
          {estNouveau(produit.created_at) && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">Nouveau</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold capitalize text-rose-500">
          {PRODUCT_CATEGORIE_LABELS[produit.categorie]}
        </span>
        <h3 className="line-clamp-1 text-lg font-bold text-gray-900">{produit.nom}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-gray-500">
          {produit.salon_nom}{produit.salon_ville ? ` · ${produit.salon_ville}` : ''}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {promo ? (
            <>
              <span className="text-lg font-bold text-rose-600">{DA(produit.prix_promo)}</span>
              <span className="text-sm text-gray-400 line-through">{DA(produit.prix)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">{DA(produit.prix)}</span>
          )}
        </div>

        <button
          onClick={() => onVoir(produit)}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-600 hover:to-pink-700 hover:shadow-md"
        >
          Voir le produit
        </button>
      </div>
    </motion.article>
  );
}

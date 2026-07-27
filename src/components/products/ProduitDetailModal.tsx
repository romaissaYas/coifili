'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PRODUCT_CATEGORIE_LABELS, type Product } from '@/types/product';

const num = (v: number | string | null) => (v == null ? null : Number(v));
const DA = (v: number | string | null) => `${Number(v ?? 0).toLocaleString('fr-FR')} DA`;

export default function ProduitDetailModal({
  produit,
  onClose,
}: {
  produit: Product | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {produit && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={produit.images[0] || '/img/bg4.jpg'} alt={produit.nom} className="h-full w-full object-cover" />
              <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {produit.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {produit.images.slice(1).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ))}
              </div>
            )}

            <div className="p-6">
              <span className="text-xs font-semibold capitalize text-rose-500">
                {PRODUCT_CATEGORIE_LABELS[produit.categorie]}{produit.marque ? ` · ${produit.marque}` : ''}
              </span>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{produit.nom}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {produit.salon_nom}{produit.salon_ville ? ` · ${produit.salon_ville}` : ''}
              </p>

              <div className="mt-4 flex items-center gap-3">
                {num(produit.prix_promo) != null ? (
                  <>
                    <span className="text-2xl font-bold text-rose-600">{DA(produit.prix_promo)}</span>
                    <span className="text-gray-400 line-through">{DA(produit.prix)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{DA(produit.prix)}</span>
                )}
                {produit.disponibilite ? (
                  <span className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">En stock</span>
                ) : (
                  <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Indisponible</span>
                )}
              </div>

              {produit.description && <p className="mt-4 text-sm leading-relaxed text-gray-600">{produit.description}</p>}

              {produit.salon_id && (
                <Link
                  href={`/salon/${produit.salon_id}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-rose-600 hover:to-pink-700"
                >
                  Voir le salon
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

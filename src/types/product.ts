export type ProductStatut = 'draft' | 'published';

export const PRODUCT_CATEGORIES = ['cheveux', 'visage', 'maquillage', 'ongles', 'massage', 'parfum'] as const;
export type ProductCategorie = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORIE_LABELS: Record<ProductCategorie, string> = {
  cheveux: 'Cheveux',
  visage: 'Visage',
  maquillage: 'Maquillage',
  ongles: 'Ongles',
  massage: 'Massage',
  parfum: 'Parfum',
};

export type Product = {
  id: number;
  salon_id: number;
  nom: string;
  description: string | null;
  categorie: ProductCategorie;
  marque: string | null;
  // Les colonnes DECIMAL de MySQL peuvent revenir en string : on tolère les deux.
  prix: number | string;
  prix_promo: number | string | null;
  stock: number | null;
  disponibilite: boolean;
  images: string[];
  statut: ProductStatut;
  created_at: string;
  updated_at: string;
  salon_nom?: string;
  salon_ville?: string;
  salon_wilaya?: string;
};

/** Payload d'écriture (création/mise à jour) d'un produit. */
export type ProductInput = {
  nom: string;
  description?: string;
  categorie: ProductCategorie;
  marque?: string;
  prix: number;
  prix_promo?: number | null;
  stock?: number | null;
  disponibilite?: boolean;
  images?: string[];
  statut?: ProductStatut;
};

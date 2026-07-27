import { pool } from '../db/pool';
import { ServiceError } from '../utils/ServiceError';
import { enveloppe, type Paginated } from '../utils/pagination';

/**
 * Boutique produits (fonctionnalité isolée). Un salon gère ses produits ;
 * seuls les produits `published` d'un salon `actif` sont visibles publiquement.
 * SQL paramétré. Aucune route/table existante n'est modifiée.
 */

type ProductInput = {
  nom: string;
  description?: string | null;
  categorie: string;
  marque?: string | null;
  prix: number;
  prix_promo?: number | null;
  stock?: number | null;
  disponibilite?: boolean;
  images?: string[];
  statut?: 'draft' | 'published';
};

const PUBLIC_SELECT = `
  p.id, p.salon_id, p.nom, p.description, p.categorie, p.marque, p.prix, p.prix_promo,
  p.stock, p.disponibilite, p.images, p.statut, p.created_at, p.updated_at,
  s.nom AS salon_nom, s.ville AS salon_ville, s.wilaya AS salon_wilaya
`;

function parseImages(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: any) {
  return { ...row, images: parseImages(row.images), disponibilite: Boolean(row.disponibilite) };
}

/** Produits d'un salon (tous statuts) — pour le dashboard du propriétaire. */
export async function listerProduitsDuSalon(salonId: number) {
  const [rows]: any = await pool.query(
    `SELECT ${PUBLIC_SELECT} FROM products p JOIN salons s ON s.id = p.salon_id
     WHERE p.salon_id = ? ORDER BY p.created_at DESC`,
    [salonId]
  );
  return rows.map(mapRow);
}

/**
 * Produits publiés (public) : salon actif + statut published. Filtres
 * categorie / recherche / promo. Pagination OPT-IN : si `page`/`limit` sont
 * fournis, renvoie une enveloppe { data, total, ... } ; sinon un tableau
 * (comportement historique inchangé).
 */
export async function listerProduitsPublies(
  filtres: { categorie?: string; q?: string; promo?: boolean; salon_id?: number; page?: number; limit?: number }
): Promise<any[] | Paginated<any>> {
  const conditions: string[] = ["p.statut = 'published'", "s.statut = 'actif'"];
  const values: any[] = [];

  if (filtres.salon_id) {
    conditions.push('p.salon_id = ?');
    values.push(filtres.salon_id);
  }
  if (filtres.categorie) {
    conditions.push('p.categorie = ?');
    values.push(filtres.categorie);
  }
  if (filtres.promo) {
    conditions.push('p.prix_promo IS NOT NULL AND p.prix_promo < p.prix');
  }
  if (filtres.q) {
    conditions.push('(p.nom LIKE ? OR p.marque LIKE ? OR s.nom LIKE ?)');
    const like = `%${filtres.q}%`;
    values.push(like, like, like);
  }

  const where = conditions.join(' AND ');

  if (filtres.page !== undefined || filtres.limit !== undefined) {
    const page = filtres.page && filtres.page >= 1 ? Math.floor(filtres.page) : 1;
    const limit = Math.min(filtres.limit && filtres.limit >= 1 ? Math.floor(filtres.limit) : 20, 100);
    const offset = (page - 1) * limit;
    const [[{ total }]]: any = await pool.query(
      `SELECT COUNT(*) AS total FROM products p JOIN salons s ON s.id = p.salon_id WHERE ${where}`,
      values
    );
    const [rows]: any = await pool.query(
      `SELECT ${PUBLIC_SELECT} FROM products p JOIN salons s ON s.id = p.salon_id
       WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return enveloppe(rows.map(mapRow), Number(total), page, limit);
  }

  const [rows]: any = await pool.query(
    `SELECT ${PUBLIC_SELECT} FROM products p JOIN salons s ON s.id = p.salon_id
     WHERE ${where} ORDER BY p.created_at DESC`,
    values
  );
  return rows.map(mapRow);
}

/** Détail public d'un produit publié (salon actif). 404 sinon. */
export async function obtenirProduitPublic(id: number) {
  const [rows]: any = await pool.query(
    `SELECT ${PUBLIC_SELECT} FROM products p JOIN salons s ON s.id = p.salon_id
     WHERE p.id = ? AND p.statut = 'published' AND s.statut = 'actif'`,
    [id]
  );
  if (!rows[0]) throw new ServiceError(404, 'Produit introuvable.');
  return mapRow(rows[0]);
}

/** Charge un produit et vérifie qu'il appartient bien au salon (ownership). */
async function chargerProduitPossede(id: number, salonId: number) {
  const [rows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  const product = rows[0];
  if (!product) throw new ServiceError(404, 'Produit introuvable.');
  if (product.salon_id !== salonId) {
    throw new ServiceError(403, "Ce produit n'appartient pas à votre salon.");
  }
  return product;
}

export async function creerProduit(salonId: number, data: ProductInput) {
  const [res]: any = await pool.execute(
    `INSERT INTO products
       (salon_id, nom, description, categorie, marque, prix, prix_promo, stock, disponibilite, images, statut)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      salonId, data.nom, data.description ?? null, data.categorie, data.marque ?? null,
      data.prix, data.prix_promo ?? null, data.stock ?? null,
      data.disponibilite === false ? 0 : 1,
      JSON.stringify(data.images ?? []),
      data.statut === 'published' ? 'published' : 'draft',
    ]
  );
  return obtenirProduitPossede(res.insertId, salonId);
}

/** Détail d'un produit possédé (dashboard, y compris brouillon). */
export async function obtenirProduitPossede(id: number, salonId: number) {
  await chargerProduitPossede(id, salonId);
  const [rows]: any = await pool.query(
    `SELECT ${PUBLIC_SELECT} FROM products p JOIN salons s ON s.id = p.salon_id WHERE p.id = ?`,
    [id]
  );
  return mapRow(rows[0]);
}

export async function modifierProduit(id: number, salonId: number, data: ProductInput) {
  await chargerProduitPossede(id, salonId);
  await pool.execute(
    `UPDATE products SET
       nom = ?, description = ?, categorie = ?, marque = ?, prix = ?, prix_promo = ?,
       stock = ?, disponibilite = ?, images = ?
     WHERE id = ? AND salon_id = ?`,
    [
      data.nom, data.description ?? null, data.categorie, data.marque ?? null,
      data.prix, data.prix_promo ?? null, data.stock ?? null,
      data.disponibilite === false ? 0 : 1,
      JSON.stringify(data.images ?? []),
      id, salonId,
    ]
  );
  return obtenirProduitPossede(id, salonId);
}

export async function supprimerProduit(id: number, salonId: number): Promise<void> {
  await chargerProduitPossede(id, salonId);
  await pool.execute('DELETE FROM products WHERE id = ? AND salon_id = ?', [id, salonId]);
}

export async function changerStatutProduit(id: number, salonId: number, statut: 'draft' | 'published') {
  await chargerProduitPossede(id, salonId);
  await pool.execute('UPDATE products SET statut = ? WHERE id = ? AND salon_id = ?', [statut, id, salonId]);
  return obtenirProduitPossede(id, salonId);
}

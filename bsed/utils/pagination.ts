/**
 * Pagination OPT-IN et rétrocompatible.
 *
 * Principe : tant qu'aucun paramètre `page` (ou `limit`) n'est fourni, les
 * services renvoient EXACTEMENT la même chose qu'avant (un tableau complet) —
 * aucune régression pour les consommateurs existants (frontend actuel).
 * Dès qu'un `page` est fourni, la réponse devient une enveloppe paginée
 * { data, page, limit, total, totalPages }.
 */

export type PaginationParams = { page?: number; limit?: number };

export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const LIMIT_DEFAUT = 20;
const LIMIT_MAX = 100;

/** true si une pagination explicite a été demandée (présence de page/limit). */
export function paginationDemandee(query: Record<string, unknown>): boolean {
  return query.page !== undefined || query.limit !== undefined;
}

/** Normalise page/limit depuis la query string (bornes sûres). */
export function lirePagination(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const limitBase = Number.isFinite(limitRaw) && limitRaw >= 1 ? Math.floor(limitRaw) : LIMIT_DEFAUT;
  const limit = Math.min(limitBase, LIMIT_MAX);
  return { page, limit, offset: (page - 1) * limit };
}

/** Construit l'enveloppe paginée à partir des lignes et du total. */
export function enveloppe<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  return { data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

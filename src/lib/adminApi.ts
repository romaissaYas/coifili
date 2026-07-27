import { API_URL } from './apiConfig';
import type {
  AdminSalon,
  AdminStats,
  AdminUser,
  AdminReservation,
  AdminEmploye,
  AdminPayment,
  AuditLog,
  AbonnementInput,
} from '@/types/admin';

/** Construit une query string à partir d'un objet (ignore les valeurs vides). */
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

/**
 * Appel authentifié vers l'API admin. Le token (posé au login) est lu dans
 * localStorage ; le rôle super_admin est vérifié côté serveur.
 */
async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Erreur serveur');
  }
  return data as T;
}

export const adminApi = {
  me: () => adminFetch<{ id: number; userType: string; role: string }>('/me'),
  stats: () => adminFetch<AdminStats>('/stats'),

  // Salons
  listSalons: (params?: { statut?: string; q?: string }) =>
    adminFetch<AdminSalon[]>(`/salons${qs(params)}`),
  createSalon: (body: Record<string, unknown>) =>
    adminFetch<AdminSalon>('/salons', { method: 'POST', body: JSON.stringify(body) }),
  getSalon: (id: number) => adminFetch<AdminSalon>(`/salons/${id}`),
  updateSalon: (id: number, body: Partial<AdminSalon>) =>
    adminFetch<AdminSalon>(`/salons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSalon: (id: number) => adminFetch<void>(`/salons/${id}`, { method: 'DELETE' }),
  validateSalon: (id: number) => adminFetch<AdminSalon>(`/salons/${id}/validate`, { method: 'POST' }),
  refuseSalon: (id: number) => adminFetch<void>(`/salons/${id}/refuse`, { method: 'POST' }),
  suspendSalon: (id: number) => adminFetch<AdminSalon>(`/salons/${id}/suspend`, { method: 'POST' }),
  reactivateSalon: (id: number) =>
    adminFetch<AdminSalon>(`/salons/${id}/reactivate`, { method: 'POST' }),
  updateSubscription: (id: number, body: AbonnementInput) =>
    adminFetch<AdminSalon>(`/salons/${id}/subscription`, { method: 'PUT', body: JSON.stringify(body) }),

  // Utilisateurs
  listUsers: (params?: { role?: string; statut?: string; q?: string }) =>
    adminFetch<AdminUser[]>(`/users${qs(params)}`),
  // Variante paginée (renvoie l'enveloppe { data, total, page, limit, totalPages }).
  listUsersPage: (params?: { role?: string; statut?: string; q?: string; tri?: string; page?: number; limit?: number }) =>
    adminFetch<{ data: AdminUser[]; total: number; page: number; limit: number; totalPages: number }>(`/users${qs(params)}`),
  getUser: (id: number) => adminFetch<AdminUser>(`/users/${id}`),
  updateUser: (id: number, body: Partial<AdminUser>) =>
    adminFetch<AdminUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: number) => adminFetch<void>(`/users/${id}`, { method: 'DELETE' }),
  suspendUser: (id: number) => adminFetch<AdminUser>(`/users/${id}/suspend`, { method: 'POST' }),
  reactivateUser: (id: number) => adminFetch<AdminUser>(`/users/${id}/reactivate`, { method: 'POST' }),
  resetPassword: (id: number, newPassword?: string) =>
    adminFetch<{ message: string; temporaryPassword?: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(newPassword ? { newPassword } : {}),
    }),

  // Réservations
  listReservations: (params?: { salon_id?: number; statut?: string; date?: string; q?: string }) =>
    adminFetch<AdminReservation[]>(`/reservations${qs(params)}`),
  changeReservationStatut: (id: number, statut: string) =>
    adminFetch<{ message: string }>(`/reservations/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    }),
  cancelReservation: (id: number) =>
    adminFetch<{ message: string }>(`/reservations/${id}/cancel`, { method: 'POST' }),
  deleteReservation: (id: number) =>
    adminFetch<void>(`/reservations/${id}`, { method: 'DELETE' }),

  // Employés
  listEmployes: (params?: { salon_id?: number; q?: string }) =>
    adminFetch<AdminEmploye[]>(`/employes${qs(params)}`),
  deleteEmploye: (id: number) => adminFetch<void>(`/employes/${id}`, { method: 'DELETE' }),

  // Paiements d'abonnement
  listPayments: (params?: { statut?: string }) =>
    adminFetch<AdminPayment[]>(`/payments${qs(params)}`),
  validatePayment: (id: number) => adminFetch(`/payments/${id}/validate`, { method: 'POST' }),
  refusePayment: (id: number) => adminFetch<{ message: string }>(`/payments/${id}/refuse`, { method: 'POST' }),
  changePlan: (salonId: number, planId: number) =>
    adminFetch(`/salons/${salonId}/change-plan`, { method: 'POST', body: JSON.stringify({ planId }) }),
  extendSubscription: (salonId: number, mois: number) =>
    adminFetch(`/salons/${salonId}/extend`, { method: 'POST', body: JSON.stringify({ mois }) }),

  // Plans (endpoint public, réutilisé côté admin pour le choix de plan)
  listPlans: async () => {
    const res = await fetch(`${API_URL}/api/subscriptions/plans`);
    return res.ok ? ((await res.json()) as Array<{ id: number; nom: string; prix: number | string; duree_mois: number }>) : [];
  },

  // Journal & abonnements
  listAudit: (params?: { action?: string; userId?: number; limit?: number }) =>
    adminFetch<AuditLog[]>(`/audit${qs(params)}`),
  runSubscriptions: () =>
    adminFetch<{ message: string; expires: number; alertes: number }>('/subscriptions/run', {
      method: 'POST',
    }),
};

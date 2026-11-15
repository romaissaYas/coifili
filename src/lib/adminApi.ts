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
import type {
  IgPost, IgPostInput, IgPostStats, Paginated,
  IgReel, IgReelInput, IgStory, IgStoryInput, IgHighlight, IgHighlightInput,
  IgMedia, IgMediaInput, IgHashtagGroup, IgHashtagGroupInput, IgSettings, IgSettingsInput,
  IgCalendarItem, IgCalendarType, IgAiStatus, IgContenuGenere,
  MetaConnection, MetaPage, MetaPublishResult,
} from '@/types/marketing';

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

  // --- Module Marketing Instagram — Publications ---
  marketing: {
    listPosts: (params?: { statut?: string; q?: string; tri?: string; page?: number; limit?: number }) =>
      adminFetch<Paginated<IgPost>>(`/marketing/posts${qs(params)}`),
    postStats: () => adminFetch<IgPostStats>('/marketing/posts/stats'),
    getPost: (id: number) => adminFetch<IgPost>(`/marketing/posts/${id}`),
    createPost: (body: IgPostInput) =>
      adminFetch<IgPost>('/marketing/posts', { method: 'POST', body: JSON.stringify(body) }),
    updatePost: (id: number, body: IgPostInput) =>
      adminFetch<IgPost>(`/marketing/posts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deletePost: (id: number) => adminFetch<{ message: string }>(`/marketing/posts/${id}`, { method: 'DELETE' }),
    duplicatePost: (id: number) =>
      adminFetch<IgPost>(`/marketing/posts/${id}/duplicate`, { method: 'POST' }),

    // Reels
    listReels: (params?: { statut?: string; q?: string; tri?: string; page?: number; limit?: number }) =>
      adminFetch<Paginated<IgReel>>(`/marketing/reels${qs(params)}`),
    createReel: (body: IgReelInput) => adminFetch<IgReel>('/marketing/reels', { method: 'POST', body: JSON.stringify(body) }),
    updateReel: (id: number, body: IgReelInput) => adminFetch<IgReel>(`/marketing/reels/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteReel: (id: number) => adminFetch<{ message: string }>(`/marketing/reels/${id}`, { method: 'DELETE' }),
    duplicateReel: (id: number) => adminFetch<IgReel>(`/marketing/reels/${id}/duplicate`, { method: 'POST' }),

    // Stories
    listStories: (params?: { highlight_id?: number; statut?: string; q?: string; page?: number; limit?: number }) =>
      adminFetch<Paginated<IgStory>>(`/marketing/stories${qs(params)}`),
    createStory: (body: IgStoryInput) => adminFetch<IgStory>('/marketing/stories', { method: 'POST', body: JSON.stringify(body) }),
    updateStory: (id: number, body: IgStoryInput) => adminFetch<IgStory>(`/marketing/stories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteStory: (id: number) => adminFetch<{ message: string }>(`/marketing/stories/${id}`, { method: 'DELETE' }),

    // Stories à la une (highlights)
    listHighlights: () => adminFetch<IgHighlight[]>('/marketing/highlights'),
    createHighlight: (body: IgHighlightInput) => adminFetch<IgHighlight>('/marketing/highlights', { method: 'POST', body: JSON.stringify(body) }),
    updateHighlight: (id: number, body: IgHighlightInput) => adminFetch<IgHighlight>(`/marketing/highlights/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteHighlight: (id: number) => adminFetch<{ message: string }>(`/marketing/highlights/${id}`, { method: 'DELETE' }),

    // Médiathèque
    listMedia: (params?: { type?: string; q?: string; page?: number; limit?: number }) =>
      adminFetch<Paginated<IgMedia>>(`/marketing/media${qs(params)}`),
    createMedia: (body: IgMediaInput) => adminFetch<IgMedia>('/marketing/media', { method: 'POST', body: JSON.stringify(body) }),
    deleteMedia: (id: number) => adminFetch<{ message: string }>(`/marketing/media/${id}`, { method: 'DELETE' }),

    // Hashtags
    listHashtags: () => adminFetch<IgHashtagGroup[]>('/marketing/hashtags'),
    createHashtag: (body: IgHashtagGroupInput) => adminFetch<IgHashtagGroup>('/marketing/hashtags', { method: 'POST', body: JSON.stringify(body) }),
    updateHashtag: (id: number, body: IgHashtagGroupInput) => adminFetch<IgHashtagGroup>(`/marketing/hashtags/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteHashtag: (id: number) => adminFetch<{ message: string }>(`/marketing/hashtags/${id}`, { method: 'DELETE' }),

    // Paramètres
    getSettings: () => adminFetch<IgSettings>('/marketing/settings'),
    updateSettings: (body: IgSettingsInput) => adminFetch<IgSettings>('/marketing/settings', { method: 'PUT', body: JSON.stringify(body) }),

    // Calendrier éditorial
    calendar: (from: string, to: string) => adminFetch<IgCalendarItem[]>(`/marketing/calendar${qs({ from, to })}`),
    reschedule: (type: IgCalendarType, id: number, date: string) =>
      adminFetch<{ type: string; id: number; date_publication: string; statut: string }>(
        `/marketing/calendar/${type}/${id}`, { method: 'PATCH', body: JSON.stringify({ date }) }
      ),

    // Génération IA
    aiStatus: () => adminFetch<IgAiStatus>('/marketing/ai/status'),
    aiGenerate: (theme: string) => adminFetch<IgContenuGenere>('/marketing/ai/generate', { method: 'POST', body: JSON.stringify({ theme }) }),
    aiImage: (prompt: string) => adminFetch<{ url: string }>('/marketing/ai/image', { method: 'POST', body: JSON.stringify({ prompt }) }),

    // Connexion & publication Meta (Facebook + Instagram)
    metaStatus: () => adminFetch<MetaConnection>('/marketing/meta/status'),
    metaConnectUrl: () => adminFetch<{ url: string }>('/marketing/meta/connect-url'),
    metaPages: () => adminFetch<MetaPage[]>('/marketing/meta/pages'),
    metaSelectPage: (pageId: string) =>
      adminFetch<{ message: string }>('/marketing/meta/select-page', { method: 'POST', body: JSON.stringify({ pageId }) }),
    metaDisconnect: () => adminFetch<{ message: string }>('/marketing/meta/disconnect', { method: 'POST' }),
    publishPost: (id: number) => adminFetch<{ meta_media_id: string }>(`/marketing/posts/${id}/publish`, { method: 'POST' }),
    publishReseaux: (id: number, reseaux: { facebook?: boolean; instagram?: boolean }) =>
      adminFetch<MetaPublishResult>(`/marketing/posts/${id}/publish-reseaux`, { method: 'POST', body: JSON.stringify(reseaux) }),
  },
};

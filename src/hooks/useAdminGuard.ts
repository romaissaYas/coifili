'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';

/**
 * Protège l'espace admin côté client : vérifie qu'un token est présent ET
 * qu'il correspond bien à un super_admin (appel `GET /api/admin/me`). Sinon,
 * redirige vers /login. La vraie sécurité reste côté serveur (JWT + rôle) ;
 * ce garde ne fait qu'éviter d'afficher l'UI à un non-admin.
 */
export function useAdminGuard(): 'loading' | 'authorized' {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized'>('loading');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    adminApi
      .me()
      .then(() => {
        if (active) setStatus('authorized');
      })
      .catch(() => {
        router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  return status;
}

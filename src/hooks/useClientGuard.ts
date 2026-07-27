import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserData } from '@/types/user';

/**
 * Protège les pages de l'espace client : redirige vers /login si aucun compte
 * n'est connecté, et vers /espacecoiffeur si le compte est un coiffeur.
 * Renvoie l'utilisateur une fois vérifié (null pendant la vérification).
 */
export function useClientGuard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) {
      router.replace('/login');
      return;
    }
    const parsed: UserData = JSON.parse(stored);
    if (parsed.userType === 'coiffeur') {
      router.replace('/espacecoiffeur');
      return;
    }
    setUser(parsed);
  }, [router]);

  return user;
}

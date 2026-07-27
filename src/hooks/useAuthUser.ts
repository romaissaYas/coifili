import { useEffect, useState } from 'react';
import type { UserData } from '@/types/user';

/** Charge l'utilisateur connecté depuis localStorage (posé au login). */
export function useAuthUser() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return user;
}

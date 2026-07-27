import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { Profil } from '@/types/reservation';

/** Charge et met à jour le profil du client connecté. */
export function useProfil() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfil = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/me`, { headers: getAuthHeaders() });
      setProfil(res.data);
    } catch {
      // silencieux : la page affiche un message si profil reste null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  /** Met à jour nom/prénom/email/téléphone. Retourne un message d'erreur ou null. */
  const updateProfil = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }): Promise<string | null> => {
    try {
      const res = await axios.put(`${API_URL}/api/users/me`, data, { headers: getAuthHeaders() });
      setProfil(res.data.user);
      // Garde le localStorage cohérent avec le nouveau profil.
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...u, firstName: data.firstName, lastName: data.lastName, email: data.email }));
      }
      return null;
    } catch (error) {
      return axios.isAxiosError(error) ? error.response?.data?.error || 'Erreur' : 'Erreur';
    }
  };

  /** Change le mot de passe. Retourne un message d'erreur ou null. */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    try {
      await axios.put(
        `${API_URL}/api/users/me/password`,
        { currentPassword, newPassword },
        { headers: getAuthHeaders() }
      );
      return null;
    } catch (error) {
      return axios.isAxiosError(error) ? error.response?.data?.error || 'Erreur' : 'Erreur';
    }
  };

  return { profil, loading, updateProfil, changePassword };
}

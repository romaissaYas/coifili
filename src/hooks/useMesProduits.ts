'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { Product, ProductInput } from '@/types/product';

/**
 * Boutique produits du salon connecté (nouvelle fonctionnalité isolée).
 * Utilise l'endpoint /api/products (dérive le salon du token JWT). N'affecte
 * pas le hook useProduits existant (« Produits à vendre »).
 */
export function useMesProduits() {
  const [produits, setProduits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Product[]>(`${API_URL}/api/products`, { headers: getAuthHeaders() });
      setProduits(res.data);
    } catch (error) {
      console.error('Erreur chargement produits :', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  const notif = (title: string) =>
    Swal.fire({ icon: 'success', title, timer: 1600, showConfirmButton: false });
  const erreur = (e: unknown) =>
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: (axios.isAxiosError(e) && e.response?.data?.error) || 'Une erreur est survenue.',
    });

  const creer = async (data: ProductInput): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/api/products`, data, { headers: getAuthHeaders() });
      await fetchProduits();
      notif('Produit ajouté');
      return true;
    } catch (e) {
      erreur(e);
      return false;
    }
  };

  const modifier = async (id: number, data: ProductInput): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/api/products/${id}`, data, { headers: getAuthHeaders() });
      await fetchProduits();
      notif('Produit modifié');
      return true;
    } catch (e) {
      erreur(e);
      return false;
    }
  };

  const supprimer = async (id: number): Promise<void> => {
    const c = await Swal.fire({
      title: 'Supprimer ce produit ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e11d67',
    });
    if (!c.isConfirmed) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, { headers: getAuthHeaders() });
      await fetchProduits();
      notif('Produit supprimé');
    } catch (e) {
      erreur(e);
    }
  };

  const publier = async (id: number): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/api/products/${id}/publish`, {}, { headers: getAuthHeaders() });
      await fetchProduits();
      notif('Produit publié');
    } catch (e) {
      erreur(e);
    }
  };

  const depublier = async (id: number): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/api/products/${id}/unpublish`, {}, { headers: getAuthHeaders() });
      await fetchProduits();
      notif('Produit dépublié');
    } catch (e) {
      erreur(e);
    }
  };

  return { produits, loading, fetchProduits, creer, modifier, supprimer, publier, depublier };
}

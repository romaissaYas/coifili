import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { Produit } from '@/types/produit';

/** Produits à vendre du salon connecté. */
export function useProduits(salonId: number | undefined) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [newProduit, setNewProduit] = useState({ nom: '', prix: '', salon_id: salonId });
  const [showAddProduitPopup, setShowAddProduitPopup] = useState(false);

  const fetchProduits = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/produits`, { headers: getAuthHeaders() });
      setProduits(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits :', error);
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleAddProduit = async () => {
    try {
      await axios.post(`${API_URL}/api/produits`, newProduit, { headers: getAuthHeaders() });
      setShowAddProduitPopup(false);
      setNewProduit({ nom: '', prix: '', salon_id: salonId });
      fetchProduits();
      Swal.fire({
        icon: 'success',
        title: 'Produit ajouté !',
        text: 'Le produit a bien été ajouté à la liste.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Impossible d'ajouter le produit. Veuillez réessayer.",
      });
      console.error('Erreur lors de l’ajout du produit :', error);
    }
  };

  return { produits, newProduit, setNewProduit, showAddProduitPopup, setShowAddProduitPopup, handleAddProduit };
}

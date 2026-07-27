import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { Prestation } from '@/types/prestation';
import type { UserData } from '@/types/user';

/** Prestations proposées par le salon connecté. */
export function usePrestations(user: UserData | null) {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newPrestation, setNewPrestation] = useState({ nom: '', prix: '', duree: '', salonId: user?.salonId });

  const fetchPrestations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/prestations`, { headers: getAuthHeaders() });
      setPrestations(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
    }
  };

  useEffect(() => {
    fetchPrestations();
  }, []);

  const handleAddPrestation = async () => {
    try {
      if (!user) {
        alert('Utilisateur non trouvé !');
        return;
      }

      const prestationData = {
        nom: newPrestation.nom,
        prix: Number(newPrestation.prix),
        duree: Number(newPrestation.duree),
        salonId: user.salonId, // indispensable pour relier la prestation au salon
      };

      await axios.post(`${API_URL}/api/prestations`, prestationData, { headers: getAuthHeaders() });

      setNewPrestation({ nom: '', prix: '', duree: '', salonId: user.salonId });
      setShowAddPopup(false);
      fetchPrestations();

      Swal.fire({
        icon: 'success',
        title: 'Ajouté !',
        text: `La prestation "${prestationData.nom}" a été ajoutée.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la prestation :", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Impossible d'ajouter la prestation.",
      });
    }
  };

  return { prestations, newPrestation, setNewPrestation, showAddPopup, setShowAddPopup, handleAddPrestation };
}

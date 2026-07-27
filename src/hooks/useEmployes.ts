import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import type { UserData } from '@/types/user';
import type { EmployeStats } from '@/types/stats';

/** Employés du salon connecté, enrichis de leurs statistiques. */
export function useEmployes(user: UserData | null) {
  const [employes, setEmployes] = useState<EmployeStats[]>([]);
  const [loadingEmployes, setLoadingEmployes] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [poste, setPoste] = useState('');
  const [message, setMessage] = useState('');

  const fetchEmployes = async () => {
    setLoadingEmployes(true);
    try {
      const res = await axios.get(`${API_URL}/api/employes/stats`, { headers: getAuthHeaders() });
      setEmployes(res.data);
    } catch (err) {
      console.error('Erreur de chargement des employés :', err);
    } finally {
      setLoadingEmployes(false);
    }
  };

  // Chargé au montage (pas seulement sur l'onglet Employés) : la liste sert
  // aussi au filtre de l'agenda et au sélecteur du modal de rendez-vous.
  useEffect(() => {
    fetchEmployes();
  }, []);

  const handleAddEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) {
        alert('Utilisateur non trouvé !');
        return;
      }
      await axios.post(
        `${API_URL}/api/employes`,
        { nom, poste },
        { headers: getAuthHeaders() }
      );
      setMessage('Employé ajouté');
      setNom('');
      setPoste('');
      setPopupOpen(false);
      fetchEmployes();
      Swal.fire({
        icon: 'success',
        title: 'Employé ajouté',
        text: "L'employé a bien été ajouté.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Erreur lors de l'ajout de l'employé. Veuillez réessayer.",
      });
      console.error('Erreur ajout :', err);
      setMessage('Erreur lors de l’ajout');
    }
  };

  return {
    employes,
    loadingEmployes,
    fetchEmployes,
    popupOpen,
    setPopupOpen,
    nom,
    setNom,
    poste,
    setPoste,
    message,
    handleAddEmploye,
  };
}

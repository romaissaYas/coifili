import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';
import { JOURS_SEMAINE, type HoraireJour } from '@/types/horaire';

/** Gestion des horaires d'ouverture et des créneaux du salon connecté. */
export function useHoraires() {
  const [horaires, setHoraires] = useState<HoraireJour[]>(
    JOURS_SEMAINE.map((jour) => ({
      jour,
      ouvert: false,
      creneaux: [{ debut: '', fin: '' }],
    }))
  );

  const toggleOuvert = (jourIndex: number) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].ouvert = !newHoraires[jourIndex].ouvert;
    setHoraires(newHoraires);
  };

  const ajouterCreneau = (jourIndex: number) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].creneaux.push({ debut: '', fin: '' });
    setHoraires(newHoraires);
  };

  const changerCreneau = (
    jourIndex: number,
    creneauIndex: number,
    champ: 'debut' | 'fin',
    valeur: string
  ) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].creneaux[creneauIndex][champ] = valeur;
    setHoraires(newHoraires);
  };

  const enregistrerHoraires = async () => {
    try {
      // Le salon concerné est déterminé par le serveur à partir du token
      // (voir authMiddleware + requireSalonOwnership côté backend).
      for (const h of horaires) {
        await fetch(`${API_URL}/api/horaires`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            jour: h.jour,
            ouvert: h.ouvert,
            creneaux: h.ouvert ? h.creneaux : [],
          }),
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Horaires enregistrés avec succès !',
        timer: 2000,
        showConfirmButton: true,
      });
    } catch (err) {
      console.error('Erreur enregistrement horaires :', err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Une erreur est survenue lors de l'enregistrement des horaires.",
      });
    }
  };

  const telechargerPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Horaires d'ouverture du salon", 20, 15);

    const tableData = horaires.flatMap((h) => {
      if (!h.ouvert) {
        return [[h.jour, 'Fermé', 'Fermé']];
      }
      return h.creneaux.map((c) => [h.jour, c.debut || '-', c.fin || '-']);
    });

    autoTable(doc, {
      startY: 25,
      head: [['Jour', 'Début', 'Fin']],
      body: tableData,
      styles: {
        fontSize: 12,
        halign: 'center',
      },
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save('horaires-salon.pdf');
  };

  return { horaires, toggleOuvert, ajouterCreneau, changerCreneau, enregistrerHoraires, telechargerPDF };
}

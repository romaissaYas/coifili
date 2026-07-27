import { jsPDF } from 'jspdf';
import type { Paiement } from '@/types/abonnement';

const DA = (v: number | string) => `${Number(v).toLocaleString('fr-FR')} DA`;
const methodeLabel = (m: string) => (m === 'cash' ? 'Espèces' : m === 'cib' ? 'Carte CIB' : m);

/** Génère et télécharge un reçu PDF (jspdf) pour un paiement d'abonnement. */
export function telechargerRecu(paiement: Paiement, salonNom: string, planNom?: string): void {
  const doc = new jsPDF();

  doc.setFontSize(24);
  doc.setTextColor(225, 29, 103); // rose Coifili
  doc.text('Coifili', 20, 22);

  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('Reçu de paiement — Abonnement', 20, 34);

  doc.setDrawColor(230);
  doc.line(20, 40, 190, 40);

  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  let y = 54;
  const ligne = (k: string, v: string) => {
    doc.setTextColor(107, 114, 128);
    doc.text(k, 20, y);
    doc.setTextColor(17, 24, 39);
    doc.text(String(v), 80, y);
    y += 10;
  };

  ligne('Salon', salonNom);
  ligne('Référence', paiement.reference);
  if (planNom) ligne('Plan', planNom);
  ligne('Méthode', methodeLabel(paiement.methode));
  ligne('Montant', DA(paiement.montant));
  ligne('Statut', paiement.statut);
  ligne('Date', new Date(paiement.created_at).toLocaleString('fr-FR'));

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('Coifili — Réservation de salons de beauté en Algérie.', 20, 280);

  doc.save(`recu-${paiement.reference}.pdf`);
}

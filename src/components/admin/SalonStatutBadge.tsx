import type { SalonStatut, PaiementStatut, UserStatut } from '@/types/admin';

export function UserStatutBadge({ statut }: { statut: UserStatut }) {
  const styles = statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {statut === 'actif' ? 'Actif' : 'Suspendu'}
    </span>
  );
}

const SALON_LABELS: Record<SalonStatut, string> = {
  en_attente: 'En attente',
  actif: 'Actif',
  suspendu: 'Suspendu',
  expire: 'Expiré',
};

const SALON_STYLES: Record<SalonStatut, string> = {
  en_attente: 'bg-amber-100 text-amber-700',
  actif: 'bg-green-100 text-green-700',
  suspendu: 'bg-orange-100 text-orange-700',
  expire: 'bg-red-100 text-red-700',
};

export default function SalonStatutBadge({ statut }: { statut: SalonStatut }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SALON_STYLES[statut]}`}>
      {SALON_LABELS[statut]}
    </span>
  );
}

const PAIEMENT_LABELS: Record<PaiementStatut, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  impaye: 'Impayé',
};

const PAIEMENT_STYLES: Record<PaiementStatut, string> = {
  en_attente: 'bg-gray-100 text-gray-600',
  paye: 'bg-green-100 text-green-700',
  impaye: 'bg-red-100 text-red-700',
};

export function PaiementBadge({ statut }: { statut: PaiementStatut }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAIEMENT_STYLES[statut]}`}>
      {PAIEMENT_LABELS[statut]}
    </span>
  );
}

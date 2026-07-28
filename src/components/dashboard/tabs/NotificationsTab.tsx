'use client';

import NotificationCenter, { type CentreNotif, type OptionType, type RawNotifRow } from '@/components/notifications/NotificationCenter';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';

const TYPES: OptionType[] = [
  { value: '', label: 'Tous les types' },
  { value: 'nouvelle_reservation', label: 'Réservation' },
  { value: 'paiement_valide', label: 'Paiement' },
];

// Normalise les lignes salon : une réservation devient un titre/message lisible.
function normaliser(r: RawNotifRow): CentreNotif {
  const base = {
    id: Number(r.id), type: String(r.type ?? ''),
    lien: r.lien != null ? String(r.lien) : null, lu: Number(r.lu), created_at: String(r.created_at ?? ''),
  };
  if (r.type === 'nouvelle_reservation') {
    const dateRdv = r.date_rdv ? new Date(`${r.date_rdv}T00:00:00`).toLocaleDateString('fr-FR') : '';
    const heure = r.heure_rdv ? ` à ${String(r.heure_rdv).slice(0, 5)}` : '';
    const detail = `${r.client_nom || 'Client'}${r.prestation_nom ? ` — ${r.prestation_nom}` : ''}`;
    return { ...base, titre: 'Nouvelle réservation', message: `${detail}${dateRdv ? ` · ${dateRdv}${heure}` : ''}` };
  }
  return { ...base, titre: String(r.titre || 'Notification'), message: String(r.message || '') };
}

export default function NotificationsTab() {
  const centre = useNotificationCenter('/api/notifications', normaliser);
  return (
    <NotificationCenter
      items={centre.items}
      total={centre.total}
      page={centre.page}
      totalPages={centre.totalPages}
      loading={centre.loading}
      typeOptions={TYPES}
      filtres={centre.filtres}
      onFiltre={centre.onFiltre}
      onPage={centre.onPage}
      onLue={centre.onLue}
      onSupprimer={centre.onSupprimer}
      onToutMarquer={centre.onToutMarquer}
    />
  );
}

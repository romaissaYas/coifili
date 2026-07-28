'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NotificationCenter, { type CentreNotif, type OptionType, type RawNotifRow } from '@/components/notifications/NotificationCenter';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';

const TYPES: OptionType[] = [
  { value: '', label: 'Tous les types' },
  { value: 'nouvelle_demande', label: 'Nouvelle demande' },
  { value: 'paiement', label: 'Paiement' },
  { value: 'information', label: 'Information' },
  { value: 'alerte', label: 'Alerte' },
];

// Les notifications admin portent déjà titre/message/lien : mapping direct.
const normaliser = (r: RawNotifRow): CentreNotif => ({
  id: Number(r.id), type: String(r.type ?? ''), titre: String(r.titre ?? ''),
  message: String(r.message ?? ''), lien: r.lien != null ? String(r.lien) : null,
  lu: Number(r.lu), created_at: String(r.created_at ?? ''),
});

export default function AdminNotificationsPage() {
  const router = useRouter();
  const centre = useNotificationCenter('/api/admin/notifications', normaliser);

  const onOuvrir = useCallback((n: CentreNotif) => {
    if (n.lien) router.push(n.lien);
  }, [router]);

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
      onOuvrir={onOuvrir}
    />
  );
}

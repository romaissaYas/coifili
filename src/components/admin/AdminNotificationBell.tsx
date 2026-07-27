'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CreditCard, FileClock, Info } from 'lucide-react';
import { useAdminNotifications, type NotificationAdmin } from '@/hooks/useAdminNotifications';

function tempsRelatif(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'));
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return '';
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function iconePour(type: string) {
  if (type === 'nouvelle_demande') return FileClock;
  if (type === 'paiement') return CreditCard;
  return Info;
}

function Ligne({ n, onOuvrir }: { n: NotificationAdmin; onOuvrir: (n: NotificationAdmin) => void }) {
  const Icone = iconePour(n.type);
  return (
    <button
      onClick={() => onOuvrir(n)}
      className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 ${n.lu ? 'opacity-70' : 'bg-rose-50/40'}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <Icone className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-800">{n.titre}</span>
          <span className="shrink-0 text-[11px] text-gray-400">{tempsRelatif(n.created_at)}</span>
        </span>
        <span className="mt-0.5 block text-sm text-gray-600">{n.message}</span>
      </span>
      {!n.lu && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="Non lue" />}
    </button>
  );
}

export default function AdminNotificationBell() {
  const { notifications, nonLues, loading, marquerLue, marquerToutesLues, charger } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Ouvre la demande concernée (lien) et marque la notification comme lue.
  const ouvrir = (n: NotificationAdmin) => {
    if (!n.lu) marquerLue(n.id);
    if (n.lien) {
      setOpen(false);
      router.push(n.lien);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) charger();
        }}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <Bell size={20} />
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-bold text-gray-800">Notifications</span>
            {nonLues > 0 && (
              <button onClick={marquerToutesLues} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
                <Check className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-400">Aucune notification pour le moment.</p>
            ) : (
              notifications.map((n) => <Ligne key={n.id} n={n} onOuvrir={ouvrir} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

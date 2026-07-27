'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarCheck, Check } from 'lucide-react';
import { useNotifications, type NotificationSalon } from '@/hooks/useNotifications';

const hCourte = (h: string | null) => (h ?? '').slice(0, 5);

function tempsRelatif(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'));
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return '';
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function Ligne({ n, onLue }: { n: NotificationSalon; onLue: (id: number) => void }) {
  const dateRdv = n.date_rdv ? new Date(`${n.date_rdv}T00:00:00`).toLocaleDateString('fr-FR') : '';
  return (
    <button
      onClick={() => !n.lu && onLue(n.id)}
      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${n.lu ? 'opacity-70' : 'bg-rose-50/40'}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <CalendarCheck className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800">Nouvelle réservation</span>
          <span className="shrink-0 text-[11px] text-slate-400">{tempsRelatif(n.created_at)}</span>
        </span>
        <span className="mt-0.5 block truncate text-sm text-slate-600">
          {n.client_nom || 'Client'}{n.prestation_nom ? ` — ${n.prestation_nom}` : ''}
        </span>
        <span className="mt-0.5 block text-xs text-slate-400">
          {dateRdv}{n.heure_rdv ? ` à ${hCourte(n.heure_rdv)}` : ''}
        </span>
      </span>
      {!n.lu && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="Non lue" />}
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, nonLues, loading, marquerLue, marquerToutesLues, charger } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) charger(); // rafraîchit à l'ouverture
        }}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <Bell size={20} />
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            {nonLues > 0 && (
              <button onClick={marquerToutesLues} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
                <Check className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">Aucune notification pour le moment.</p>
            ) : (
              notifications.map((n) => <Ligne key={n.id} n={n} onLue={marquerLue} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

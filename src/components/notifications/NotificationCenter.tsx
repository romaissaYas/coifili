'use client';

import { Bell, Calendar, CreditCard, FileClock, Info, AlertTriangle, Check, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

/** Élément de notification normalisé (commun salon / admin). */
export type CentreNotif = {
  id: number;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  lu: number; // 0 | 1
  created_at: string;
};

export type OptionType = { value: string; label: string };

/** Ligne brute renvoyée par l'API (salon ou admin), avant normalisation. */
export type RawNotifRow = Record<string, string | number | null>;

const ICONES: Record<string, typeof Bell> = {
  nouvelle_reservation: Calendar,
  paiement_valide: CreditCard,
  paiement: CreditCard,
  nouvelle_demande: FileClock,
  abonnement: CreditCard,
  alerte: AlertTriangle,
  information: Info,
};

function fmtDateHeure(iso: string): { date: string; heure: string } {
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return { date: '', heure: '' };
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const TRIS: OptionType[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'ancien', label: 'Plus anciennes' },
];
const STATUTS: OptionType[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'non_lu', label: 'Non lues' },
  { value: 'lu', label: 'Lues' },
];

type Props = {
  items: CentreNotif[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  typeOptions: OptionType[];
  filtres: { q: string; type: string; statut: string; tri: string };
  onFiltre: (champ: 'q' | 'type' | 'statut' | 'tri', valeur: string) => void;
  onPage: (page: number) => void;
  onLue: (id: number) => void;
  onSupprimer: (id: number) => void;
  onToutMarquer: () => void;
  onOuvrir?: (n: CentreNotif) => void;
};

export default function NotificationCenter({
  items, total, page, totalPages, loading, typeOptions, filtres,
  onFiltre, onPage, onLue, onSupprimer, onToutMarquer, onOuvrir,
}: Props) {
  const selectCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={onToutMarquer}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Check className="h-4 w-4" /> Tout marquer comme lu
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={filtres.q}
            onChange={(e) => onFiltre('q', e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent py-2 text-sm outline-none"
            aria-label="Rechercher une notification"
          />
        </div>
        <select value={filtres.type} onChange={(e) => onFiltre('type', e.target.value)} className={selectCls} aria-label="Filtrer par type">
          {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filtres.statut} onChange={(e) => onFiltre('statut', e.target.value)} className={selectCls} aria-label="Filtrer par statut">
          {STATUTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filtres.tri} onChange={(e) => onFiltre('tri', e.target.value)} className={selectCls} aria-label="Trier">
          {TRIS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading && items.length === 0 ? (
        <p className="text-gray-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">Aucune notification.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const Icone = ICONES[n.type] ?? Bell;
            const { date, heure } = fmtDateHeure(n.created_at);
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${n.lu ? 'border-gray-200 bg-white' : 'border-rose-200 bg-rose-50/50'}`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Icone className="h-4 w-4" />
                </span>
                <button
                  onClick={() => { if (!n.lu) onLue(n.id); onOuvrir?.(n); }}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{n.titre}</span>
                    {!n.lu && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-label="Non lue" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-600">{n.message}</span>
                  <span className="mt-1 block text-xs text-gray-400">{date} · {heure}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.lu && (
                    <button onClick={() => onLue(n.id)} aria-label="Marquer comme lue" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => onSupprimer(n.id)} aria-label="Supprimer" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{total} notification{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>
          <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

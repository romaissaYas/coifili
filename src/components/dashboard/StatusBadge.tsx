export type Statut = 'en_attente' | 'confirme' | 'termine' | 'annule';

const LABELS: Record<Statut, string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  termine: 'Terminé',
  annule: 'Annulé',
};

const STYLES: Record<Statut, string> = {
  en_attente: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirme: 'bg-blue-50 text-blue-700 ring-blue-200',
  termine: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  annule: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const DOTS: Record<Statut, string> = {
  en_attente: 'bg-amber-500',
  confirme: 'bg-blue-500',
  termine: 'bg-emerald-500',
  annule: 'bg-slate-400',
};

export default function StatusBadge({ statut }: { statut: Statut }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[statut]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[statut]}`} />
      {LABELS[statut]}
    </span>
  );
}

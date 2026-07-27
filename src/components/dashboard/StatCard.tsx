import type { ReactNode } from 'react';

type Accent = 'rose' | 'blue' | 'green' | 'amber' | 'violet' | 'slate';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  accent?: Accent;
};

const ACCENTS: Record<Accent, string> = {
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function StatCard({ title, value, subtitle, icon, accent = 'rose' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${ACCENTS[accent]}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

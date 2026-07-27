import type { ReactNode } from 'react';

/**
 * Primitives visuelles partagées de l'Espace Coiffure.
 * Purement présentationnel — aucune logique métier ici. Centralise les tokens
 * (rayons, ombres, focus, couleurs de marque) pour garantir la cohérence
 * « SaaS premium » sur tous les onglets sans dupliquer les classes Tailwind.
 */

/** Surface carte standard (bord fin + ombre douce). */
export const CARD = 'rounded-2xl border border-slate-200/70 bg-white shadow-sm';

/** Champ de formulaire (input / select / textarea). */
export const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100';

/** Bouton d'action principal (dégradé de marque). */
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/** Bouton secondaire (contour discret). */
export const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2';

/** En-tête de page unifié : icône + titre + sous-titre + actions à droite. */
export function PageHeading({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Titre de section à l'intérieur d'une carte. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-800">{children}</h3>;
}

/** État vide élégant (bord pointillé). */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

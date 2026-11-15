'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Sous-navigation du module Marketing Instagram. Dashboard et Publications sont
 * actifs (Étape 3) ; les autres sous-menus sont présents mais marqués
 * « Bientôt » tant que leur backend/UI n'est pas livré (étapes suivantes) —
 * afin de ne pas exposer de fonctionnalité inexistante.
 */
const ONGLETS: { href: string; label: string; actif: boolean }[] = [
  { href: '/admin/marketing', label: 'Dashboard', actif: true },
  { href: '/admin/marketing/publications', label: 'Publications', actif: true },
  { href: '/admin/marketing/reels', label: 'Reels', actif: true },
  { href: '/admin/marketing/stories', label: 'Stories', actif: true },
  { href: '/admin/marketing/a-la-une', label: 'Stories à la une', actif: true },
  { href: '/admin/marketing/calendrier', label: 'Calendrier', actif: true },
  { href: '/admin/marketing/media', label: 'Bibliothèque média', actif: true },
  { href: '/admin/marketing/hashtags', label: 'Hashtags', actif: true },
  { href: '/admin/marketing/statistiques', label: 'Statistiques', actif: false },
  { href: '/admin/marketing/parametres', label: 'Paramètres', actif: true },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">📣</span>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Instagram</h1>
      </div>

      <nav className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-200 pb-3">
        {ONGLETS.map((o) => {
          const actif = pathname === o.href;
          if (!o.actif) {
            return (
              <span
                key={o.href}
                className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300"
                title="Bientôt disponible"
              >
                {o.label} <span className="text-[10px]">· bientôt</span>
              </span>
            );
          }
          return (
            <Link
              key={o.href}
              href={o.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                actif ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * En-tête partagé de toutes les pages publiques (accueil, catégories, fiche
 * salon, réservation). Logo + navigation catégories + Connexion / Inscription,
 * toujours visibles. Responsive : menu déroulant sur mobile.
 *
 * Structure : LOGO | Coiffeur · Barbier · Manucure · Institut | Connexion · Inscription
 */
const LIENS = [
  { href: '/coiffeur', label: 'Coiffeur' },
  { href: '/barbier', label: 'Barbier' },
  { href: '/manucure', label: 'Manucure' },
  { href: '/institut', label: 'Institut de Beauté' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-2xl font-extrabold tracking-wider text-rose-600"
          onClick={() => setOpen(false)}
        >
          Coifili
        </Link>

        {/* Navigation catégories (desktop) */}
        <nav className="hidden items-center gap-8 text-[15px] font-semibold text-gray-700 md:flex">
          {LIENS.map((lien) => {
            const active = pathname === lien.href;
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`transition-colors hover:text-rose-500 ${
                  active ? 'text-rose-600' : ''
                }`}
              >
                {lien.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 transition-colors hover:text-rose-600"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-600 hover:to-pink-700 hover:shadow-md"
          >
            Inscription
          </Link>
        </div>

        {/* Bouton menu (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Menu déroulant (mobile) */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {LIENS.map((lien) => {
              const active = pathname === lien.href;
              return (
                <Link
                  key={lien.href}
                  href={lien.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-base font-semibold transition-colors hover:bg-rose-50 hover:text-rose-600 ${
                    active ? 'bg-rose-50 text-rose-600' : 'text-gray-700'
                  }`}
                >
                  {lien.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-rose-300 hover:text-rose-600"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-600 hover:to-pink-700"
            >
              Inscription
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

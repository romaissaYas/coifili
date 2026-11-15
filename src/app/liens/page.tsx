import type { Metadata } from 'next';
import { Scissors, CalendarCheck, HelpCircle, Instagram } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Liens Coifili',
  description: 'Réservez votre salon de coiffure et beauté en Algérie, ou inscrivez votre salon sur Coifili.',
  alternates: { canonical: '/liens' },
};

// Paramètres de suivi : permettent d'attribuer le trafic issu de la bio Instagram.
const UTM = '?utm_source=instagram&utm_medium=bio&utm_campaign=lien_bio';

const LIENS = [
  {
    href: `/salons${UTM}`,
    icon: CalendarCheck,
    titre: 'Réserver un salon',
    sous: 'Coiffeur · Barbier · Institut · Manucure',
    principal: true,
  },
  {
    href: `/confidentialite${UTM}`,
    icon: HelpCircle,
    titre: 'FAQ & Confidentialité',
    sous: 'Vos questions, vos données',
    principal: false,
  },
];

export default function LiensPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-rose-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* En-tête de marque */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
            <Scissors size={30} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">Coifili</h1>
          <p className="mt-1 text-sm text-gray-500">
            Réserve ton salon beauté en Algérie — gratuit &amp; en 2 min ✂️
          </p>
        </div>

        {/* Liens */}
        <nav className="space-y-3" aria-label="Liens Coifili">
          {LIENS.map((l) => {
            const Icone = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                  l.principal
                    ? 'border-transparent bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-rose-200'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    l.principal ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <Icone size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{l.titre}</span>
                  <span className={`block text-xs ${l.principal ? 'text-white/80' : 'text-gray-400'}`}>{l.sous}</span>
                </span>
              </a>
            );
          })}
        </nav>

        {/* Réseaux */}
        <div className="mt-8 flex items-center justify-center gap-4 text-gray-400">
          <a
            href="https://www.instagram.com/coifili_plateforme/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Coifili sur Instagram"
            className="rounded-full p-2 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Instagram size={22} />
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">© {new Date().getFullYear()} Coifili · Algérie 🇩🇿</p>
      </div>
    </main>
  );
}

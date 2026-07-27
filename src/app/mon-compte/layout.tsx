'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClientGuard } from '@/hooks/useClientGuard';

export default function MonCompteLayout({ children }: { children: React.ReactNode }) {
  const user = useClientGuard();
  const router = useRouter();
  const pathname = usePathname();

  const deconnexion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-rose-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  const onglets = [
    { href: '/mon-compte', label: 'Mes rendez-vous' },
    { href: '/mon-compte/profil', label: 'Mon profil' },
    { href: '/mon-compte/confidentialite', label: 'Confidentialité' },
  ];

  return (
    <div className="min-h-screen bg-rose-50">
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-rose-600 tracking-wider">
            Coifili
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-gray-600">Bonjour {user.firstName}</span>
            <button onClick={deconnexion} className="text-gray-700 hover:text-rose-600 font-medium">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <nav className="flex gap-2 mb-6">
          {onglets.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === o.href ? 'bg-rose-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {o.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}

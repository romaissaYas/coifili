'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  UserPlus,
  CreditCard,
  Users,
  Contact,
  CalendarCheck,
  BarChart3,
  ScrollText,
  Settings,
  Bell,
  Megaphone,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

const LIENS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/salons', label: 'Salons', icon: Store },
  { href: '/admin/inscriptions', label: 'Inscriptions', icon: UserPlus },
  { href: '/admin/abonnements', label: 'Abonnements', icon: CreditCard },
  { href: '/admin/clients', label: 'Utilisateurs', icon: Users },
  { href: '/admin/employes', label: 'Employés', icon: Contact },
  { href: '/admin/reservations', label: 'Réservations', icon: CalendarCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/journal', label: "Journal d'activité", icon: ScrollText },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const estActif = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  function deconnexion() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  }

  return (
    <>
      {/* Barre mobile */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <span className="text-xl font-extrabold tracking-wider text-rose-600">Coifili Admin</span>
        <div className="flex items-center gap-1">
          <AdminNotificationBell />
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="rounded-lg p-2 hover:bg-gray-100">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <aside
        className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-r border-gray-200 bg-white md:sticky md:top-0 md:block md:h-screen md:w-64`}
      >
        <div className="hidden px-6 py-5 md:block">
          <span className="text-2xl font-extrabold tracking-wider text-rose-600">Coifili</span>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Administration</p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {LIENS.map((lien) => {
            const Icon = lien.icon;
            const actif = estActif(lien.href, lien.exact);
            return (
              <Link
                key={lien.href}
                href={lien.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  actif ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {lien.label}
              </Link>
            );
          })}

          {/* Déconnexion : tout en bas du menu, juste après « Paramètres ». */}
          <button
            onClick={deconnexion}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </button>
        </nav>
      </aside>
    </>
  );
}

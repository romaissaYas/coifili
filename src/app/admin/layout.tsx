'use client';

import { useAdminGuard } from '@/hooks/useAdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const status = useAdminGuard();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        {"Vérification de l'accès…"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1">
        {/* En-tête desktop : cloche de notifications (comme l'Espace Coiffure).
            Sur mobile, la cloche reste dans la barre supérieure de la sidebar. */}
        <header className="hidden items-center justify-end border-b border-gray-200 bg-white px-8 py-3 md:flex">
          <AdminNotificationBell />
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

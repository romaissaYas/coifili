'use client';

import { useAdminGuard } from '@/hooks/useAdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

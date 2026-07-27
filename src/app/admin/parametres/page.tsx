'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { abonnementActions } from '@/lib/adminActions';
import type { UserData } from '@/types/user';

export default function AdminParametresPage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Paramètres</h1>

      <section className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Compte administrateur</h2>
        {user ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Nom</dt><dd className="font-medium text-gray-900">{user.firstName} {user.lastName}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Rôle</dt><dd className="font-medium text-rose-600">Super administrateur</dd></div>
          </dl>
        ) : (
          <p className="text-gray-500">…</p>
        )}
        <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
          Le mot de passe se change via <code>ADMIN_PASSWORD</code> dans <code>bsed/.env</code> puis <code>npm run seed:admin</code>.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Abonnements</h2>
        <p className="mb-4 text-sm text-gray-500">
          Le traitement s&apos;exécute automatiquement chaque jour (03:00). Vous pouvez aussi le lancer
          maintenant : expiration des abonnements dépassés et envoi des alertes.
        </p>
        <button
          onClick={() => abonnementActions.runJob(() => {})}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-pink-700"
        >
          <RefreshCw className="h-4 w-4" /> Traiter les abonnements maintenant
        </button>
      </section>
    </div>
  );
}

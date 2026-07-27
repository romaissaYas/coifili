'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/apiConfig';

function ReinitialiserForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Lien invalide : jeton manquant.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.details?.newPassword || 'La réinitialisation a échoué.');
        return;
      }
      setMessage(data.message);
    } catch {
      setError('Erreur serveur. Veuillez réessayer plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-600 mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

        {message ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">{message}</div>
            <Link
              href="/login"
              className="block w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-lg"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
            >
              {submitting ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-center text-gray-600">
          <Link href="/login" className="text-rose-600 underline">Revenir à la connexion</Link>
        </p>
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-rose-50 text-gray-500">Chargement…</div>}>
      <ReinitialiserForm />
    </Suspense>
  );
}

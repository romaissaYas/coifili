'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/apiConfig';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details?.email ? `L'email ${data.details.email}` : data.error || 'Veuillez saisir un email valide.');
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
        <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-gray-600 mb-6">
          Saisissez l&apos;email de votre compte : nous vous enverrons un lien de réinitialisation.
        </p>

        {message ? (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
            >
              {submitting ? 'Envoi...' : 'Envoyer le lien'}
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

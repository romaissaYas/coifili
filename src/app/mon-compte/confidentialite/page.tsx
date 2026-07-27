'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '@/lib/apiConfig';
import { getAuthHeaders } from '@/lib/authHeaders';

/**
 * Espace RGPD (loi 18-07) en self-service pour le compte client :
 *  - droit d'accès / portabilité : téléchargement des données au format JSON ;
 *  - droit à l'effacement : suppression définitive du compte (confirmée par le
 *    mot de passe), avec anonymisation des réservations côté serveur.
 */
export default function ConfidentialitePage() {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const telecharger = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/me/export`, { headers: getAuthHeaders() });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-coifili.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      Swal.fire({ icon: 'error', title: 'Erreur', text: message || 'Le téléchargement a échoué.' });
    } finally {
      setDownloading(false);
    }
  };

  const supprimer = async () => {
    const { value: password } = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer définitivement votre compte ?',
      html: 'Cette action est <strong>irréversible</strong>. Saisissez votre mot de passe pour confirmer.',
      input: 'password',
      inputPlaceholder: 'Votre mot de passe',
      inputAttributes: { autocomplete: 'current-password' },
      showCancelButton: true,
      confirmButtonText: 'Supprimer mon compte',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      preConfirm: (v) => {
        if (!v) Swal.showValidationMessage('Le mot de passe est requis.');
        return v;
      },
    });
    if (!password) return;

    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/users/me`, { headers: getAuthHeaders(), data: { password } });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await Swal.fire({ icon: 'success', title: 'Compte supprimé', timer: 1800, showConfirmButton: false });
      router.push('/');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      Swal.fire({ icon: 'error', title: 'Erreur', text: message || 'La suppression a échoué.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Confidentialité et données personnelles</h1>
      <p className="mb-6 text-sm text-gray-600">
        Conformément à la loi n° 18-07, vous pouvez accéder à vos données et demander leur effacement.
        Consultez notre{' '}
        <Link href="/confidentialite" className="text-rose-600 hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>

      <section className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Télécharger mes données</h2>
        <p className="mt-1 text-sm text-gray-600">
          Obtenez une copie de vos informations (profil, réservations) au format JSON.
        </p>
        <button
          onClick={telecharger}
          disabled={downloading}
          className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {downloading ? 'Préparation…' : 'Télécharger (JSON)'}
        </button>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-semibold text-red-800">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-red-700">
          Suppression <strong>définitive</strong> de votre compte. Vos réservations passées sont
          conservées de façon anonymisée pour les salons concernés.
        </p>
        <button
          onClick={supprimer}
          disabled={deleting}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {deleting ? 'Suppression…' : 'Supprimer mon compte'}
        </button>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useProfil } from '@/hooks/useProfil';

export default function ProfilPage() {
  const { profil, loading, updateProfil, changePassword } = useProfil();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [savingProfil, setSavingProfil] = useState(false);
  const [errorProfil, setErrorProfil] = useState<string | null>(null);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [errorPwd, setErrorPwd] = useState<string | null>(null);

  useEffect(() => {
    if (profil) {
      setForm({ firstName: profil.firstName, lastName: profil.lastName, email: profil.email, phone: profil.phone });
    }
  }, [profil]);

  const enregistrerProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProfil(null);
    setSavingProfil(true);
    const err = await updateProfil(form);
    setSavingProfil(false);
    if (err) {
      setErrorProfil(err);
      return;
    }
    Swal.fire({ icon: 'success', title: 'Profil mis à jour', timer: 1500, showConfirmButton: false });
  };

  const enregistrerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPwd(null);
    if (pwd.newPassword.length < 6) {
      setErrorPwd('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setErrorPwd('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSavingPwd(true);
    const err = await changePassword(pwd.currentPassword, pwd.newPassword);
    setSavingPwd(false);
    if (err) {
      setErrorPwd(err);
      return;
    }
    setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    Swal.fire({ icon: 'success', title: 'Mot de passe mis à jour', timer: 1500, showConfirmButton: false });
  };

  if (loading) return <p className="text-gray-500">Chargement du profil...</p>;
  if (!profil) return <p className="text-red-600">Impossible de charger votre profil.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {/* Informations personnelles */}
      <form onSubmit={enregistrerProfil} className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h2>
        {errorProfil && <div className="mb-3 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{errorProfil}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Prénom"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <input
            placeholder="Nom"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <input
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={savingProfil}
          className="mt-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg"
        >
          {savingProfil ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      {/* Mot de passe */}
      <form onSubmit={enregistrerMotDePasse} className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>
        {errorPwd && <div className="mb-3 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{errorPwd}</div>}
        <div className="grid grid-cols-1 gap-3 max-w-md">
          <input
            type="password"
            placeholder="Mot de passe actuel"
            value={pwd.currentPassword}
            onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={pwd.newPassword}
            onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={pwd.confirm}
            onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={savingPwd}
          className="mt-4 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg"
        >
          {savingPwd ? 'Enregistrement...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
}

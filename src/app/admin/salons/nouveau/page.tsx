'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import { adminApi } from '@/lib/adminApi';
import { API_URL } from '@/lib/apiConfig';
import { WILAYAS } from '@/lib/wilayas';
import { communesDeWilaya } from '@/lib/communes';
import ImageUpload from '@/components/common/ImageUpload';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s-]{6,20}$/;

const aujourdhui = new Date().toISOString().slice(0, 10);
const dansUnAn = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();

type Form = Record<string, string>;

const INITIAL: Form = {
  nom: '', image: '', description: '', categorie: 'coiffeur', type: 'femme',
  wilaya: '', ville: '', adresse: '', telephone: '', email: '',
  ownerFirstName: '', ownerLastName: '', ownerEmail: '', ownerPhone: '',
  password: '', passwordConfirm: '',
  abonnement_debut: aujourdhui, abonnement_fin: dansUnAn, statut: 'actif',
};

function Champ({
  label, value, onChange, error, type = 'text', placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-400 ${error ? 'border-red-400' : 'border-gray-200'}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function NouveauSalonPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const er: Record<string, string> = {};
    if (!form.nom.trim()) er.nom = 'Le nom du salon est requis.';
    if (!EMAIL_RE.test(form.email)) er.email = 'Email du salon invalide.';
    if (!PHONE_RE.test(form.telephone)) er.telephone = 'Téléphone invalide.';
    if (!form.wilaya.trim()) er.wilaya = 'Wilaya requise.';
    if (!form.ville.trim()) er.ville = 'Ville requise.';
    if (!form.ownerFirstName.trim()) er.ownerFirstName = 'Prénom requis.';
    if (!form.ownerLastName.trim()) er.ownerLastName = 'Nom requis.';
    if (!EMAIL_RE.test(form.ownerEmail)) er.ownerEmail = 'Email propriétaire invalide.';
    if (!PHONE_RE.test(form.ownerPhone)) er.ownerPhone = 'Téléphone invalide.';
    if (form.password.length < 6) er.password = 'Au moins 6 caractères.';
    if (form.password !== form.passwordConfirm) er.passwordConfirm = 'Les mots de passe ne correspondent pas.';
    if (!form.abonnement_debut) er.abonnement_debut = 'Date de début requise.';
    if (!form.abonnement_fin) er.abonnement_fin = 'Date de fin requise.';
    if (form.abonnement_fin && form.abonnement_debut && form.abonnement_fin < form.abonnement_debut) {
      er.abonnement_fin = 'La date de fin doit être postérieure au début.';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adminApi.createSalon(form);
      await Swal.fire({ icon: 'success', title: 'Le salon a été créé avec succès.', timer: 1500, showConfirmButton: false });
      router.push('/admin/salons');
    } catch (err) {
      await Swal.fire({ icon: 'error', title: 'Erreur', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  const selectCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400';
  const card = 'rounded-xl bg-white p-6 shadow-md';

  return (
    <div className="max-w-4xl">
      <Link href="/admin/salons" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600">
        <ArrowLeft className="h-4 w-4" /> Retour aux salons
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Nouveau salon</h1>

      <form onSubmit={submit} className="space-y-6">
        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Informations du salon</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ label="Nom du salon *" value={form.nom} onChange={set('nom')} error={errors.nom} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Logo / Image du salon</label>
              <ImageUpload
                value={form.image}
                onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                endpoint={`${API_URL}/api/uploads/salon-image`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Catégorie *</label>
              <select value={form.categorie} onChange={set('categorie')} className={selectCls}>
                <option value="coiffeur">Coiffeur</option>
                <option value="barbier">Barbier</option>
                <option value="manucure">Manucure</option>
                <option value="institut">Institut</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
              <select value={form.type} onChange={set('type')} className={selectCls}>
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Wilaya *</label>
              <select
                value={form.wilaya}
                onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value, ville: '' }))}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-400 ${errors.wilaya ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Sélectionner…</option>
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.nom}>{w.code.toString().padStart(2, '0')} — {w.nom}</option>
                ))}
              </select>
              {errors.wilaya && <p className="mt-1 text-xs text-red-500">{errors.wilaya}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ville *</label>
              <select
                value={form.ville}
                onChange={set('ville')}
                disabled={!form.wilaya}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-400 disabled:bg-gray-100 ${errors.ville ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">{form.wilaya ? 'Sélectionner…' : 'Choisir une wilaya'}</option>
                {communesDeWilaya(form.wilaya).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.ville && <p className="mt-1 text-xs text-red-500">{errors.ville}</p>}
            </div>
            <Champ label="Adresse" value={form.adresse} onChange={set('adresse')} />
            <Champ label="Téléphone *" value={form.telephone} onChange={set('telephone')} error={errors.telephone} />
            <Champ label="Email *" value={form.email} onChange={set('email')} error={errors.email} />
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Propriétaire</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ label="Prénom *" value={form.ownerFirstName} onChange={set('ownerFirstName')} error={errors.ownerFirstName} />
            <Champ label="Nom *" value={form.ownerLastName} onChange={set('ownerLastName')} error={errors.ownerLastName} />
            <Champ label="Email *" value={form.ownerEmail} onChange={set('ownerEmail')} error={errors.ownerEmail} />
            <Champ label="Téléphone *" value={form.ownerPhone} onChange={set('ownerPhone')} error={errors.ownerPhone} />
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Compte & abonnement</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ label="Mot de passe temporaire *" type="password" value={form.password} onChange={set('password')} error={errors.password} />
            <Champ label="Confirmation *" type="password" value={form.passwordConfirm} onChange={set('passwordConfirm')} error={errors.passwordConfirm} />
            <Champ label="Début d'abonnement *" type="date" value={form.abonnement_debut} onChange={set('abonnement_debut')} error={errors.abonnement_debut} />
            <Champ label="Fin d'abonnement *" type="date" value={form.abonnement_fin} onChange={set('abonnement_fin')} error={errors.abonnement_fin} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select value={form.statut} onChange={set('statut')} className={selectCls}>
                <option value="actif">Actif</option>
                <option value="en_attente">En attente</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-rose-600 hover:to-pink-700 disabled:opacity-60"
          >
            {submitting ? 'Création…' : 'Créer le salon'}
          </button>
          <Link href="/admin/salons" className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

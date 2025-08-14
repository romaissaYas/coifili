'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: '',
  });
  const [salonForm, setSalonForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    wilaya: '',
    ville: '',
    type: '',
    categorie: '',
    image: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSalonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSalonForm({ ...salonForm, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (Object.values(form).some(v => !v)) return 'Veuillez remplir tous les champs.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email invalide.';
    if (form.password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    if (!['coiffeur', 'user'].includes(form.userType)) return 'Type d’utilisateur invalide.';
    // Validation salon si coiffeur
    if (form.userType === 'coiffeur' && Object.values(salonForm).some(v => !v)) return 'Veuillez remplir tous les champs du salon.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const bodyToSend = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        userType: form.userType,
        salonData: form.userType === 'coiffeur' ? salonForm : undefined
      };

      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        Swal.fire({
          icon: 'success',
          title: 'Compte créé avec succès 🎉',
          text: 'Bienvenue sur Coifili !',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/login');
        });
      } else {
        setError(data.error || data.message || 'Erreur lors de l’inscription.');
      }
    } catch (err) {
      setError('Erreur serveur. Réessayez plus tard.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <h1 className="text-3xl font-bold mb-6">
          Créez votre compte sur <span className="text-pink-600">Coifili</span>
        </h1>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input name="firstName" type="text" placeholder="Prénom *"
              className="w-1/2 border border-gray-300 rounded px-4 py-2"
              value={form.firstName} onChange={handleChange} />
            <input name="lastName" type="text" placeholder="Nom *"
              className="w-1/2 border border-gray-300 rounded px-4 py-2"
              value={form.lastName} onChange={handleChange} />
          </div>

          <input name="email" type="email" placeholder="Email *"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={form.email} onChange={handleChange} />

          <input name="phone" type="tel" placeholder="Téléphone *"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={form.phone} onChange={handleChange} />

          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe *"
              className="w-full border border-gray-300 rounded px-4 py-2"
              value={form.password} onChange={handleChange} />
            <button type="button"
              className="absolute right-3 top-2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <input name="confirmPassword" type={showPassword ? 'text' : 'password'}
            placeholder="Confirmer le mot de passe *"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={form.confirmPassword} onChange={handleChange} />

          <select name="userType"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={form.userType} onChange={handleChange}>
            <option value="">Sélectionnez un type *</option>
            <option value="user">Utilisateur</option>
            <option value="coiffeur">Coiffeur</option>
          </select>

          {/* Formulaire salon pour coiffeur */}
          {form.userType === 'coiffeur' && (
            <div className="mt-4 p-4 border rounded">
              <h2 className="text-xl font-bold mb-2">Informations du salon</h2>

              <input name="nom" placeholder="Nom du salon *" value={salonForm.nom} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="email" placeholder="Email du salon *" value={salonForm.email} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="telephone" placeholder="Téléphone du salon *" value={salonForm.telephone} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="wilaya" placeholder="Wilaya *" value={salonForm.wilaya} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="ville" placeholder="Ville *" value={salonForm.ville} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="type" placeholder="Type *" value={salonForm.type} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="categorie" placeholder="Catégorie *" value={salonForm.categorie} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="image" placeholder="Image *" value={salonForm.image} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
              <input name="message" placeholder="Message" value={salonForm.message} onChange={handleSalonChange} className="w-full border p-2 rounded mb-2" />
            </div>
          )}

          <button type="submit"
            className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700 transition">
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Déjà un compte ? <a href="/login" className="text-pink-600 underline">Se connecter</a>
        </p>
      </div>

      <div className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/img/bg1.jpg")' }} />
    </div>
  );
}

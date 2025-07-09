'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'coufer' | 'user' | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !userType) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer un email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!['coufer', 'user'].includes(userType)) {
      setError('Veuillez sélectionner un type d’utilisateur valide.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/la page li ydgholalha ki yconicti');
      } else {
        setError(data.error || 'Erreur lors de l’inscription.');
      }
    } catch (err) {
      setError('Erreur serveur. Veuillez réessayer plus tard.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Partie gauche */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <h1 className="text-3xl font-bold mb-6">
          Créez votre compte sur <span className="text-pink-600">Coifili</span>
        </h1>
        {error && <div className="text-red-500 mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block mb-1 font-medium" htmlFor="firstName">
                Prénom *
              </label>
              <input
                id="firstName"
                type="text"
                className={`w-full border ${error.includes('champs') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="w-1/2">
              <label className="block mb-1 font-medium" htmlFor="lastName">
                Nom *
              </label>
              <input
                id="lastName"
                type="text"
                className={`w-full border ${error.includes('champs') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
                placeholder="Votre nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              className={`w-full border ${error.includes('email') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="password">
              Mot de passe *
            </label>
            <input
              id="password"
              type="password"
              className={`w-full border ${error.includes('mot de passe') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="confirmPassword">
              Confirmer le mot de passe *
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={`w-full border ${error.includes('mot de passe') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
              placeholder="Confirmez le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div
            className="block mb-1 font-medium"
          
          >
              <label className="block mb-1 font-medium" htmlFor="confirmPassword">
            Type d’utilisateur *
          </label>
          <select
            id="userType"
            className={`w-full border ${error.includes('type d’utilisateur') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
            value={userType}
            onChange={(e) => setUserType(e.target.value as 'coufer' | 'user')}
            required
            aria-required="true"
          >
            <option value="" disabled>
              Sélectionnez un type
            </option>
            Ascending
            <option value="user">Utilisateur</option>
            <option value="coufer">Coufer</option>
          </select>
  </div>
          <button
            type="submit"
            className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700 transition"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Déjà un compte ?{' '}
          <a href="/login" className="text-pink-600 underline">
            Se connecter
          </a>
        </p>
      </div>

      {/* Partie droite avec image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/img/bg1.jpg")' }}
      />
    </div>
  );
}

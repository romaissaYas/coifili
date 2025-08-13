'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer un email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store JWT token (e.g., in localStorage) si users rederiger vers site sinon si ciffer rederiger vers espace coiffer 
        localStorage.setItem('token', data.token);



          if (data.userType === 'coiffeur') {
    router.push('/pagedecoufer'); // page pour les coiffeurs
  } else {
    router.push('/'); // ou `http://localhost:3000` pour les utilisateurs classiques
  }
      } else {
        setError(data.error || 'Erreur lors de la connexion.');
      }
    } catch (err) {
      setError('Erreur serveur. Veuillez réessayer plus tard.');
    }
  };

  const handleRegister = () => {
    router.push('/inscription');
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Partie gauche */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <h1 className="text-3xl font-bold mb-6">
          Bienvenue sur <span className="text-pink-600">Coifili</span>
        </h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email *</label>
            <input
              type="email"
              className={`w-full border ${error.includes('email') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Mot de passe *</label>
            <input
              type="password"
              className={`w-full border ${error.includes('mot de passe') ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2`}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <a href="/forgot-password" className="text-sm text-pink-600 underline">
            Mot de passe oublié ?
          </a>
          <button
            type="submit"
            className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700 transition"
          >
            Se connecter
          </button>
        </form>
        <div className="my-6 text-center text-gray-500">ou</div>
        <button
          onClick={handleRegister}
          className="border w-full py-2 rounded hover:bg-gray-100 transition"
        >
          Créer mon compte
        </button>
      </div>

      {/* Partie droite avec image */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/img/bg1.jpg")' }}
      />
    </div>
  );
}














// app/pro-register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProRegisterPage() {
  const router = useRouter();
  const [salonName, setSalonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!salonName || !email || !phone) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      // Simulate sending request to sales team (replace with actual API call)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonName, email, phone, message }),
      });
      router.push('/espacecoiffeur'); // Redirect to a thank-you page
    } catch (err) {
      setError('Erreur lors de l’envoi. Veuillez réessayer.');
    }
  };

  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <h1 className="text-3xl font-bold mb-6">
          Inscrivez votre salon sur <span className="text-pink-600">Coifili</span>
        </h1>
        {error && <div className="text-red-500 mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium" htmlFor="salonName">
              Nom du salon *
            </label>
            <input
              id="salonName"
              type="text"
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="Nom de votre salon"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="phone">
              Téléphone *
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="Votre numéro de téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium" htmlFor="message">
              Message (facultatif)
            </label>
            <textarea
              id="message"
              className="w-full border border-gray-300 rounded px-4 py-2"
              placeholder="Dites-nous en plus..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700 transition"
          >
            Demander une démo
          </button>
        </form>
      </div>
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/img/bg1.jpg")' }}
      />
    </div>
  );
}
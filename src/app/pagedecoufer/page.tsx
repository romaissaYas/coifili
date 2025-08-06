// app/pro-register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';


export default function ProRegisterPage() {
  const router = useRouter();
const [nom, setNom] = useState('');
const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
const [wilaya, setWilaya] = useState('');
const [ville, setVille] = useState('');
const [categorie, setCategorie] = useState('');
const [type, setType] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

if (!nom || !email || !telephone || !wilaya || !ville || !categorie || !type) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      // Simulate sending request to sales team (replace with actual API call)
      await fetch(`http://localhost:5000/api/salons`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    nom,
    email,
    telephone,
    message,
    wilaya,
    ville,
    type,
    categorie,
  }),
}); 
Swal.fire({
  icon: 'success',
  title: 'Salon enregistré !',
  text: 'Votre salon a bien été enregistré.',
  confirmButtonColor: '#d63384', // rose
}).then(() => {
});

    } catch (err) {
      Swal.fire({
  icon: 'error',
  title: 'Erreur',
  text: 'Erreur lors de l’envoi. Veuillez réessayer.',
  confirmButtonColor: '#d63384',
});
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
              value={nom}
              onChange={(e) => setNom(e.target.value)}
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
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
            />
          </div>
   
          <div>
  <label className="block mb-1 font-medium" htmlFor="wilaya">
    Wilaya *
  </label>
  <input
    id="wilaya"
    type="text"
    className="w-full border border-gray-300 rounded px-4 py-2"
    placeholder="Ex : Alger"
    value={wilaya}
    onChange={(e) => setWilaya(e.target.value)}
    required
  />
</div>

<div>
  <label className="block mb-1 font-medium" htmlFor="ville">
    Ville *
  </label>
  <input
    id="ville"
    type="text"
    className="w-full border border-gray-300 rounded px-4 py-2"
    placeholder="Ex : Bab Ezzouar"
    value={ville}
    onChange={(e) => setVille(e.target.value)}
    required
  />
</div>

<div>
  <label className="block mb-1 font-medium" htmlFor="categorie">
    Catégorie *
  </label>
  <select
    id="categorie"
    className="w-full border border-gray-300 rounded px-4 py-2"
    value={categorie}
    onChange={(e) => setCategorie(e.target.value)}
    required
  >
    <option value="">Sélectionner une catégorie</option>
    <option value="institut">Institut</option>
    <option value="barbier">Barbier</option>
    <option value="coiffeur">Coiffeur</option>
  </select>
</div>

<div>
  <label className="block mb-1 font-medium" htmlFor="type">
    Type *
  </label>
  <select
    id="type"
    className="w-full border border-gray-300 rounded px-4 py-2"
    value={type}
    onChange={(e) => setType(e.target.value)}
    required
  >
    <option value="">Sélectionner un type</option>
    <option value="homme">Homme</option>
    <option value="femme">Femme</option>
  </select>
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
  Enregistrer
</button>

         
        </form>
         <button
             onClick={() => router.push('/espacecoiffeur')}
            className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700 transition"
          >
        allez a l'espace coiffeur 
          </button>
      </div>
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: 'url("/img/bg1.jpg")' }}
      />
    </div>
  );
}
// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [salon, setSalon] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    photos: [],
    hours: { monday: { open: '09:00', close: '18:00' } }, // Simplified
  });
  const [services, setServices] = useState([{ name: '', duration: 0, price: 0 }]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
    // Fetch existing salon data (if any)
    fetchSalonData();
  }, [router]);

  const fetchSalonData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSalon(data.salon);
        setServices(data.services || [{ name: '', duration: 0, price: 0 }]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/salons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ salon, services }),
      });
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError('Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      setError('Erreur serveur.');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Gérer votre salon</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <div>
          <label className="block mb-1 font-medium">Nom du salon *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={salon.name}
            onChange={(e) => setSalon({ ...salon, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Adresse *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={salon.address}
            onChange={(e) => setSalon({ ...salon, address: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Téléphone *</label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={salon.phone}
            onChange={(e) => setSalon({ ...salon, phone: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded px-4 py-2"
            value={salon.description}
            onChange={(e) => setSalon({ ...salon, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Services</label>
          {services.map((service, index) => (
            <div key={index} className="flex gap-4 mb-2">
              <input
                type="text"
                placeholder="Nom du service"
                className="w-1/3 border border-gray-300 rounded px-4 py-2"
                value={service.name}
                onChange={(e) => {
                  const newServices = [...services];
                  newServices[index].name = e.target.value;
                  setServices(newServices);
                }}
              />
              <input
                type="number"
                placeholder="Durée (min)"
                className="w-1/3 border border-gray-300 rounded px-4 py-2"
                value={service.duration}
                onChange={(e) => {
                  const newServices = [...services];
                  newServices[index].duration = Number(e.target.value);
                  setServices(newServices);
                }}
              />
              <input
                type="number"
                placeholder="Prix (€)"
                className="w-1/3 border border-gray-300 rounded px-4 py-2"
                value={service.price}
                onChange={(e) => {
                  const newServices = [...services];
                  newServices[index].price = Number(e.target.value);
                  setServices(newServices);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setServices([...services, { name: '', duration: 0, price: 0 }])}
            className="text-pink-600 underline"
          >
            Ajouter un service
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-pink-600 text-white font-semibold py-2 rounded hover:bg-pink-700"
        >
          Sauvegarder
        </button>
      </form>
    </div>
  );
}
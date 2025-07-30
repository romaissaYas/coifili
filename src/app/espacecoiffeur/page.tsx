'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Scissors,
  Clock,
  User,
  Star,
  Settings,
  LayoutDashboard,
  Users,
  Plus,
} from 'lucide-react';

export default function EspaceCoiffeur() {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [prestations, setPrestations] = useState([
    { nom: 'Coupe', prix: 2000 },
    { nom: 'Brushing', prix: 1500 },
    { nom: 'Coloration', prix: 3000 },
  ]);
  const [newPrestation, setNewPrestation] = useState({ nom: '', prix: '' });

  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard' },
    { name: 'Agenda', icon: <CalendarDays size={20} />, key: 'agenda' },
    { name: 'Prestations', icon: <Scissors size={20} />, key: 'prestations' },
    { name: 'Horaires', icon: <Clock size={20} />, key: 'horaires' },
    { name: 'Profil', icon: <User size={20} />, key: 'profil' },
    { name: 'Avis', icon: <Star size={20} />, key: 'avis' },
    { name: 'Paramètres', icon: <Settings size={20} />, key: 'parametres' },
    { name: 'Employés', icon: <Users size={20} />, key: 'employes' },
  ];

  const appointments = [
    { date: '2025-07-27', heure: '10:00', client: 'Sarah', prestation: 'Brushing', montant: 2500 },
    { date: '2025-07-27', heure: '14:00', client: 'Nour', prestation: 'Coupe', montant: 3000 },
    { date: '2025-07-26', heure: '16:00', client: 'Sami', prestation: 'Coloration', montant: 5000 },
  ];

  const filteredAppointments = selectedDate
    ? appointments.filter((r) => r.date === selectedDate)
    : [];

  const revenusParJour = filteredAppointments.reduce((sum, rdv) => sum + rdv.montant, 0);
  const revenusParMois = appointments.reduce((sum, rdv) => sum + rdv.montant, 0);

  const handleAddPrestation = () => {
    if (!newPrestation.nom || !newPrestation.prix) return;
    setPrestations([...prestations, { ...newPrestation, prix: Number(newPrestation.prix) }]);
    setNewPrestation({ nom: '', prix: '' });
    setShowAddPopup(false);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 via-rose-100 to-purple-100">
      <aside className="w-64 bg-white border-r shadow-lg p-6 hidden md:block">
        <h2 className="text-3xl font-extrabold text-rose-600 mb-8 tracking-tight">Espace Coiffeur</h2>
        <nav className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center px-5 py-3 rounded-xl hover:bg-rose-100 transition text-left text-base font-medium shadow-sm ${
                activeTab === tab.key ? 'bg-rose-200 text-rose-900 shadow-inner' : 'text-gray-700'
              }`}
            >
              <span className="mr-3">{tab.icon}</span> {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-10">
        {activeTab === 'dashboard' && (
          <>
            <h1 className="text-4xl font-bold text-rose-700 mb-8">Tableau de bord</h1>
            <div className="mb-6">
              <label className="block text-gray-600 font-medium mb-2">Sélectionner une date :</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded-xl shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Revenus du jour</h3>
                <p className="text-3xl font-bold text-rose-700">
                  {selectedDate ? `${revenusParJour} DA` : 'Sélectionnez une date'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Revenus ce mois</h3>
                <p className="text-3xl font-bold text-rose-700">{revenusParMois} DA</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Total rendez-vous</h3>
                <p className="text-3xl font-bold text-rose-700">{appointments.length}</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'agenda' && (
          <>
            <h1 className="text-4xl font-bold text-rose-700 mb-6">Agenda</h1>
            <div className="space-y-4">
              {appointments.map((rdv, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{rdv.client}</p>
                    <p className="text-sm text-gray-500">{rdv.date} à {rdv.heure}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{rdv.prestation}</p>
                    <p className="text-lg text-rose-600 font-bold">{rdv.montant} DA</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'prestations' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-rose-700">Prestations</h1>
              <button
                onClick={() => setShowAddPopup(true)}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl shadow"
              >
                <Plus size={18} /> Ajouter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prestations.map((prestation, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="text-lg font-bold text-gray-800">{prestation.nom}</h3>
                  <p className="text-rose-600 font-semibold">{prestation.prix} DA</p>
                </div>
              ))}
            </div>

            {showAddPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                  <h2 className="text-2xl font-bold text-rose-600 mb-4">Ajouter une prestation</h2>
                  <input
                    type="text"
                    placeholder="Nom de la prestation"
                    value={newPrestation.nom}
                    onChange={(e) => setNewPrestation({ ...newPrestation, nom: e.target.value })}
                    className="w-full mb-3 border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Prix"
                    value={newPrestation.prix}
                    onChange={(e) => setNewPrestation({ ...newPrestation, prix: e.target.value })}
                    className="w-full mb-3 border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddPopup(false)}
                      className="px-4 py-2 bg-gray-300 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddPrestation}
                      className="px-4 py-2 bg-rose-500 text-white rounded-lg"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

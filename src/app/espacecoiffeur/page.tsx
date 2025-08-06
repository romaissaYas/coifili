'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Scissors, Clock, User, Star, Settings, LayoutDashboard, Users, Plus } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import axios from 'axios';


export default function EspaceCoiffeur() {

  const [produits, setProduits] = useState([]);
const [newProduit, setNewProduit] = useState({ nom: '', prix: '' });
const [showAddProduitPopup, setShowAddProduitPopup] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddEmployePopup, setShowAddEmployePopup] = useState(false);

type HoraireJour = {
  jour: string;
  ouvert: boolean;
  debut: string;
  fin: string;
};
type Employe = {
  id: number;
  nom: string;
  poste: string;
};
const joursSemaine = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];



const fetchProduits = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/produits');
    setProduits(response.data);
  } catch (error) {
    console.error('Erreur lors du chargement des produits :', error);
  }
};

const handleAddProduit = async () => {
  try {
    await axios.post('http://localhost:5000/api/produits', newProduit);
    setShowAddProduitPopup(false);
    setNewProduit({ nom: '', prix: '' });
    fetchProduits(); // recharge la liste
  } catch (error) {
    console.error('Erreur lors de l’ajout du produit :', error);
  }
};
useEffect(() => {
  fetchProduits();
}, []);


  const [horaires, setHoraires] = useState<HoraireJour[]>(
    joursSemaine.map((jour) => ({
      jour,
      ouvert: false,
      debut: '',
      fin: '',
    }))
  );



  const [resumeHoraires, setResumeHoraires] = useState<HoraireJour[]>([]);
useEffect(() => {
  const fetchHoraires = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/horaires');
      const data = await response.json();
      setHoraires(data);
    } catch (error) {
      console.error("Erreur lors du chargement des horaires :", error);
    }
  };

  fetchHoraires();
}, []);
  const updateHoraire = (
    index: number,
    field: keyof HoraireJour,
    value: string | boolean
  ) => {
    const updated = [...horaires];
    (updated[index] as any)[field] = value;
    setHoraires(updated);
  };


  const telechargerPDF = () => {
    const doc = new jsPDF();
    doc.text("Horaires d'ouverture du salon", 20, 10);
    const tableData = resumeHoraires.map((h) => [
      h.jour,
      h.ouvert ? h.debut : 'Fermé',
      h.ouvert ? h.fin : 'Fermé',
    ]);
    autoTable(doc, {
      startY: 20,
      head: [['Jour', 'Début', 'Fin']],
      body: tableData,
    });
    doc.save('horaires-salon.pdf');
  };




  const [employes, setEmployes] = useState<Employe[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [poste, setPoste] = useState('');
  const [message, setMessage] = useState('');


useEffect(() => {
  fetchPrestations();
}, []);

const fetchPrestations = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/prestations');
    setPrestations(response.data);
  } catch (error) {
    console.error('Erreur lors du chargement des prestations:', error);
  }
};
const enregistrerHoraires = async () => {
  try {
    for (const h of horaires) {
      const response = await fetch('http://localhost:5000/api/horaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jour: h.jour,
          heure_debut: h.debut,
          heure_fin: h.fin,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error(`Erreur lors de l'enregistrement pour ${h.jour}:`, data);
        alert(`Erreur lors de l'enregistrement pour ${h.jour}`);
      }
    }

    alert('Tous les horaires ont été enregistrés avec succès.');
  } catch (error) {
    console.error('Erreur lors de la requête :', error);
    alert("Une erreur est survenue lors de l'enregistrement.");
  }
};

const handleAddPrestation = async () => {
  try {
    await axios.post('http://localhost:5000/api/prestations', {
      nom: newPrestation.nom,
      prix: Number(newPrestation.prix),
    });
    setNewPrestation({ nom: '', prix: '' });
    setShowAddPopup(false);
    fetchPrestations();
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
  }
};


  const fetchEmployes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employes');
      setEmployes(res.data);
    } catch (err) {
      console.error('Erreur de chargement des employés :', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'employes') {
      fetchEmployes();
    }
  }, [activeTab]);

  const handleAddEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/employes', { nom, poste });
      setMessage('Employé ajouté');
      setNom('');
      setPoste('');
      setPopupOpen(false);
      fetchEmployes();
    } catch (err) {
      console.error('Erreur ajout :', err);
      setMessage('Erreur lors de l’ajout');
    }
  };


  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard' },
    { name: 'Agenda', icon: <CalendarDays size={20} />, key: 'agenda' },
    { name: 'Prestations', icon: <Scissors size={20} />, key: 'prestations' },
    { name: 'Horaires', icon: <Clock size={20} />, key: 'horaires' },
  { name: 'Produits', icon: <Star size={20} />, key: 'produits' },

    { name: 'Employés', icon: <Users size={20} />, key: 'employes' },
  ];

const [prestations, setPrestations] = useState([]);
const [showAddPopup, setShowAddPopup] = useState(false);
const [newPrestation, setNewPrestation] = useState({ nom: '', prix: '' });

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


  const handleTabClick = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 via-rose-100 to-purple-100">
      <aside className="w-64 bg-white border-r shadow-lg p-6 hidden md:block">
        <h2 className="text-3xl font-extrabold text-rose-600 mb-8 tracking-tight">Espace Coiffeur</h2>
        <nav className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
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
                    <p className="text-sm text-gray-500">
                      {rdv.date} à {rdv.heure}
                    </p>
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
        {activeTab === 'produits' && (
  <>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-4xl font-bold text-rose-700">Produits à vendre</h1>
      <button
        onClick={() => setShowAddProduitPopup(true)}
        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl shadow"
      >
        <Plus size={18} /> Ajouter
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {produits.map((prod, idx) => (
        <div key={idx} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-lg font-bold text-gray-800">{prod.nom}</h3>
          <p className="text-rose-600 font-semibold">{prod.prix} DA</p>
        </div>
      ))}
    </div>

    {showAddProduitPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-rose-600 mb-4">Ajouter un produit</h2>
          <input
            type="text"
            placeholder="Nom du produit"
            value={newProduit.nom}
            onChange={(e) => setNewProduit({ ...newProduit, nom: e.target.value })}
            className="w-full mb-3 border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="number"
            placeholder="Prix"
            value={newProduit.prix}
            onChange={(e) => setNewProduit({ ...newProduit, prix: e.target.value })}
            className="w-full mb-3 border border-gray-300 rounded-lg px-4 py-2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddProduitPopup(false)}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleAddProduit}
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
          <h3 className="text-lg font-bold text-gray-800">{prestation?.nom}</h3>
          <p className="text-rose-600 font-semibold">{prestation?.prix} DA</p>
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


      {activeTab === 'horaires' && (
        <div className="space-y-4">
          {horaires.map((horaire, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <span className="font-semibold text-gray-700 w-32">
                {horaire.jour}
              </span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={horaire.ouvert}
                  onChange={(e) =>
                    updateHoraire(index, 'ouvert', e.target.checked)
                  }
                />
                <span>Ouvert</span>
              </label>
              <input
                type="time"
                disabled={!horaire.ouvert}
                value={horaire.debut}
                onChange={(e) =>
                  updateHoraire(index, 'debut', e.target.value)
                }
                className="border rounded-lg px-3 py-1 w-32"
              />
              <span className="text-gray-500">à</span>
              <input
                type="time"
                disabled={!horaire.ouvert}
                value={horaire.fin}
                onChange={(e) => updateHoraire(index, 'fin', e.target.value)}
                className="border rounded-lg px-3 py-1 w-32"
              />
            </div>
          ))}

          <div className="mt-4 flex gap-4">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg"
              onClick={enregistrerHoraires}
            >
              Enregistrer
            </button>
            {resumeHoraires.length > 0 && (
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                onClick={telechargerPDF}
              >
                Télécharger PDF
              </button>
            )}
          </div>

      {resumeHoraires.length > 0 && (
  <div className="mt-8">
    <h2 className="text-xl font-semibold mb-4 text-rose-700">
      🗓️ Récapitulatif des horaires enregistrés
    </h2>
    <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Jour</th>
            <th className="px-4 py-3 text-left font-semibold">Début</th>
            <th className="px-4 py-3 text-left font-semibold">Fin</th>
          </tr>
        </thead>
        <tbody>
          {resumeHoraires.map((h, i) => (
            <tr
              key={i}
              className="border-t hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-700">{h.jour}</td>
              <td className="px-4 py-3 text-gray-600">
                {h.ouvert ? h.debut : (
                  <span className="text-red-500 font-semibold">Fermé</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {h.ouvert ? h.fin : (
                  <span className="text-red-500 font-semibold">Fermé</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        </div>
      )}
    {activeTab === 'employes' && (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-pink-700">Liste des Employés</h2>
      <button
        onClick={() => setPopupOpen(true)}
        className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 flex items-center gap-2 shadow-md"
      >
        <Plus size={18} /> Ajouter Employé
      </button>
    </div>

    {/* Carte par employé */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {employes.map((emp) => (
        <div
          key={emp.id}
          className="bg-white rounded-xl shadow-lg p-4 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800">{emp.nom}</h3>
          <p className="text-pink-600 font-medium mt-1">{emp.poste}</p>
        </div>
      ))}
    </div>

    {/* Popup d'ajout */}
    {popupOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-96 relative">
          <button
            onClick={() => setPopupOpen(false)}
            className="absolute top-2 right-3 text-gray-600 text-2xl"
          >
            &times;
          </button>
          <h3 className="text-xl font-semibold mb-4 text-pink-700">Ajouter un Employé</h3>
          <form onSubmit={handleAddEmploye} className="space-y-4">
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
              className="border border-gray-300 p-2 w-full rounded"
              required
            />
            <input
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              placeholder="Poste"
              className="border border-gray-300 p-2 w-full rounded"
              required
            />
            <button
              type="submit"
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 w-full"
            >
              Enregistrer
            </button>
            {message && (
              <p className="text-sm text-green-600 text-center">{message}</p>
            )}
          </form>
        </div>
      </div>
    )}
  </div>
)}

      </main>
    </div>
  );
}

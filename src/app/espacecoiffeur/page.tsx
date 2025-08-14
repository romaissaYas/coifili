'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Scissors, Clock, User, Star, Settings, LayoutDashboard, Users, Plus } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import axios from 'axios';
import Swal from 'sweetalert2';

type Creneau = { debut: string; fin: string };
type HoraireJour = {
  jour: string;
  ouvert: boolean;
  creneaux: Creneau[];
};

const joursSemaine = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"
];

export default function EspaceCoiffeur() {

  const [produits, setProduits] = useState([]);
const [newProduit, setNewProduit] = useState({ nom: '', prix: '' });
const [showAddProduitPopup, setShowAddProduitPopup] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddEmployePopup, setShowAddEmployePopup] = useState(false);





type Employe = {
  id: number;
  nom: string;
  poste: string;
};


const [horaires, setHoraires] = useState<HoraireJour[]>(
    joursSemaine.map((jour) => ({
      jour,
      ouvert: false,
      creneaux: [{ debut: "", fin: "" }]
    }))
  );

  const toggleOuvert = (jourIndex: number) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].ouvert = !newHoraires[jourIndex].ouvert;
    setHoraires(newHoraires);
  };

  const ajouterCreneau = (jourIndex: number) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].creneaux.push({ debut: "", fin: "" });
    setHoraires(newHoraires);
  };

  const changerCreneau = (
    jourIndex: number,
    creneauIndex: number,
    champ: "debut" | "fin",
    valeur: string
  ) => {
    const newHoraires = [...horaires];
    newHoraires[jourIndex].creneaux[creneauIndex][champ] = valeur;
    setHoraires(newHoraires);
  };

  const enregistrerHoraires = async () => {
    try {
 const userData = localStorage.getItem("user");
  if (!userData) {
      alert("Utilisateur non trouvé dans le localStorage !");
      return;
    }
   const user = JSON.parse(userData);
    const salonId = user.salonId;
  

      for (const h of horaires) {
        await fetch("http://localhost:5000/api/horaires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salonId: parseInt(salonId),
            jour: h.jour,
            ouvert: h.ouvert,
            creneaux: h.ouvert ? h.creneaux : []
          })
        });
      }
      alert("Horaires enregistrés avec succès !");
    } catch (err) {
      console.error("Erreur enregistrement horaires :", err);
    }
  };
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
    fetchProduits();
    Swal.fire({
      icon: 'success',
      title: 'Produit ajouté !',
      text: 'Le produit a bien été ajouté à la liste.',
      timer: 2000,
      showConfirmButton: false,
    });
  
    // Afficher la notification d'erreur
   // recharge la liste
  } catch (error) {
      Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: "Impossible d'ajouter le produit. Veuillez réessayer.",
    });
    console.error('Erreur lors de l’ajout du produit :', error);
  }
};
useEffect(() => {
  fetchProduits();
}, []);













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


const handleAddPrestation = async () => {
  try {
    const nomPrestation = newPrestation.nom; // ✅ Sauvegarde avant de reset

    await axios.post('http://localhost:5000/api/prestations', {
      nom: nomPrestation,
      prix: Number(newPrestation.prix),
    });

    setNewPrestation({ nom: '', prix: '' });
    setShowAddPopup(false);
    fetchPrestations();

    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Ajouté !',
        text: `La prestation "${nomPrestation}" a été ajoutée avec succès.`,
        confirmButtonColor: '#d63384',
      });
    }, 300);
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
  }
};

const telechargerPDF = () => {
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(18);
  doc.text("Horaires d'ouverture du salon", 20, 15);

  // Préparer les données du tableau
  const tableData = horaires.flatMap((h) => {
    if (!h.ouvert) {
      return [[h.jour, "Fermé", "Fermé"]];
    }
    return h.creneaux.map((c) => [h.jour, c.debut || "-", c.fin || "-"]);
  });

  // Génération du tableau
  autoTable(doc, {
    startY: 25,
    head: [["Jour", "Début", "Fin"]],
    body: tableData,
    styles: {
      fontSize: 12,
      halign: "center",
    },
    headStyles: {
      fillColor: [46, 125, 50], // vert
      textColor: 255,
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  // Sauvegarde
  doc.save("horaires-salon.pdf");
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
       Swal.fire({
      icon: 'success',
      title: 'Employé ajouté',
      text: 'L\'employé a bien été ajouté.',
      timer: 2000,
      showConfirmButton: false,
    });
    } catch (err) {
        Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Erreur lors de l’ajout de l\'employé. Veuillez réessayer.',
    });
      console.error('Erreur ajout :', err);
      setMessage('Erreur lors de l’ajout');
    }
  };


  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard' },
    { name: 'Agenda', icon: <CalendarDays size={20} />, key: 'agenda' },
    { name: 'Horaires', icon: <Clock size={20} />, key: 'horaires' },
    { name: 'Prestations', icon: <Scissors size={20} />, key: 'prestations' },

  { name: 'Produits A vendre ', icon: <Star size={20} />, key: 'produits' },

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

  const [user, setUser] = useState<any>(null);

 useEffect(() => {
    const storedUser = localStorage.getItem('user');
  console.log("Valeur brute localStorage:", storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
  };

    if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 via-rose-100 to-purple-100">
      <aside className="w-64 bg-white border-r shadow-lg p-6 hidden md:block">
        <h2 className="text-3xl font-extrabold text-rose-600 mb-8 tracking-tight">Espace Coiffeur</h2>
 <h1 className="text-2xl font-bold mb-4">
          Bienvenue {user.firstName} {user.lastName} 👋
        </h1>
        <p className="text-gray-700">
          <strong>ID Salon :</strong> {user.salonId}
        </p>
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
              <label className="block text-gray-600 font-medium mb-2">Sélectionner une date {user.salonId} :</label>
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
           {activeTab === 'horaires' && (
          <>
            <h1 className="text-4xl font-bold text-rose-700 mb-6">horraire et crénaux </h1>
<div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl font-sans">
  

  {horaires.map((h, jourIndex) => (
    <div
      key={h.jour}
      className="bg-gray-50 rounded-xl p-5 mb-5 shadow-sm border border-gray-200"
    >
      <label className="flex items-center justify-between">
        <span className="font-semibold text-lg text-gray-700">{h.jour}</span>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={h.ouvert}
            onChange={() => toggleOuvert(jourIndex)}
            className="w-5 h-5 accent-green-500 cursor-pointer"
          />
          <span
            className={`text-sm font-medium ${
              h.ouvert ? "text-green-600" : "text-red-500"
            }`}
          >
            {h.ouvert ? "Ouvert" : "Fermé"}
          </span>
        </div>
      </label>

      {h.ouvert && (
        <div className="mt-4">
          {h.creneaux.map((c, creneauIndex) => (
            <div
              key={creneauIndex}
              className="flex items-center mb-3 space-x-3"
            >
              <input
                type="time"
                value={c.debut}
                onChange={(e) =>
                  changerCreneau(jourIndex, creneauIndex, "debut", e.target.value)
                }
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <span className="text-gray-500 font-bold">—</span>
              <input
                type="time"
                value={c.fin}
                onChange={(e) =>
                  changerCreneau(jourIndex, creneauIndex, "fin", e.target.value)
                }
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          ))}

          <button
            onClick={() => ajouterCreneau(jourIndex)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Ajouter créneau
          </button>
        </div>
      )}
    </div>
  ))}

  <div className="flex space-x-4 mt-6">
    <button
      onClick={enregistrerHoraires}
      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md transition"
    >
      💾 Enregistrer
    </button>
    <button
      onClick={telechargerPDF}
      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md transition"
    >
      📄 Télécharger PDF
    </button>
  </div>
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

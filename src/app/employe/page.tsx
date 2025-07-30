'use client';

import { useState } from 'react';

type Employe = {
  nom: string;
  specialite: string;
  telephone: string;
};

export default function Employes() {
  const [employes, setEmployes] = useState<Employe[]>([
    { nom: 'Leïla', specialite: 'Coloration', telephone: '0555 12 34 56' },
    { nom: 'Yasmine', specialite: 'Brushing', telephone: '0666 78 90 12' },
  ]);

  const [popupVisible, setPopupVisible] = useState(false);
  const [nouvelEmploye, setNouvelEmploye] = useState<Employe>({
    nom: '',
    specialite: '',
    telephone: '',
  });

  const ajouterEmploye = () => {
    if (nouvelEmploye.nom.trim() === '') return;
    setEmployes([...employes, nouvelEmploye]);
    setNouvelEmploye({ nom: '', specialite: '', telephone: '' });
    setPopupVisible(false);
  };

  return (
    <div className="p-6 bg-pink-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-pink-700">Employés ({employes.length})</h2>
        <button
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded"
          onClick={() => setPopupVisible(true)}
        >
          + Ajouter
        </button>
      </div>

      {/* Modal / Popup */}
      {popupVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Nouvel Employé</h3>
            <input
              type="text"
              placeholder="Nom"
              value={nouvelEmploye.nom}
              onChange={(e) => setNouvelEmploye({ ...nouvelEmploye, nom: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Spécialité"
              value={nouvelEmploye.specialite}
              onChange={(e) => setNouvelEmploye({ ...nouvelEmploye, specialite: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="Téléphone"
              value={nouvelEmploye.telephone}
              onChange={(e) => setNouvelEmploye({ ...nouvelEmploye, telephone: e.target.value })}
              className="w-full mb-4 p-2 border border-gray-300 rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPopupVisible(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
              >
                Annuler
              </button>
              <button
                onClick={ajouterEmploye}
                className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des employés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employes.map((employe, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-800">{employe.nom}</h3>
            <p className="text-gray-600 mt-1">Spécialité : {employe.specialite}</p>
            <p className="text-gray-600">Téléphone : {employe.telephone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

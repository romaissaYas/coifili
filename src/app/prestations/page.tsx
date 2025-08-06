'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';


type Prestation = {
  id: number;
  nom: string;
  prix: number;
};

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([
    { id: 1, nom: 'Brushing', prix: 2500 },
    { id: 2, nom: 'Coupe', prix: 3000 },
    { id: 3, nom: 'Coloration', prix: 5000 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newPrix, setNewPrix] = useState<number | ''>('');

  const ajouterPrestation = () => {
    if (!newNom || !newPrix) return;

    const nouvellePrestation: Prestation = {
      id: prestations.length + 1,
      nom: newNom,
      prix: Number(newPrix),
    };

    setPrestations([...prestations, nouvellePrestation]);
    setShowModal(false);
    setNewNom('');
    setNewPrix('');
// Petit délai pour laisser le modal se fermer avant d'afficher Swal
setTimeout(() => {
  Swal.fire({
    icon: 'success',
    title: 'Ajouté !',
    text: `La prestation "${nouvellePrestation.nom}" a été ajoutée avec succès.`,
    confirmButtonColor: '#d63384',
  });
}, 50990);
  };

  return (
    <div className="min-h-screen bg-rose-50 py-10 px-6">
      <h1 className="text-4xl font-bold text-rose-700 mb-6">Prestations</h1>

      <button
        onClick={() => setShowModal(true)}
        className="mb-6 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
      >
        Ajouter une prestation
      </button>

      <div className="grid gap-4">
        {prestations.map((prestation) => (
          <div
            key={prestation.id}
            className="bg-white shadow rounded-lg p-4 border border-gray-100"
          >
            <p className="text-xl font-semibold text-gray-800">{prestation.nom}</p>
            <p className="text-rose-600 font-bold">{prestation.prix} DA</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Ajouter une prestation</h2>
            <div className="mb-4">
              <label className="block text-sm mb-1">Nom :</label>
              <input
                type="text"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">Prix (DA) :</label>
              <input
                type="number"
                value={newPrix}
                onChange={(e) => setNewPrix(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Annuler
              </button>
              <button
                onClick={ajouterPrestation}
                className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                Ajouter
              </button>
              <button onClick={() => Swal.fire('Test', 'Ça fonctionne bien', 'success')}>
  Tester Swal
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Plus } from 'lucide-react';
import type { Produit } from '@/types/produit';

type NewProduit = { nom: string; prix: string; salon_id: number | undefined };

type Props = {
  produits: Produit[];
  showAddProduitPopup: boolean;
  setShowAddProduitPopup: (show: boolean) => void;
  newProduit: NewProduit;
  setNewProduit: (produit: NewProduit) => void;
  handleAddProduit: () => void;
};

export default function ProduitsTab({
  produits,
  showAddProduitPopup,
  setShowAddProduitPopup,
  newProduit,
  setNewProduit,
  handleAddProduit,
}: Props) {
  return (
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
  );
}

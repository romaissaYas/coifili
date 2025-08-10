"use client";

import { useState } from "react";
import Link from "next/link";

export default function BarbierPage() {
  const [ville, setVille] = useState("");
  const [resultats, setResultats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!ville.trim()) return;

    setLoading(true);
    setResultats([]);

    try {
      const res = await fetch(
        `http://localhost:5000/api/salons?categorie=barbier&ville=${encodeURIComponent(ville)}`
      );
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setResultats(data);
    } catch (err) {
      console.error("Erreur :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">

      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-center">
          <ul className="flex space-x-12 text-lg font-semibold text-gray-800">
            <li>
              <Link href="/coiffeur" className="hover:text-pink-500 transition duration-300">
                Coiffeur
              </Link>
            </li>
            <li>
              <Link href="/barbier" className="hover:text-pink-500 transition duration-300">
                Barbier
              </Link>
            </li>
            <li>
              <Link href="/manucure" className="hover:text-pink-500 transition duration-300">
                Manucure
              </Link>
            </li>
            <li>
              <Link href="/institut" className="hover:text-pink-500 transition duration-300">
                Institut de Beauté
              </Link>
            </li>
          </ul>
        </div>
      </nav>
   <section
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg8.jpg')" }}
      >
        <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Trouvez votre barbier</h1>
            <p className="text-lg">
          Réserver en ligne un RDV avec un barbier
            </p>
          </div>
        </div>
      </section>
      {/* Barre de recherche */}
      <section className="text-center py-16 bg-gray-100">
        <h1 className="text-4xl font-bold mb-6">
        </h1>
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 justify-center items-center">
          <input
            type="text"
            placeholder="Où"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="px-4 py-3 border rounded-md w-full md:w-80"
          />
          <button
            onClick={handleSearch}
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
          >
            Rechercher
          </button>
        </div>
      </section>

      {/* Résultats */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Résultats</h2>

        {loading && <p>Chargement...</p>}
        {!loading && resultats.length === 0 && ville && (
          <p>Aucun barbier trouvé.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {resultats.map((item, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl overflow-hidden"
            >
              <img
                src={item.image}
                alt={item.nom}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold">{item.nom}</h3>
                <p className="text-gray-600">{item.ville}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

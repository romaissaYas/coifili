"use client"

import { useState } from "react"
import Link from "next/link"

export default function CoiffeurPage() {
  const [ville, setVille] = useState("")
  const [resultats, setResultats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!ville.trim()) return
    setLoading(true)
    setResultats([])

    try {
      const res = await fetch(
        `http://localhost:5000/api/salons?categorie=coiffeur&ville=${encodeURIComponent(ville)}`
      )
      if (!res.ok) throw new Error("Erreur serveur")
      const data = await res.json()
      setResultats(data) // [{ nom, ville, image }]
    } catch (err) {
      console.error("Erreur :", err)
    } finally {
      setLoading(false)
    }
  }

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

      {/* Bannière */}
      <section
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg11.jpg')" }}
      >
        <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Trouvez votre coiffeur</h1>
            <p className="text-lg">
              Réservez en ligne dans les meilleurs salons de coiffure
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire de recherche */}
      <section className="py-10 px-4 flex justify-center">
        <div className="bg-gray-100 rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-4 items-center w-full max-w-3xl">
          <input
            type="text"
            placeholder="Entrez votre ville..."
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="px-4 py-3 rounded-md border w-full"
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
        <h2 className="text-2xl font-bold mb-6">Résultats</h2>

        {loading && <p>Chargement...</p>}
        {!loading && resultats.length === 0 && ville && (
          <p>Aucun salon de coiffure trouvé.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {resultats.map((salon, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl overflow-hidden"
            >
              <img
                src={salon.image}
                alt={salon.nom}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold">{salon.nom}</h3>
                <p className="text-gray-600">{salon.ville}</p>
                <a
                  href={`/salon/${salon.id || i}`}
                  className="mt-2 inline-block text-sm text-pink-600 hover:underline"
                >
                  Voir le salon
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ManucurePage() {
  const [ville, setVille] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (!ville) return
    router.push(`/recherche?service=manucure&ville=${encodeURIComponent(ville)}`)
  }

  const villes = [
    { name: "Alger", image: "/img/alger.jpg" },
    { name: "Oran", image: "/img/oran.jpg" },
    { name: "Constantine", image: "/img/constantine.jpg" },
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gray-100">
        <h1 className="text-4xl font-bold mb-6">Réserver une manucure près de chez vous</h1>
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

      {/* Résultats villes */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Manucure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {villes.map((ville, i) => (
            <div key={i} className="bg-white shadow-md rounded-xl overflow-hidden">
              <img src={ville.image} alt={ville.name} className="h-48 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold">{ville.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function page() {
  const [ville, setVille] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (!ville) return
    router.push(`/recherche?service=coiffeur&ville=${encodeURIComponent(ville)}`)
  }

  return (
    <div className="bg-white">
      
      {/* Bannière */}
      <section
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: "url('/img/bg8.jpg')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Trouvez votre coiffeur</h1>
            <p className="text-lg">Réservez en ligne dans les meilleurs salons de coiffure</p>
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

      {/* Liste des salons */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Salons de coiffure populaires</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              nom: "Salon Chic Hair",
              ville: "Alger",
              image: "/img/bg1.jpg"
            },
            {
              nom: "L’Atelier du Coiffeur",
              ville: "Oran",
              image: "/img/bg3.jpg"
            },
            {
              nom: "Coiffure Élégance",
              ville: "Constantine",
              image: "/img/bg2.jpg"
            }
          ].map((salon, i) => (
            <div key={i} className="bg-white shadow-md rounded-xl overflow-hidden">
              <img src={salon.image} alt={salon.nom} className="h-48 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold">{salon.nom}</h3>
                <p className="text-gray-600">{salon.ville}</p>
                <a
                  href={`/salon/${i}`}
                  className="mt-2 inline-block text-sm text-pink-600 hover:underline"
                >
                  Voir le salon
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-pink-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Pourquoi choisir RDV Beauty ?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-2">Réservation en ligne 24h/24</h3>
              <p className="text-gray-700">Prenez rendez-vous à tout moment, sans appeler.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Salons certifiés</h3>
              <p className="text-gray-700">Nous sélectionnons les meilleurs professionnels près de chez vous.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Avis clients</h3>
              <p className="text-gray-700">Lisez les avis pour faire le meilleur choix.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

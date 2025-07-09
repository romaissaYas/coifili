"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import Link from "next/link"


const backgrounds = [
  "/img/bg1.jpg",
  "/img/bg2.jpg",
  "/img/bg3.jpg"
]

export default function Home() {
  const [bgIndex, setBgIndex] = useState(0)
  const [service, setService] = useState("")
  const [ville, setVille] = useState("")
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    if (!service || !ville) return
    router.push(`/recherche?service=${encodeURIComponent(service)}&ville=${encodeURIComponent(ville)}`)
  }

  return (
    <>
      {/* Navbar fixe */}
      <header className="fixed top-0 left-0 w-full z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 text-xl font-bold text-black">
            <img src="/img/bg4.jpg" alt="Logo" className="w-30 h-20" />
  
                   </div>

          {/* Liens de navigation */}
  <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <ul className="hidden md:flex space-x-10 text-lg font-semibold text-gray-700">
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


          {/* Boutons de connexion */}
          <div className="flex items-center gap-4">
           <a href="/pagedecoufer" className="text-black hover:text-gray-700 transition">je suis un couffeur </a>
            <a
            href="/login"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
             Connexion
            </a>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="relative min-h-screen">
        {/* Image de fond dynamique */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${backgrounds[bgIndex]})` }}
        ></div>

        {/* Overlay noir semi-transparent */}
        <div className="absolute inset-0  bg-opacity-50 z-10"></div>

        {/* Zone centrale de contenu */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-32">
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-2">Réservez en beauté</h1>
          <p className="text-white mb-8">Simple • Immédiat • 24h/24</p>

          <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-center w-full max-w-2xl">
            <input
              type="text"
              placeholder="Coiffeur, Barbier..."
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="px-4 py-3 rounded-md border w-full md:w-64"
            />
            <input
              type="text"
              placeholder="Adresse, ville..."
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="px-4 py-3 rounded-md border w-full md:w-64"
            />
            <button
              onClick={handleSearch}
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>


      <section className="bg-white py-20">
  <div className="max-w-7xl mx-auto px-4">
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000 }}
      loop
    >
      {[
        {
          title: "Manucure",
          description: "On raconte que les mains sont le reflet de la façon dont on prend soin de soi.",
          image: "/img/bg1.jpg",
          link: "/manucure",
        },
        {
          title: "Coiffeur",
          description: "Un bon style commence par une bonne coupe.",
          image: "/img/bg2.jpg",
          link: "/CoiffeurPage",
        },
        {
          title: "Massage",
          description: "Détendez-vous avec nos massages bien-être.",
          image: "/img/bg3.jpg",
          link: "/massage",
        },
      ].map((item, index) => (
        <SwiperSlide key={index}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-[400px] object-cover rounded-xl shadow-md"
            />
            <div>
              <h2 className="text-4xl font-bold mb-4">Découvrez nos <br />Professionnels</h2>
              <hr className="w-10 border-b-2 border-indigo-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <a href={item.link} className="underline text-black font-medium hover:text-indigo-600">
                Voir plus
              </a>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>

      <section className="bg-white py-20">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Partout en Algérie</h2>
    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">
      Trouvez votre établissement beauté partout en Algérie
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
      {[
        {
          title: "Coiffeur",
          description: "Nos salons de coiffure populaires en Algérie",
          villes: ["Alger", "Oran", "Constantine", "Blida", "Tizi Ouzou", "Annaba", "Béjaïa"],
        },
        {
          title: "Barbier",
          description: "Nos barbiers populaires en Algérie",
          villes: ["Alger", "Oran", "Constantine", "Blida", "Tizi Ouzou", "Annaba", "Béjaïa"],
        },
        {
          title: "Manucure",
          description: "Nos salons de manucure populaires en Algérie",
          villes: ["Alger", "Oran", "Constantine", "Blida", "Tizi Ouzou", "Annaba", "Béjaïa"],
        },
        {
          title: "Institut",
          description: "Nos instituts de beauté populaires en Algérie",
          villes: ["Alger", "Oran", "Constantine", "Blida", "Tizi Ouzou", "Annaba", "Béjaïa"],
        },
        {
          title: "Massage",
          description: "Nos massages populaires en Algérie",
          villes: ["Alger", "Oran", "Constantine", "Blida", "Tizi Ouzou", "Annaba", "Béjaïa"],
        },
      ].map((category, idx) => (
        <div key={idx}>
          <h4 className="text-lg font-semibold mb-1">{category.title}</h4>
          <p className="text-gray-600 text-sm mb-3">{category.description}</p>
          <ul className="text-gray-800 space-y-1 text-sm">
            {category.villes.map((ville, i) => (
              <li key={i} className="hover:underline cursor-pointer">
                {ville}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</section>
<footer className="bg-[#1e1e1e] text-white py-12 mt-10">
  <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">

    {/* Logo + Réseaux sociaux */}
    <div>
      <h1 className="text-2xl font-bold mb-4 tracking-wider">Coifili</h1>
      <div className="flex space-x-4">
        <a href="#" className="bg-white text-black rounded p-2"><i className="fab fa-facebook-f"></i></a>
        <a href="#" className="bg-white text-black rounded p-2"><i className="fab fa-instagram"></i></a>
      </div>
    </div>

    {/* À propos */}
    <div>
      <h3 className="font-semibold text-lg mb-4">À propos de RDV Beauty</h3>
      <ul className="space-y-2 text-gray-400 text-sm">
        <li><a href="#">Je suis un professionnel de beauté</a></li>
        <li><a href="#">Rejoignez-nous</a></li>
        <li><a href="#">CGU</a></li>
        <li><a href="#">Politique de confidentialité</a></li>
        <li><a href="#">Gestion des cookies</a></li>
        <li><a href="#">Accessibilité</a></li>
      </ul>
    </div>

    {/* Services */}
    <div>
      <h3 className="font-semibold text-lg mb-4">Trouvez votre prestation</h3>
      <ul className="space-y-2 text-gray-400 text-sm">
        <li><a href="#">Coiffeur</a></li>
        <li><a href="#">Institut de beauté</a></li>
        <li><a href="#">Barbier</a></li>
        <li><a href="#">Manucure</a></li>
        <li><a href="#">Spa</a></li>
        <li><a href="#">Massage</a></li>
      </ul>
    </div>

    {/* Recherches fréquentes */}
    <div>
      <h3 className="font-semibold text-lg mb-4">Recherches fréquentes</h3>
      <ul className="space-y-2 text-gray-400 text-sm">
        <li><a href="#">Coiffeur Alger</a></li>
        <li><a href="#">Coiffeur Oran</a></li>
        <li><a href="#">Coiffeur Constantine</a></li>
        <li><a href="#">Coiffeur Annaba</a></li>
      </ul>
    </div>
  </div>
</footer>

    </>
  )
}

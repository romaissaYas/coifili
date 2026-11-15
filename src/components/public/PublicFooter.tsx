/** Pied de page commun aux pages publiques (accueil + catégories). */
export default function PublicFooter() {
  return (
    <footer className="mt-10 bg-[#1e1e1e] py-12 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 md:grid-cols-4">
        <div>
          <h2 className="mb-4 text-2xl font-bold tracking-wider">Coifili</h2>
          <div className="flex space-x-4">
            <a href="#" aria-label="Coifili sur Facebook" className="rounded bg-white p-2 text-black">
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </a>
            <a href="#" aria-label="Coifili sur Instagram" className="rounded bg-white p-2 text-black">
              <i className="fab fa-instagram" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">À propos de Coifili</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/cgu">CGU</a></li>
            <li><a href="/confidentialite">Politique de confidentialité</a></li>
            <li><a href="/confidentialite#cookies">Gestion des cookies</a></li>
            <li><a href="/confidentialite#cookies">Accessibilité</a></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Trouvez votre prestation</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/coiffeur">Coiffeur</a></li>
            <li><a href="/institut">Institut de beauté</a></li>
            <li><a href="/barbier">Barbier</a></li>
            <li><a href="/manucure">Manucure</a></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Recherches fréquentes</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#">Coiffeur Alger</a></li>
            <li><a href="#">Coiffeur Oran</a></li>
            <li><a href="#">Coiffeur Constantine</a></li>
            <li><a href="#">Coiffeur Annaba</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

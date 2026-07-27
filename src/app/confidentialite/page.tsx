import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    "Politique de confidentialité de Coifili : données collectées, finalités, durée de conservation, vos droits (accès, effacement) et gestion des cookies.",
  alternates: { canonical: '/confidentialite' },
};

const MAJ = '27 juillet 2026';

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800">
      <Link href="/" className="text-sm text-rose-600 hover:underline">← Retour à l’accueil</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : {MAJ}</p>

      <p className="mt-6">
        Coifili attache une grande importance à la protection de vos données personnelles.
        La présente politique explique quelles données nous collectons, pourquoi, combien de temps
        nous les conservons et quels sont vos droits, conformément à la loi algérienne n° 18-07
        relative à la protection des personnes physiques dans le traitement des données à caractère
        personnel.
      </p>

      <Section titre="1. Données que nous collectons">
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Compte</strong> : nom, prénom, adresse e-mail, numéro de téléphone.</li>
          <li><strong>Réservations</strong> : salon, prestation, date et heure, statut.</li>
          <li><strong>Salons (professionnels)</strong> : informations de l’établissement et de gestion.</li>
          <li><strong>Techniques</strong> : journaux de connexion nécessaires à la sécurité du service.</li>
        </ul>
      </Section>

      <Section titre="2. Finalités du traitement">
        <ul className="list-disc space-y-1 pl-6">
          <li>Créer et gérer votre compte et vos réservations.</li>
          <li>Permettre la communication entre vous et le salon choisi.</li>
          <li>Assurer la sécurité, prévenir la fraude et respecter nos obligations légales.</li>
        </ul>
      </Section>

      <Section titre="3. Durée de conservation">
        <p>
          Vos données de compte sont conservées tant que votre compte est actif. Les réservations
          peuvent être conservées, sous forme <em>anonymisée</em>, pour les besoins de gestion du
          salon après la suppression de votre compte. Vous pouvez demander l’effacement à tout moment.
        </p>
      </Section>

      <Section titre="4. Partage des données">
        <p>
          Vos données de réservation sont communiquées au salon concerné afin d’assurer la prestation.
          Nous ne vendons ni ne louons vos données personnelles à des tiers.
        </p>
      </Section>

      <Section titre="5. Vos droits">
        <p>
          Vous disposez d’un droit d’accès, de rectification et d’effacement de vos données. Depuis
          votre espace, rubrique{' '}
          <Link href="/mon-compte/confidentialite" className="text-rose-600 hover:underline">
            « Mon compte → Confidentialité »
          </Link>
          , vous pouvez :
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li><strong>Télécharger vos données</strong> au format JSON (droit d’accès/portabilité).</li>
          <li><strong>Supprimer votre compte</strong> (droit à l’effacement).</li>
        </ul>
      </Section>

      <Section titre="6. Cookies et stockage local" id="cookies">
        <p>
          Coifili n’utilise <strong>pas</strong> de cookies publicitaires ni de traceurs tiers. Le
          service utilise uniquement un <strong>stockage local strictement nécessaire</strong> à son
          fonctionnement (maintien de votre session après connexion). Ce stockage essentiel ne
          requiert pas de consentement préalable ; il est supprimé à la déconnexion.
        </p>
      </Section>

      <Section titre="7. Contact">
        <p>
          Pour toute question relative à vos données ou pour exercer vos droits, contactez-nous à
          l’adresse indiquée dans les mentions légales du service.
        </p>
      </Section>

      <p className="mt-10 text-sm text-gray-500">
        Voir aussi nos{' '}
        <Link href="/cgu" className="text-rose-600 hover:underline">Conditions générales d’utilisation</Link>.
      </p>
    </main>
  );
}

function Section({ titre, id, children }: { titre: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <h2 className="text-xl font-semibold text-gray-900">{titre}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

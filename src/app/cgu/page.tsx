import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description:
    "Conditions générales d’utilisation de Coifili : objet du service, compte, réservations, responsabilités et suppression de compte.",
  alternates: { canonical: '/cgu' },
};

const MAJ = '27 juillet 2026';

export default function CguPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-gray-800">
      <Link href="/" className="text-sm text-rose-600 hover:underline">← Retour à l’accueil</Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Conditions générales d’utilisation</h1>
      <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : {MAJ}</p>

      <Section titre="1. Objet">
        <p>
          Coifili est une plateforme de mise en relation permettant aux utilisateurs de rechercher des
          salons de coiffure et de beauté en Algérie et d’y réserver des prestations en ligne. Les
          présentes conditions régissent l’utilisation du service.
        </p>
      </Section>

      <Section titre="2. Compte utilisateur">
        <p>
          La création d’un compte nécessite des informations exactes et à jour. Vous êtes responsable
          de la confidentialité de vos identifiants et des activités effectuées depuis votre compte.
        </p>
      </Section>

      <Section titre="3. Réservations">
        <p>
          Une réservation constitue un engagement envers le salon choisi. Les modalités d’annulation
          ou de reprogrammation sont disponibles depuis votre espace « Mes rendez-vous ». Coifili n’est
          pas partie à la prestation réalisée par le salon.
        </p>
      </Section>

      <Section titre="4. Professionnels">
        <p>
          Les salons sont responsables de l’exactitude des informations publiées (prestations, prix,
          disponibilités) et de la réalisation des prestations réservées.
        </p>
      </Section>

      <Section titre="5. Responsabilité">
        <p>
          Coifili s’efforce d’assurer la disponibilité et la fiabilité du service, sans garantie
          d’absence totale d’interruption. Coifili ne saurait être tenu responsable des prestations
          fournies par les salons.
        </p>
      </Section>

      <Section titre="6. Suppression de compte">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis{' '}
          <Link href="/mon-compte/confidentialite" className="text-rose-600 hover:underline">
            « Mon compte → Confidentialité »
          </Link>
          . Le traitement de vos données est décrit dans notre{' '}
          <Link href="/confidentialite" className="text-rose-600 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">{titre}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

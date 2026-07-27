'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Bandeau d'information « cookies / stockage local ». Coifili n'utilise pas de
 * traceurs publicitaires : le seul stockage est strictement nécessaire (session
 * après connexion). Ce bandeau informe l'utilisateur et mémorise sa prise de
 * connaissance (localStorage), sans jamais bloquer l'accès au service.
 */
const CLE = 'coifili-consent';

export default function CookieConsent() {
  // `null` tant qu'on n'a pas lu le localStorage (évite un flash côté client).
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CLE)) setVisible(true);
    } catch {
      /* localStorage indisponible : on n'affiche rien */
    }
  }, []);

  const accepter = () => {
    try {
      localStorage.setItem(CLE, new Date().toISOString());
    } catch {
      /* ignore : l'essentiel est de retirer le bandeau */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Information sur les cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Coifili utilise uniquement un stockage <strong>strictement nécessaire</strong> au
          fonctionnement (votre session). Aucun traceur publicitaire.{' '}
          <Link href="/confidentialite#cookies" className="text-rose-600 hover:underline">
            En savoir plus
          </Link>
          .
        </p>
        <button
          onClick={accepter}
          className="shrink-0 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          J’ai compris
        </button>
      </div>
    </div>
  );
}

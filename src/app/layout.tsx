import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/common/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// URL publique du site (Open Graph, sitemap, robots). Configurable via env.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Coifili — Réservation de salons de coiffure et beauté en Algérie",
    template: "%s · Coifili",
  },
  description:
    "Trouvez et réservez en ligne votre salon de coiffure, barbier, institut de beauté ou manucure en Algérie. Réservation simple, rapide et gratuite avec Coifili.",
  keywords: [
    "coiffure",
    "salon de coiffure",
    "barbier",
    "institut de beauté",
    "manucure",
    "réservation en ligne",
    "Algérie",
    "Coifili",
  ],
  applicationName: "Coifili",
  authors: [{ name: "Coifili" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Coifili",
    title: "Coifili — Réservation de salons de beauté en Algérie",
    description:
      "Réservez en ligne votre salon de coiffure, barbier, institut ou manucure en Algérie.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coifili — Réservation de salons de beauté en Algérie",
    description:
      "Réservez en ligne votre salon de coiffure, barbier, institut ou manucure en Algérie.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

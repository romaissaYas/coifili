import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les pages.
 *
 * Choix délibéré : on n'impose PAS de Content-Security-Policy stricte ici, car
 * Next.js injecte des styles/scripts inline (une CSP mal calibrée casserait le
 * rendu). Les en-têtes ci-dessous sont sûrs et sans risque de régression.
 * HSTS n'a d'effet qu'en HTTPS (ignoré en local http).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

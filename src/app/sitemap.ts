import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Plan du site : pages publiques statiques (découverte). Les fiches salon
 * dynamiques (/salon/[id]) peuvent être ajoutées ultérieurement en interrogeant
 * l'API des salons actifs ; on reste ici sur les routes stables et sûres.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/salons', '/coiffeur', '/barbier', '/manucure', '/institut'];
  const now = new Date();
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}

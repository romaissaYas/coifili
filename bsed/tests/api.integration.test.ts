import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

/**
 * Tests d'intégration du pipeline HTTP (routage, validation, authentification,
 * forme des erreurs) — SANS base de données : chaque cas est rejeté par un
 * middleware (validateBody, validateIdParam, authMiddleware) en amont de toute
 * requête SQL. Vérifie que les gardes réagissent correctement et de façon
 * cohérente, avant même d'atteindre un contrôleur.
 */
describe('Gestion des routes inconnues', () => {
  it('renvoie 404 JSON pour une route inexistante', async () => {
    const res = await request(app).get('/api/route-inexistante');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ressource introuvable.' });
  });
});

describe('Validation des entrées (avant tout accès base)', () => {
  it('POST /register — corps vide → 400 avec détails de champs', async () => {
    const res = await request(app).post('/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
    expect(res.body.details).toHaveProperty('email');
  });

  it('POST /login — mot de passe manquant → 400', async () => {
    const res = await request(app).post('/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('POST /reset-password — jeton manquant → 400', async () => {
    const res = await request(app).post('/reset-password').send({ password: 'Azerty123' });
    expect(res.status).toBe(400);
  });

  it('GET /api/products/:id — id non numérique → 400 (validateIdParam)', async () => {
    const res = await request(app).get('/api/products/abc');
    expect(res.status).toBe(400);
  });
});

describe('Authentification requise', () => {
  it('GET /api/prestations sans token → 401', async () => {
    const res = await request(app).get('/api/prestations');
    expect(res.status).toBe(401);
  });

  it('GET /api/notifications sans token → 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/notifications sans token → 401 (réservé admin)', async () => {
    const res = await request(app).get('/api/admin/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/notifications/page sans token → 401 (centre salon)', async () => {
    const res = await request(app).get('/api/notifications/page');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/notifications/:id sans token → 401', async () => {
    const res = await request(app).delete('/api/notifications/1');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/admin/notifications/:id sans token → 401', async () => {
    const res = await request(app).delete('/api/admin/notifications/1');
    expect(res.status).toBe(401);
  });

  it('GET /api/users/me/export sans token → 401 (RGPD, protégé)', async () => {
    const res = await request(app).get('/api/users/me/export');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/users/me sans token → 401 (RGPD, protégé)', async () => {
    const res = await request(app).delete('/api/users/me').send({ password: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Documentation OpenAPI (publique)', () => {
  it('GET /api/docs.json → 200 spec OpenAPI valide', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info?.title).toBe('Coifili API');
    expect(res.body.paths).toHaveProperty('/health');
  });

  it('GET /api/docs → 200 HTML', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Coifili API');
  });
});

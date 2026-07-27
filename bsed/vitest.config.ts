import { defineConfig } from 'vitest/config';

/**
 * Tests unitaires du backend (logique pure : dates/créneaux, validation,
 * pagination). Ne touchent pas la base de données — rapides et déterministes.
 */
export default defineConfig({
  // Empêche Vite de remonter au postcss.config.mjs du frontend (non pertinent
  // pour des tests de logique pure côté serveur).
  css: { postcss: { plugins: [] } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
});

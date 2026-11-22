import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// VITE_FIXTURE=1 remplace le registre des enquêtes par l'enquête de test
// (vérifications d'interface). Le build normal n'en contient aucune trace.
const fixture = process.env.VITE_FIXTURE === '1';
const cases = fixture ? './src/game/__tests__/uiFixture.ts' : './src/content/cases/index.ts';

export default defineConfig({
  plugins: [react()],
  // Version du build : nomme le cache hors ligne (public/sw.js).
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  resolve: {
    alias: { '@paraline/cases': fileURLToPath(new URL(cases, import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

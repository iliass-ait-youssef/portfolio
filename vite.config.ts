import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages sert le site sous https://Zenith0k1.github.io/<nom-du-repo>/
// Si le repo s'appelle "portfolio"          -> base: '/portfolio/'
// Si le repo s'appelle "Zenith0k1.github.io" -> base: '/'
// C'est la SEULE ligne a changer selon ton choix de nom de repo.
export default defineConfig({
  base: '/portfolio/',
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative base so the same build works on the GitHub Pages project URL
// (/brij-mold-makers/) now and on a custom domain later.
export default defineConfig({
  base: './',
  server: { port: 5181, open: false },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        design: resolve(import.meta.dirname, 'index.html'),
        mold: resolve(import.meta.dirname, 'mold-manufacturing.html'),
        production: resolve(import.meta.dirname, 'production.html'),
      },
    },
  },
});

import { defineConfig } from 'vite';

// Relative base so the same build works on the GitHub Pages project URL
// (/brij-mold-makers/) now and on a custom domain later.
export default defineConfig({
  base: './',
  server: { port: 5181, open: false },
  build: { outDir: 'dist' },
});

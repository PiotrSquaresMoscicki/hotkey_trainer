import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Set the base path for GitHub Pages
  build: {
    outDir: 'dist', // Output directory for the build
  },
});
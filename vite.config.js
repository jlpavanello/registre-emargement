import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/registre-emargement/',
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      output: {
        manualChunks: {
          'pdf-libs': ['jspdf'],
          'supabase': ['@supabase/supabase-js'],
          'storage': ['idb'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

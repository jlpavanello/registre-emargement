import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/**'],
      exclude: ['src/modules/supabase/**', 'src/modules/auth/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/modules'),
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        '**/index.js',
        '**/index.ts',
        'src/main.jsx',
      ],
    },
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      ...configDefaults.exclude,
      'e2e/*',
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@store': '/src/store',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@api': '/src/api',
    },
  },
});

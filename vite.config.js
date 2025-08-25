import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Different base paths for different deployment scenarios
  const base = process.env.VITE_BASE_PATH || 
    (mode === 'production' ? '/static/front/' : '/');

  return {
    plugins: [react()],
    base: base,
    build: {
      // Output directory for production build
      outDir: 'dist',
      // Generate source maps for better debugging in production
      sourcemap: mode !== 'production',
      // Optimize chunk sizes
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            utils: ['axios', 'date-fns', 'zustand'],
          },
        },
      },
      // Minify for production
      minify: mode === 'production' ? 'terser' : false,
      // Set chunk size warning limit (in kB)
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // Development server configuration
      port: 5173,
      strictPort: false,
      open: true,
      // Proxy API requests to backend during development
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      // Preview server configuration
      port: 4173,
      strictPort: false,
      open: true,
    },
  };
});

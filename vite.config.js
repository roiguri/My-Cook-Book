import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDependencies: false,
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      input: {
        // SPA Architecture - Single Page Application
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }
          
          // Core SPA modules
          if (id.includes('/src/app/core/')) {
            return 'spa-core';
          }
          
          // Services
          if (id.includes('/src/js/services/')) {
            return 'services';
          }
          
          // Auth components
          if (id.includes('/src/lib/auth/')) {
            return 'auth-components';
          }
          
          // Search and navigation
          if (id.includes('/src/lib/search/') || id.includes('navigation-script')) {
            return 'search-nav';
          }
          
          // Page modules - lazy loaded, don't chunk
          if (id.includes('/src/app/pages/')) {
            return `page-${id.split('/').pop().replace('.js', '')}`;
          }
        }
      }
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Enable History API fallback for SPA routing in development
    historyApiFallback: {
      // Fallback to index.html for any route that doesn't match static files
      rewrites: [
        { from: /^\/(?!src|img|css|js).*$/, to: '/index.html' }
      ]
    }
  }
});

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
        manualChunks: {
          // Vendor libraries
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-react': ['react', 'react-dom'],
          
          // Core SPA modules
          'spa-core': [
            './src/app/core/router.js',
            './src/app/core/page-manager.js'
          ],
          
          // Services
          'services': [
            './src/js/services/firebase-service.js',
            './src/js/services/auth-service.js',
            './src/js/services/firestore-service.js',
            './src/js/services/storage-service.js'
          ],
          
          // Auth components
          'auth-components': [
            './src/lib/auth/auth-controller.js',
            './src/lib/auth/components/auth-avatar.js',
            './src/lib/auth/components/auth-content.js',
            './src/lib/auth/components/login-form.js',
            './src/lib/auth/components/signup-form.js',
            './src/lib/auth/components/forgot-password.js',
            './src/lib/auth/components/user-profile.js'
          ],
          
          // Search and navigation
          'search-nav': [
            './src/lib/search/header-search-bar/header-search-bar.js',
            './src/js/navigation-script.js'
          ]
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

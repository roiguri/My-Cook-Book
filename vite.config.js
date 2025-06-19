import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDependencies: false,
  build: {
    rollupOptions: {
      input: {
        // SPA Architecture - Single Page Application
        main: resolve(__dirname, 'index.html'),
      },
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
      rewrites: [{ from: /^\/(?!src|img|css|js|.*\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)).*$/, to: '/index.html' }],
    },
  },
});

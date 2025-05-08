import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
  base: '/My-Cook-Book/',
  plugins: [react()],
  optimizeDependencies: false,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        categories: resolve(__dirname, 'pages/categories.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        proposeRecipe: resolve(__dirname, 'pages/propose-recipe.html'),
        recipePage: resolve(__dirname, 'pages/recipe-page.html'),
        managerDashboard: resolve(__dirname, 'pages/manager-dashboard.html'),
        documents: resolve(__dirname, 'pages/documents.html'),
      },
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
});

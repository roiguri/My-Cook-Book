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
});

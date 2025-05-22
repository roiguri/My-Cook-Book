import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react({
      // Only process files that explicitly use React
      include: [
        /\.(jsx|tsx)$/, // Only .jsx and .tsx files
        /\.react\.(js|ts)$/, // Or files named *.react.js/ts
      ],
      // Explicitly exclude HTML files and your current JS files
      exclude: [
        /\.html$/,
        /src\/pages\/.*\.js$/,
        /src\/js\/.*\.js$/,
        /index\.js$/,
      ]
    })
  ],
  optimizeDependencies: false,
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
});

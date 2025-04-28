import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/My-Cook-Book/',
    plugins: [react()],
    optimizeDependencies: false
}); 
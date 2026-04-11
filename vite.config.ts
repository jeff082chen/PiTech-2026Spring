import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_URL lets you set the public base path at deploy time.
// - Vercel / Netlify: leave unset (defaults to '/')
// - GitHub Pages at /{repo-name}/: set VITE_BASE_URL=/{repo-name}/
// Example: VITE_BASE_URL=/family-policing/ npm run build

export default defineConfig({
  plugins: [react()],

  base: process.env.VITE_BASE_URL ?? '/',

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split vendor bundle from app code for better cache efficiency
        manualChunks: {
          react:  ['react', 'react-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
});

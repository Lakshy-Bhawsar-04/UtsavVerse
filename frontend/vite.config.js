/**
 * frontend/vite.config.js
 * Standalone Vite configuration for the UtsavVerse React JSX frontend.
 * Proxies /api and /uploads requests to the separate Express backend on Port 5000.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-unbundled-src-assets',
      apply: 'build',
      closeBundle(error) {
        if (error) return;
        const distDir = path.resolve(__dirname, 'dist');
        const srcAssets = path.resolve(__dirname, 'src/assets');
        const distAssets = path.resolve(distDir, 'src/assets');
        if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
          fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
        }
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const frontendDir = path.resolve(__dirname, 'frontend');
  const rootDistDir = path.resolve(__dirname, 'dist');

  return {
    root: frontendDir,
    publicDir: path.resolve(frontendDir, 'public'),
    plugins: [
      react(),
      // Copies frontend/src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." still resolve in production builds.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const srcAssets = path.resolve(frontendDir, 'src/assets');
          const distAssets = path.resolve(rootDistDir, 'src/assets');
          if (fs.existsSync(rootDistDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    build: {
      outDir: rootDistDir,
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': frontendDir,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

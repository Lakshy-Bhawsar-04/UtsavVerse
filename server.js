/**
 * server.js (Root Unified Full-Stack Entry Point)
 * Connects MongoDB Atlas, mounts UtsavVerse Express API routes,
 * and serves the Vite React JSX frontend on Port 3000.
 */

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './backend/config/db.js';
import { ensureSeeded } from './backend/utils/dataStore.js';
import { createBackendApp } from './backend/app.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startUnifiedServer() {
  // 1. Connect MongoDB Atlas before starting Express
  await connectDB();
  await ensureSeeded();

  // 2. Create Express API application
  const app = createBackendApp();

  // 3. Attach Vite dev middleware or production static bundle
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UtsavVerse] Full-stack server running at http://localhost:${PORT}`);
  });
}

startUnifiedServer().catch((err) => {
  console.error('[UtsavVerse] Failed to start server:', err);
  process.exit(1);
});

/**
 * backend/server.js
 * Standalone Express backend entry point (runs on PORT 5000 by default).
 * Connects to MongoDB Atlas via config/db.js BEFORE starting the Express server.
 */

import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { ensureSeeded } from './utils/dataStore.js';
import { createBackendApp } from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  await connectDB();
  await ensureSeeded();

  const app = createBackendApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UtsavVerse Backend] Express server running at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('[UtsavVerse Backend] Fatal startup error:', err);
  process.exit(1);
});

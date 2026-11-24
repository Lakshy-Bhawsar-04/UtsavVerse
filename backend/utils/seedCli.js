/**
 * backend/utils/seedCli.js
 * Run `npm run seed` to connect to MongoDB Atlas and populate categories and sample Indian events.
 */

import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { ensureSeeded } from './dataStore.js';

dotenv.config();

const runSeed = async () => {
  await connectDB();
  await ensureSeeded();
  console.log('[Seed CLI] Database seed complete.');
  process.exit(0);
};

runSeed().catch((err) => {
  console.error('[Seed CLI] Error:', err);
  process.exit(1);
});

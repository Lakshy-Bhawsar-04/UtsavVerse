/**
 * backend/app.js
 * Configures Express middleware, static uploads, and all REST API routes.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { UPLOAD_DIR } from './middleware/uploadMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { isMongoConnected } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createBackendApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve Multer-uploaded event images
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      service: 'UtsavVerse API',
      database: isMongoConnected() ? 'mongodb_atlas' : 'local_store',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount domain routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/organizer', organizerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/public', publicRoutes);

  // API 404 handler (only for unmatched /api/* paths so SPA routes fall through)
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.originalUrl}`,
    });
  });

  app.use(errorHandler);
  return app;
};

export default createBackendApp;

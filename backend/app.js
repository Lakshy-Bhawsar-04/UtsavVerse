
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

import { errorHandler } from './middleware/errorMiddleware.js';
import { isMongoConnected } from './config/db.js';

const createBackendApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map(url => url.trim())
        : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      service: 'UtsavVerse API',
      database: isMongoConnected()
        ? 'mongodb_atlas'
        : 'local_store',
      imageStorage: isMongoConnected()
        ? 'mongodb_gridfs'
        : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/organizer', organizerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/public', publicRoutes);

  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.originalUrl}`,
    });
  });

  app.use(errorHandler);

  return app;
};

export { createBackendApp };
export default createBackendApp;

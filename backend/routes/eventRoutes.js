
import express from 'express';

import {
  getEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getCategoriesPublic,
  getCitiesPublic,
  getEventById,
  getEventImage,
  createEvent,
  updateEvent,
  deleteEvent,
  handleImageUpload,
} from '../controllers/eventController.js';

import {
  protect,
  organizerOrAdmin,
  requireApprovedOrganizer,
} from '../middleware/authMiddleware.js';

import { uploadEventImage } from '../middleware/uploadMiddleware.js';
import { validateEventPayload } from '../middleware/validateMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/categories', getCategoriesPublic);
router.get('/cities', getCitiesPublic);

// GridFS image route
router.get('/images/:id', getEventImage);

// Upload event image
router.post(
  '/upload',
  protect,
  organizerOrAdmin,
  uploadEventImage.single('image'),
  handleImageUpload
);

// Event CRUD
router.post(
  '/',
  protect,
  requireApprovedOrganizer,
  validateEventPayload,
  createEvent
);

router.get('/:id', getEventById);

router.put('/:id', protect, organizerOrAdmin, updateEvent);

router.delete('/:id', protect, organizerOrAdmin, deleteEvent);

export default router;

import express from 'express';
import {
  getOrganizerDashboard,
  getOrganizerEvents,
  getOrganizerBookings,
  getOrganizerAttendees,
  updateOrganizerProfile,
} from '../controllers/organizerController.js';
import { protect, organizerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, organizerOrAdmin);
router.get('/dashboard', getOrganizerDashboard);
router.get('/events', getOrganizerEvents);
router.get('/bookings', getOrganizerBookings);
router.get('/attendees', getOrganizerAttendees);
router.put('/profile', updateOrganizerProfile);

export default router;

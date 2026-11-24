import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllOrganizers,
  updateOrganizerApproval,
  getAllEventsAdmin,
  updateEventApproval,
  getCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  getCitiesAdmin,
  createCity,
  updateCity,
  deleteCity,
  getAllBookingsAdmin,
  getAllPaymentsAdmin,
  getAllReviewsAdmin,
  deleteReviewAdmin,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/organizers', getAllOrganizers);
router.put('/organizers/:id/approval', updateOrganizerApproval);
router.get('/events', getAllEventsAdmin);
router.put('/events/:id/approval', updateEventApproval);
router.get('/categories', getCategoriesAdmin);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/cities', getCitiesAdmin);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);
router.get('/bookings', getAllBookingsAdmin);
router.get('/payments', getAllPaymentsAdmin);
router.get('/reviews', getAllReviewsAdmin);
router.delete('/reviews/:id', deleteReviewAdmin);

export default router;

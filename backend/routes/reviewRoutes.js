import express from 'express';
import { createReview, getEventReviews, getMyReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/event/:eventId', getEventReviews);
router.get('/my-reviews', protect, getMyReviews);
router.post('/', protect, createReview);

export default router;

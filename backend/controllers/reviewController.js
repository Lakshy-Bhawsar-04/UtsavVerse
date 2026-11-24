/**
 * backend/controllers/reviewController.js
 * Verified attendee reviews and star ratings, preventing duplicate reviews per booking.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, title, comment } = req.body;

  if (!bookingId || !rating || Number(rating) < 1 || Number(rating) > 5 || !comment?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Select a star rating (1–5) and write your review feedback.',
    });
  }

  const booking = await store.findBookingById(bookingId);
  if (!booking || String(booking.userId) !== String(req.user._id)) {
    return res.status(404).json({
      success: false,
      message: 'Verified booking not found.',
    });
  }

  if (booking.bookingStatus !== 'confirmed' || booking.paymentStatus !== 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Only confirmed paid bookings can be reviewed.',
    });
  }

  const existing = await store.findReviewByBooking(req.user._id, booking._id);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a review for this booking.',
    });
  }

  const review = await store.createReview({
    userId: req.user._id,
    userName: req.user.name,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    bookingId: booking._id,
    rating: Number(rating),
    title: title?.trim() || '',
    comment: comment.trim(),
  });

  // Recalculate event rating average
  const eventReviews = await store.listReviews({ eventId: booking.eventId, isApproved: true });
  const ratingCount = eventReviews.length;
  const ratingAverage =
    ratingCount > 0
      ? Number(
          (
            eventReviews.reduce((sum, r) => sum + Number(r.rating), 0) / ratingCount
          ).toFixed(1)
        )
      : 0;

  await store.updateEvent(booking.eventId, { ratingAverage, ratingCount });

  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been published.',
    review,
  });
});

export const getEventReviews = asyncHandler(async (req, res) => {
  const reviews = await store.listReviews({ eventId: req.params.eventId, isApproved: true });
  res.json({ success: true, reviews });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await store.listReviews({ userId: req.user._id });
  res.json({ success: true, reviews });
});

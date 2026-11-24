/**
 * backend/controllers/bookingController.js
 * Handles atomic ticket reservation (preventing overbooking), booking creation,
 * booking history, cancellation policy enforcement, and ticket retrieval.
 */

import crypto from 'crypto';
import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const generateBookingCode = () => {
  const year = new Date().getFullYear();
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EVT-${year}-${token}`;
};

export const createBooking = asyncHandler(async (req, res) => {
  const { eventId, ticketCategoryId, quantity, attendeePhone } = req.body;
  const qty = Number(quantity);

  const event = await store.findEventById(eventId);
  if (!event || event.status !== 'approved') {
    return res.status(404).json({
      success: false,
      message: 'This event is unavailable for booking.',
    });
  }

  const tier = (event.ticketCategories || []).find(
    (tc) => String(tc._id) === String(ticketCategoryId)
  );
  if (!tier) {
    return res.status(400).json({
      success: false,
      message: 'Selected ticket category was not found.',
    });
  }

  // Atomic check & decrement of available seats to prevent overbooking
  const updatedEvent = await store.decrementTicketSeats(eventId, ticketCategoryId, qty);
  if (!updatedEvent) {
    return res.status(409).json({
      success: false,
      message: `Insufficient tickets remaining in "${tier.name}". Only ${tier.availableSeats} left.`,
    });
  }

  const unitPrice = Number(tier.price);
  const subtotal = unitPrice * qty;
  const convenienceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + convenienceFee;

  const booking = await store.createBooking({
    bookingCode: generateBookingCode(),
    userId: req.user._id,
    userName: req.user.name,
    userEmail: req.user.email,
    userPhone: attendeePhone?.trim() || req.user.phone || '',
    eventId: event._id,
    eventTitle: event.title,
    eventCategory: event.category,
    eventDate: event.date,
    eventTime: event.time,
    eventVenue: event.venue,
    eventCity: event.city,
    eventImage: event.bannerImage,
    organizerId: event.organizerId,
    ticketCategoryId: String(tier._id),
    ticketCategoryName: tier.name,
    unitPrice,
    quantity: qty,
    convenienceFee,
    totalAmount,
    paymentStatus: 'pending',
    bookingStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Seats reserved. Complete payment to confirm your booking.',
    booking,
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await store.listBookings({ userId: req.user._id });
  const myReviews = await store.listReviews({ userId: req.user._id });
  const reviewedBookingIds = new Set(myReviews.map((r) => String(r.bookingId)));

  const enriched = bookings.map((b) => ({
    ...b,
    hasReviewed: reviewedBookingIds.has(String(b._id)),
  }));

  res.json({ success: true, bookings: enriched });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await store.findBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  const isOwner = String(booking.userId) === String(req.user._id);
  const isOrganizer = String(booking.organizerId) === String(req.user._id);
  if (!isOwner && !isOrganizer && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this booking.',
    });
  }

  res.json({ success: true, booking });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await store.findBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (String(booking.userId) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking.',
    });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'This booking has already been cancelled.',
    });
  }

  // Enforce 24-hour cancellation policy for already-paid bookings
  const hoursUntilEvent =
    (new Date(booking.eventDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (booking.paymentStatus === 'paid' && hoursUntilEvent < 24 && req.user.role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Per booking policy, cancellations are only allowed at least 24 hours before the event.',
    });
  }

  // Restore reserved seats atomically
  await store.restoreTicketSeats(booking.eventId, booking.ticketCategoryId, booking.quantity);

  const updatedBooking = await store.updateBooking(booking._id, {
    bookingStatus: 'cancelled',
    paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'failed',
    cancellationReason: req.body?.reason || 'Cancelled by attendee',
    cancelledAt: new Date().toISOString(),
  });

  await store.createNotification({
    userId: booking.userId,
    title: `Booking ${booking.bookingCode} Cancelled`,
    message:
      booking.paymentStatus === 'paid'
        ? `Your booking for ${booking.eventTitle} was cancelled. Refund of ₹${booking.totalAmount} initiated.`
        : `Pending reservation for ${booking.eventTitle} was released.`,
    type: 'booking',
    link: '/dashboard',
  });

  res.json({
    success: true,
    message:
      booking.paymentStatus === 'paid'
        ? 'Booking cancelled and refund initiated per policy.'
        : 'Reservation cancelled and seats released.',
    booking: updatedBooking,
  });
});

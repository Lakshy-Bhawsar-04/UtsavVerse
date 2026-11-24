/**
 * backend/controllers/organizerController.js
 * Organizer dashboard analytics, event portfolio, booking feed, and attendee list.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const organizerId = req.user._id;
  const events = await store.listEvents({ organizerId });
  const bookings = await store.listBookings({ organizerId });

  const confirmedBookings = bookings.filter(
    (b) => b.bookingStatus === 'confirmed' && b.paymentStatus === 'paid'
  );

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + Number(b.quantity || 0), 0);

  const eventPerformance = events.map((ev) => {
    const evBookings = confirmedBookings.filter((b) => String(b.eventId) === String(ev._id));
    const revenue = evBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const ticketsSold = evBookings.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
    const totalCapacity = (ev.ticketCategories || []).reduce(
      (sum, tc) => sum + Number(tc.totalSeats || 0),
      0
    );
    const availableSeats = (ev.ticketCategories || []).reduce(
      (sum, tc) => sum + Number(tc.availableSeats || 0),
      0
    );
    return {
      _id: ev._id,
      title: ev.title,
      category: ev.category,
      city: ev.city,
      date: ev.date,
      status: ev.status,
      ticketsSold,
      totalCapacity,
      availableSeats,
      revenue,
      ratingAverage: ev.ratingAverage || 0,
    };
  });

  res.json({
    success: true,
    approvalStatus: req.user.organizerProfile?.approvalStatus || 'pending',
    organizerProfile: req.user.organizerProfile,
    stats: {
      totalEvents: events.length,
      approvedEvents: events.filter((e) => e.status === 'approved').length,
      pendingEvents: events.filter((e) => e.status === 'pending').length,
      totalBookings: confirmedBookings.length,
      totalTicketsSold,
      totalRevenue,
    },
    eventPerformance,
  });
});

export const getOrganizerEvents = asyncHandler(async (req, res) => {
  const events = await store.listEvents({ organizerId: req.user._id });
  res.json({ success: true, events });
});

export const getOrganizerBookings = asyncHandler(async (req, res) => {
  const bookings = await store.listBookings({ organizerId: req.user._id });
  res.json({ success: true, bookings });
});

export const getOrganizerAttendees = asyncHandler(async (req, res) => {
  const bookings = await store.listBookings({ organizerId: req.user._id });
  const attendees = bookings
    .filter((b) => b.bookingStatus === 'confirmed')
    .map((b) => ({
      bookingId: b._id,
      bookingCode: b.bookingCode,
      attendeeName: b.userName,
      attendeeEmail: b.userEmail,
      attendeePhone: b.userPhone,
      eventTitle: b.eventTitle,
      ticketCategory: b.ticketCategoryName,
      quantity: b.quantity,
      totalAmount: b.totalAmount,
      bookedAt: b.createdAt,
    }));

  res.json({ success: true, attendees });
});

export const updateOrganizerProfile = asyncHandler(async (req, res) => {
  const { organizationName, bio, website, gstNumber, city } = req.body;
  const currentProfile = req.user.organizerProfile || {};

  const updated = await store.updateUser(req.user._id, {
    organizerProfile: {
      ...currentProfile,
      organizationName: organizationName?.trim() || currentProfile.organizationName,
      bio: bio?.trim() ?? currentProfile.bio,
      website: website?.trim() ?? currentProfile.website,
      gstNumber: gstNumber?.trim() ?? currentProfile.gstNumber,
      city: city?.trim() || currentProfile.city,
    },
  });

  res.json({
    success: true,
    message: 'Organizer profile updated.',
    user: updated,
  });
});

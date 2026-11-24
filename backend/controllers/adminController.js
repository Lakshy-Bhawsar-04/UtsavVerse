/**
 * backend/controllers/adminController.js
 * Complete Admin dashboard metrics, organizer/event approvals, user/category/booking/payment/review management.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [users, events, bookings, payments, categories, reviews] = await Promise.all([
    store.listUsers(),
    store.listEvents(),
    store.listBookings(),
    store.listPayments(),
    store.listCategories(),
    store.listReviews(),
  ]);

  const organizers = users.filter((u) => u.role === 'organizer');
  const regularUsers = users.filter((u) => u.role === 'user');
  const paidBookings = bookings.filter(
    (b) => b.paymentStatus === 'paid' && b.bookingStatus === 'confirmed'
  );
  const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  // Category breakdown for analytics
  const categoryStats = categories.map((cat) => {
    const catEvents = events.filter((e) => e.category === cat.name);
    const catBookings = paidBookings.filter((b) => b.eventCategory === cat.name);
    const catRevenue = catBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    return {
      category: cat.name,
      eventCount: catEvents.length,
      bookingCount: catBookings.length,
      revenue: catRevenue,
    };
  });

  res.json({
    success: true,
    stats: {
      totalUsers: regularUsers.length,
      totalAllAccounts: users.length,
      totalOrganizers: organizers.length,
      pendingOrganizers: organizers.filter(
        (o) => o.organizerProfile?.approvalStatus === 'pending'
      ).length,
      totalEvents: events.length,
      pendingEvents: events.filter((e) => e.status === 'pending').length,
      totalBookings: bookings.length,
      confirmedBookings: paidBookings.length,
      totalRevenue,
      totalPayments: payments.length,
      totalReviews: reviews.length,
    },
    categoryStats,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await store.listUsers();
  res.json({ success: true, users });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await store.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate your own admin account.' });
  }
  const updated = await store.updateUser(user._id, { isActive: user.isActive === false });
  res.json({
    success: true,
    message: `User ${updated.isActive ? 'activated' : 'deactivated'}.`,
    user: updated,
  });
});

export const getAllOrganizers = asyncHandler(async (req, res) => {
  const organizers = await store.listUsers({ role: 'organizer' });
  res.json({ success: true, organizers });
});

export const updateOrganizerApproval = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid approval status.' });
  }

  const organizer = await store.findUserById(req.params.id);
  if (!organizer || organizer.role !== 'organizer') {
    return res.status(404).json({ success: false, message: 'Organizer not found.' });
  }

  const updated = await store.updateUser(organizer._id, {
    organizerProfile: {
      ...(organizer.organizerProfile || {}),
      approvalStatus: status,
      rejectionReason: status === 'rejected' ? rejectionReason || 'Does not meet verification guidelines' : '',
    },
  });

  await store.createNotification({
    userId: organizer._id,
    title: `Organizer Application ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'}`,
    message:
      status === 'approved'
        ? 'Your organizer profile is approved. You can now publish events on UtsavVerse.'
        : `Your organizer status was updated to ${status}. ${rejectionReason || ''}`,
    type: 'approval',
    link: '/organizer/dashboard',
  });

  res.json({
    success: true,
    message: `Organizer status updated to ${status}.`,
    organizer: updated,
  });
});

export const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const events = await store.listEvents();
  res.json({ success: true, events });
});

export const updateEventApproval = asyncHandler(async (req, res) => {
  const { status, isFeatured, rejectionReason } = req.body;
  const event = await store.findEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const updates = {};
  if (status && ['approved', 'rejected', 'pending'].includes(status)) {
    updates.status = status;
    updates.rejectionReason = status === 'rejected' ? rejectionReason || '' : '';
  }
  if (typeof isFeatured === 'boolean') {
    updates.isFeatured = isFeatured;
  }

  const updated = await store.updateEvent(event._id, updates);

  if (status) {
    await store.createNotification({
      userId: event.organizerId,
      title: `Event "${event.title}" ${status}`,
      message:
        status === 'approved'
          ? 'Your event is now live on UtsavVerse Explore.'
          : `Your event status was set to ${status}. ${rejectionReason || ''}`,
      type: 'approval',
      link: `/events/${event._id}`,
    });
  }

  res.json({
    success: true,
    message: 'Event updated successfully.',
    event: updated,
  });
});

export const getCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await store.listCategories(false);
  res.json({ success: true, categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const category = await store.createCategory({
    name: name.trim(),
    slug,
    description: description?.trim() || '',
    icon: icon || 'FiCalendar',
  });

  res.status(201).json({ success: true, message: 'Category created.', category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = await store.updateCategory(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }
  res.json({ success: true, message: 'Category updated.', category: updated });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const removed = await store.deleteCategory(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }
  res.json({ success: true, message: 'Category deleted.' });
});

export const getCitiesAdmin = asyncHandler(async (req, res) => {
  const cities = await store.listCities(false);
  res.json({ success: true, cities });
});

export const createCity = asyncHandler(async (req, res) => {
  const { name, state } = req.body;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'City name is required.' });
  }
  const cleanName = name.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const city = await store.createCity({
    name: cleanName,
    slug,
    state: state?.trim() || '',
  });

  res.status(201).json({ success: true, message: 'City added.', city });
});

export const updateCity = asyncHandler(async (req, res) => {
  const updated = await store.updateCity(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'City not found.' });
  }
  res.json({ success: true, message: 'City updated.', city: updated });
});

export const deleteCity = asyncHandler(async (req, res) => {
  const removed = await store.deleteCity(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'City not found.' });
  }
  res.json({ success: true, message: 'City deleted.' });
});

export const getAllBookingsAdmin = asyncHandler(async (req, res) => {
  const bookings = await store.listBookings();
  res.json({ success: true, bookings });
});

export const getAllPaymentsAdmin = asyncHandler(async (req, res) => {
  const payments = await store.listPayments();
  res.json({ success: true, payments });
});

export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await store.listReviews();
  res.json({ success: true, reviews });
});

export const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const removed = await store.deleteReview(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Review not found.' });
  }
  res.json({ success: true, message: 'Review removed.' });
});

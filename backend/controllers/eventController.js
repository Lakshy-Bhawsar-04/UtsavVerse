/**
 * backend/controllers/eventController.js
 * Event discovery, filtering, sorting, pagination, CRUD, and Multer image upload.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { IMAGES } from '../utils/seedData.js';

const getMinPrice = (event) => {
  if (!Array.isArray(event.ticketCategories) || event.ticketCategories.length === 0) return 0;
  return Math.min(...event.ticketCategories.map((t) => Number(t.price || 0)));
};

export const getEvents = asyncHandler(async (req, res) => {
  const {
    search = '',
    category = '',
    location = '',
    dateFilter = '',
    minPrice = '',
    maxPrice = '',
    sort = 'date_asc',
    page = 1,
    limit = 9,
  } = req.query;

  let events = await store.listEvents({ status: 'approved' });

  // Search across title, description, venue, city, organizer
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    events = events.filter(
      (ev) =>
        ev.title?.toLowerCase().includes(q) ||
        ev.shortDescription?.toLowerCase().includes(q) ||
        ev.category?.toLowerCase().includes(q) ||
        ev.city?.toLowerCase().includes(q) ||
        ev.venue?.toLowerCase().includes(q) ||
        ev.organizerName?.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (category && category !== 'All') {
    events = events.filter((ev) => ev.category.toLowerCase() === category.toLowerCase());
  }

  // Location / city filter
  if (location && location !== 'All') {
    const loc = location.trim().toLowerCase();
    events = events.filter(
      (ev) => ev.city?.toLowerCase().includes(loc) || ev.state?.toLowerCase().includes(loc)
    );
  }

  // Date filter
  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    events = events.filter((ev) => {
      const evDate = new Date(ev.date);
      if (dateFilter === 'upcoming') return evDate >= startOfToday;
      if (dateFilter === 'this_week') {
        const weekAhead = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
        return evDate >= startOfToday && evDate <= weekAhead;
      }
      if (dateFilter === 'this_month') {
        return (
          evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth()
        );
      }
      if (dateFilter === 'next_30_days') {
        const monthAhead = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);
        return evDate >= startOfToday && evDate <= monthAhead;
      }
      return true;
    });
  }

  // Price filter (uses starting ticket price)
  if (minPrice !== '' && !Number.isNaN(Number(minPrice))) {
    events = events.filter((ev) => getMinPrice(ev) >= Number(minPrice));
  }
  if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
    events = events.filter((ev) => getMinPrice(ev) <= Number(maxPrice));
  }

  // Sorting
  events.sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return getMinPrice(a) - getMinPrice(b);
      case 'price_desc':
        return getMinPrice(b) - getMinPrice(a);
      case 'rating_desc':
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date_asc':
      default:
        return new Date(a.date) - new Date(b.date);
    }
  });

  // Extract distinct cities from active managed cities + approved events
  const [allApproved, managedCities] = await Promise.all([
    store.listEvents({ status: 'approved' }),
    store.listCities(true),
  ]);
  const availableCities = Array.from(
    new Set([
      ...managedCities.map((c) => c.name),
      ...allApproved.map((e) => e.city),
    ])
  ).sort();

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.max(1, Math.min(24, Number(limit) || 9));
  const total = events.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (pageNum - 1) * perPage;
  const paginatedEvents = events.slice(start, start + perPage);

  res.json({
    success: true,
    events: paginatedEvents,
    availableCities,
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      totalPages,
    },
  });
});

export const getFeaturedEvents = asyncHandler(async (req, res) => {
  const events = await store.listEvents({ status: 'approved', isFeatured: true });
  res.json({ success: true, events: events.slice(0, 6) });
});

export const getUpcomingEvents = asyncHandler(async (req, res) => {
  const now = new Date();
  const events = (await store.listEvents({ status: 'approved' }))
    .filter((ev) => new Date(ev.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json({ success: true, events: events.slice(0, 6) });
});

export const getCategoriesPublic = asyncHandler(async (req, res) => {
  const [categories, events] = await Promise.all([
    store.listCategories(true),
    store.listEvents({ status: 'approved' }),
  ]);

  const enriched = categories.map((cat) => ({
    ...cat,
    eventCount: events.filter((e) => e.category.toLowerCase() === cat.name.toLowerCase()).length,
  }));

  res.json({ success: true, categories: enriched });
});

export const getCitiesPublic = asyncHandler(async (req, res) => {
  const [cities, events] = await Promise.all([
    store.listCities(true),
    store.listEvents({ status: 'approved' }),
  ]);

  const enriched = cities.map((city) => ({
    ...city,
    eventCount: events.filter((e) => e.city?.toLowerCase() === city.name.toLowerCase()).length,
  }));

  res.json({ success: true, cities: enriched });
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await store.findEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const [reviews, allApproved] = await Promise.all([
    store.listReviews({ eventId: event._id, isApproved: true }),
    store.listEvents({ status: 'approved' }),
  ]);

  const relatedEvents = allApproved
    .filter((ev) => String(ev._id) !== String(event._id) && ev.category === event.category)
    .slice(0, 3);

  const fallbackRelated =
    relatedEvents.length > 0
      ? relatedEvents
      : allApproved.filter((ev) => String(ev._id) !== String(event._id)).slice(0, 3);

  res.json({
    success: true,
    event,
    reviews,
    relatedEvents: fallbackRelated,
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    shortDescription,
    description,
    category,
    date,
    time,
    venue,
    address,
    city,
    state,
    bannerImage,
    galleryImages,
    ticketCategories,
    cancellationPolicy,
  } = req.body;

  const slug = `${title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

  const formattedTickets = ticketCategories.map((tc) => ({
    name: tc.name.trim(),
    description: tc.description?.trim() || '',
    price: Number(tc.price),
    totalSeats: Number(tc.totalSeats),
    availableSeats: Number(tc.availableSeats ?? tc.totalSeats),
  }));

  const eventPayload = {
    title: title.trim(),
    slug,
    shortDescription: shortDescription.trim(),
    description: description.trim(),
    category: category.trim(),
    organizerId: req.user._id,
    organizerName: req.user.organizerProfile?.organizationName || req.user.name,
    organizerEmail: req.user.email,
    date: new Date(date).toISOString(),
    time: time.trim(),
    venue: venue.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state?.trim() || '',
    bannerImage: bannerImage || IMAGES.concert,
    galleryImages: Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages : [bannerImage || IMAGES.concert],
    ticketCategories: formattedTickets,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    isFeatured: false,
    cancellationPolicy:
      cancellationPolicy || 'Full refund available up to 24 hours prior to the event start time.',
  };

  const event = await store.createEvent(eventPayload);

  res.status(201).json({
    success: true,
    message:
      event.status === 'approved'
        ? 'Event created and published.'
        : 'Event submitted for admin approval.',
    event,
  });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await store.findEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const isOwner = String(event.organizerId) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to edit this event.',
    });
  }

  const updates = { ...req.body };
  if (Array.isArray(updates.ticketCategories)) {
    updates.ticketCategories = updates.ticketCategories.map((tc) => ({
      _id: tc._id,
      name: tc.name.trim(),
      description: tc.description?.trim() || '',
      price: Number(tc.price),
      totalSeats: Number(tc.totalSeats),
      availableSeats: Math.min(Number(tc.totalSeats), Number(tc.availableSeats ?? tc.totalSeats)),
    }));
  }
  if (updates.date) {
    updates.date = new Date(updates.date).toISOString();
  }
  if (updates.bannerImage && !Array.isArray(updates.galleryImages)) {
    const existingGallery = Array.isArray(event.galleryImages) ? event.galleryImages : [];
    if (existingGallery.length <= 1 || existingGallery[0] === event.bannerImage) {
      updates.galleryImages = [updates.bannerImage, ...existingGallery.slice(1)];
    }
  }

  // Never let non-admin force-approve their own event
  if (req.user.role !== 'admin') {
    delete updates.status;
    delete updates.isFeatured;
  }

  const updated = await store.updateEvent(event._id, updates);

  res.json({
    success: true,
    message: 'Event updated successfully.',
    event: updated,
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await store.findEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const isOwner = String(event.organizerId) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this event.',
    });
  }

  await store.deleteEvent(event._id);
  res.json({ success: true, message: 'Event deleted successfully.' });
});

export const handleImageUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file.' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully.',
    imageUrl,
  });
});

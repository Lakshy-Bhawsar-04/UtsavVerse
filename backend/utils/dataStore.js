/**
 * backend/utils/dataStore.js
 * Unified data access layer supporting MongoDB Atlas (via Mongoose)
 * and automatic JSON file fallback when MONGO_URI is not configured yet.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { isMongoConnected } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import City from '../models/City.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Subscriber from '../models/Subscriber.js';
import ContactMessage from '../models/ContactMessage.js';
import { INITIAL_CATEGORIES, INITIAL_CITIES, buildInitialEvents } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(STORE_DIR, 'localStore.json');

export const generateObjectId = () => crypto.randomBytes(12).toString('hex');

const sanitizeUser = (u) => {
  if (!u) return null;
  const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

const readLocalStore = () => {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const empty = {
      users: [],
      categories: [],
      cities: [],
      events: [],
      bookings: [],
      payments: [],
      reviews: [],
      notifications: [],
      subscribers: [],
      contacts: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
};

const writeLocalStore = (data) => {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
};

/**
 * Ensures initial categories and sample Indian events exist in whichever
 * storage engine is active (MongoDB Atlas or local JSON store).
 * Does NOT hardcode user passwords into client code.
 */
export const ensureSeeded = async () => {
  if (isMongoConnected()) {
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(INITIAL_CATEGORIES);
      console.log('[Seed] Inserted 10 UtsavVerse categories into MongoDB.');
    }

    const cityCount = await City.countDocuments();
    if (cityCount === 0) {
      await City.insertMany(INITIAL_CITIES);
      console.log('[Seed] Inserted 10 UtsavVerse cities into MongoDB.');
    }

    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      let hostUser = await User.findOne({ role: 'organizer' });
      if (!hostUser) {
        const randomSecret = crypto.randomBytes(16).toString('hex');
        hostUser = await User.create({
          name: 'Aarav Mehta',
          email: 'curator@UtsavVerse.in',
          password: process.env.SEED_ORGANIZER_PASSWORD || randomSecret,
          phone: '+91 98200 11223',
          city: 'Mumbai',
          role: 'organizer',
          organizerProfile: {
            organizationName: 'Aarav Live Productions',
            bio: 'Curating premier concerts, festivals, and cultural experiences across India.',
            city: 'Mumbai',
            approvalStatus: 'approved',
          },
        });
      }
      const eventsPayload = buildInitialEvents(hostUser._id);
      await Event.insertMany(eventsPayload);
      console.log(`[Seed] Inserted ${eventsPayload.length} curated Indian events into MongoDB.`);
    }
    return;
  }

  // Local store seed
  const db = readLocalStore();
  let changed = false;

  if (!db.categories || db.categories.length === 0) {
    db.categories = INITIAL_CATEGORIES.map((c) => ({
      _id: generateObjectId(),
      ...c,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
    changed = true;
  }

  if (!db.cities || db.cities.length === 0) {
    db.cities = INITIAL_CITIES.map((c) => ({
      _id: generateObjectId(),
      ...c,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
    changed = true;
  }

  if (!db.events || db.events.length === 0) {
    let hostUser = db.users.find((u) => u.role === 'organizer');
    if (!hostUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);
      hostUser = {
        _id: generateObjectId(),
        name: 'Aarav Mehta',
        email: 'curator@UtsavVerse.in',
        password: hashedPassword,
        phone: '+91 98200 11223',
        city: 'Mumbai',
        role: 'organizer',
        organizerProfile: {
          organizationName: 'Aarav Live Productions',
          bio: 'Curating premier concerts, festivals, and cultural experiences across India.',
          city: 'Mumbai',
          approvalStatus: 'approved',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(hostUser);
    }

    const rawEvents = buildInitialEvents(hostUser._id);
    db.events = rawEvents.map((ev) => ({
      _id: generateObjectId(),
      ...ev,
      date: ev.date.toISOString(),
      ticketCategories: ev.ticketCategories.map((tc) => ({
        _id: generateObjectId(),
        ...tc,
      })),
      cancellationPolicy: 'Full refund available up to 24 hours prior to the event start time.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    changed = true;
  }

  if (changed) {
    writeLocalStore(db);
    console.log('[Seed] Initialized local store with 10 categories and curated Indian events.');
  }
};

export const store = {
  // ---------------- USERS ----------------
  async findUserByEmail(email, includePassword = false) {
    const normalized = email.trim().toLowerCase();
    if (isMongoConnected()) {
      const q = User.findOne({ email: normalized });
      if (includePassword) q.select('+password');
      const u = await q;
      return u ? u.toObject() : null;
    }
    const db = readLocalStore();
    const user = db.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) return null;
    return includePassword ? { ...user } : sanitizeUser(user);
  },

  async findUserById(id, includePassword = false) {
    if (isMongoConnected()) {
      const q = User.findById(id);
      if (includePassword) q.select('+password');
      const u = await q;
      return u ? u.toObject() : null;
    }
    const db = readLocalStore();
    const user = db.users.find((u) => String(u._id) === String(id));
    if (!user) return null;
    return includePassword ? { ...user } : sanitizeUser(user);
  },

  async countUsers(filter = {}) {
    if (isMongoConnected()) return User.countDocuments(filter);
    const db = readLocalStore();
    return db.users.filter((u) =>
      Object.entries(filter).every(([k, v]) => u[k] === v)
    ).length;
  },

  async createUser(payload) {
    if (isMongoConnected()) {
      const created = await User.create(payload);
      return sanitizeUser(created);
    }
    const db = readLocalStore();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);
    const now = new Date().toISOString();
    const user = {
      _id: generateObjectId(),
      name: payload.name,
      email: payload.email.trim().toLowerCase(),
      password: hashedPassword,
      phone: payload.phone || '',
      city: payload.city || 'Mumbai',
      role: payload.role || 'user',
      organizerProfile: payload.organizerProfile || {
        organizationName: '',
        bio: '',
        website: '',
        gstNumber: '',
        city: '',
        approvalStatus: 'pending',
        rejectionReason: '',
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);
    writeLocalStore(db);
    return sanitizeUser(user);
  },

  async updateUser(id, updates) {
    if (isMongoConnected()) {
      const user = await User.findById(id).select('+password');
      if (!user) return null;
      Object.assign(user, updates);
      await user.save();
      return sanitizeUser(user);
    }
    const db = readLocalStore();
    const idx = db.users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return null;
    const nextUpdates = { ...updates };
    if (nextUpdates.password) {
      const salt = await bcrypt.genSalt(10);
      nextUpdates.password = await bcrypt.hash(nextUpdates.password, salt);
    }
    db.users[idx] = {
      ...db.users[idx],
      ...nextUpdates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(db);
    return sanitizeUser(db.users[idx]);
  },

  async listUsers(filter = {}) {
    if (isMongoConnected()) {
      const users = await User.find(filter).sort({ createdAt: -1 });
      return users.map(sanitizeUser);
    }
    const db = readLocalStore();
    return db.users
      .filter((u) => Object.entries(filter).every(([k, v]) => u[k] === v))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(sanitizeUser);
  },

  // ---------------- CATEGORIES ----------------
  async listCategories(onlyActive = false) {
    if (isMongoConnected()) {
      const filter = onlyActive ? { isActive: true } : {};
      const cats = await Category.find(filter).sort({ name: 1 }).lean();
      return cats;
    }
    const db = readLocalStore();
    return db.categories
      .filter((c) => (onlyActive ? c.isActive !== false : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCategory(payload) {
    if (isMongoConnected()) {
      const cat = await Category.create(payload);
      return cat.toObject();
    }
    const db = readLocalStore();
    const cat = {
      _id: generateObjectId(),
      ...payload,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.categories.push(cat);
    writeLocalStore(db);
    return cat;
  },

  async updateCategory(id, updates) {
    if (isMongoConnected()) {
      return Category.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = readLocalStore();
    const idx = db.categories.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return null;
    db.categories[idx] = { ...db.categories[idx], ...updates };
    writeLocalStore(db);
    return db.categories[idx];
  },

  async deleteCategory(id) {
    if (isMongoConnected()) {
      return Category.findByIdAndDelete(id).lean();
    }
    const db = readLocalStore();
    const idx = db.categories.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.categories.splice(idx, 1);
    writeLocalStore(db);
    return removed;
  },

  // ---------------- CITIES ----------------
  async listCities(onlyActive = false) {
    if (isMongoConnected()) {
      const filter = onlyActive ? { isActive: true } : {};
      return City.find(filter).sort({ name: 1 }).lean();
    }
    const db = readLocalStore();
    return (db.cities || [])
      .filter((c) => (onlyActive ? c.isActive !== false : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async createCity(payload) {
    if (isMongoConnected()) {
      const city = await City.create(payload);
      return city.toObject();
    }
    const db = readLocalStore();
    if (!db.cities) db.cities = [];
    const exists = db.cities.find(
      (c) =>
        c.name.toLowerCase() === payload.name.toLowerCase() ||
        c.slug === payload.slug
    );
    if (exists) {
      const err = new Error('This city already exists.');
      err.statusCode = 400;
      throw err;
    }
    const city = {
      _id: generateObjectId(),
      ...payload,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.cities.push(city);
    writeLocalStore(db);
    return city;
  },

  async updateCity(id, updates) {
    if (isMongoConnected()) {
      return City.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = readLocalStore();
    if (!db.cities) return null;
    const idx = db.cities.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return null;
    db.cities[idx] = { ...db.cities[idx], ...updates };
    writeLocalStore(db);
    return db.cities[idx];
  },

  async deleteCity(id) {
    if (isMongoConnected()) {
      return City.findByIdAndDelete(id).lean();
    }
    const db = readLocalStore();
    if (!db.cities) return null;
    const idx = db.cities.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.cities.splice(idx, 1);
    writeLocalStore(db);
    return removed;
  },

  // ---------------- EVENTS ----------------
  async listEvents(filter = {}) {
    if (isMongoConnected()) {
      return Event.find(filter).sort({ date: 1 }).lean();
    }
    const db = readLocalStore();
    return db.events
      .filter((ev) => {
        if (filter.status && ev.status !== filter.status) return false;
        if (filter.organizerId && String(ev.organizerId) !== String(filter.organizerId))
          return false;
        if (filter.isFeatured !== undefined && ev.isFeatured !== filter.isFeatured) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async findEventById(id) {
    if (isMongoConnected()) {
      return Event.findById(id).lean();
    }
    const db = readLocalStore();
    return db.events.find((ev) => String(ev._id) === String(id)) || null;
  },

  async createEvent(payload) {
    if (isMongoConnected()) {
      const ev = await Event.create(payload);
      return ev.toObject();
    }
    const db = readLocalStore();
    const now = new Date().toISOString();
    const ev = {
      _id: generateObjectId(),
      ...payload,
      ticketCategories: (payload.ticketCategories || []).map((tc) => ({
        _id: tc._id || generateObjectId(),
        ...tc,
      })),
      ratingAverage: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.events.push(ev);
    writeLocalStore(db);
    return ev;
  },

  async updateEvent(id, updates) {
    if (isMongoConnected()) {
      return Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    }
    const db = readLocalStore();
    const idx = db.events.findIndex((ev) => String(ev._id) === String(id));
    if (idx === -1) return null;
    const nextTickets = updates.ticketCategories
      ? updates.ticketCategories.map((tc) => ({
          _id: tc._id || generateObjectId(),
          ...tc,
        }))
      : db.events[idx].ticketCategories;
    db.events[idx] = {
      ...db.events[idx],
      ...updates,
      ticketCategories: nextTickets,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(db);
    return db.events[idx];
  },

  async deleteEvent(id) {
    if (isMongoConnected()) {
      return Event.findByIdAndDelete(id).lean();
    }
    const db = readLocalStore();
    const idx = db.events.findIndex((ev) => String(ev._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.events.splice(idx, 1);
    writeLocalStore(db);
    return removed;
  },

  /**
   * Atomically reserve/decrement ticket seats to prevent overbooking under concurrency.
   */
  async decrementTicketSeats(eventId, ticketCategoryId, quantity) {
    if (isMongoConnected()) {
      const updated = await Event.findOneAndUpdate(
        {
          _id: eventId,
          status: 'approved',
          ticketCategories: {
            $elemMatch: {
              _id: ticketCategoryId,
              availableSeats: { $gte: quantity },
            },
          },
        },
        {
          $inc: { 'ticketCategories.$.availableSeats': -quantity },
        },
        { new: true }
      ).lean();
      return updated;
    }

    const db = readLocalStore();
    const idx = db.events.findIndex(
      (ev) => String(ev._id) === String(eventId) && ev.status === 'approved'
    );
    if (idx === -1) return null;
    const tierIdx = db.events[idx].ticketCategories.findIndex(
      (tc) => String(tc._id) === String(ticketCategoryId)
    );
    if (tierIdx === -1) return null;
    if (db.events[idx].ticketCategories[tierIdx].availableSeats < quantity) {
      return null;
    }
    db.events[idx].ticketCategories[tierIdx].availableSeats -= quantity;
    db.events[idx].updatedAt = new Date().toISOString();
    writeLocalStore(db);
    return db.events[idx];
  },

  async restoreTicketSeats(eventId, ticketCategoryId, quantity) {
    if (isMongoConnected()) {
      return Event.findOneAndUpdate(
        {
          _id: eventId,
          'ticketCategories._id': ticketCategoryId,
        },
        {
          $inc: { 'ticketCategories.$.availableSeats': quantity },
        },
        { new: true }
      ).lean();
    }

    const db = readLocalStore();
    const idx = db.events.findIndex((ev) => String(ev._id) === String(eventId));
    if (idx === -1) return null;
    const tierIdx = db.events[idx].ticketCategories.findIndex(
      (tc) => String(tc._id) === String(ticketCategoryId)
    );
    if (tierIdx === -1) return null;
    const tier = db.events[idx].ticketCategories[tierIdx];
    tier.availableSeats = Math.min(tier.totalSeats, tier.availableSeats + quantity);
    db.events[idx].updatedAt = new Date().toISOString();
    writeLocalStore(db);
    return db.events[idx];
  },

  // ---------------- BOOKINGS ----------------
  async createBooking(payload) {
    if (isMongoConnected()) {
      const booking = await Booking.create(payload);
      return booking.toObject();
    }
    const db = readLocalStore();
    const now = new Date().toISOString();
    const booking = {
      _id: generateObjectId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    db.bookings.push(booking);
    writeLocalStore(db);
    return booking;
  },

  async findBookingById(id) {
    if (isMongoConnected()) return Booking.findById(id).lean();
    const db = readLocalStore();
    return db.bookings.find((b) => String(b._id) === String(id)) || null;
  },

  async listBookings(filter = {}) {
    if (isMongoConnected()) {
      return Booking.find(filter).sort({ createdAt: -1 }).lean();
    }
    const db = readLocalStore();
    return db.bookings
      .filter((b) =>
        Object.entries(filter).every(([k, v]) => String(b[k]) === String(v))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateBooking(id, updates) {
    if (isMongoConnected()) {
      return Booking.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = readLocalStore();
    const idx = db.bookings.findIndex((b) => String(b._id) === String(id));
    if (idx === -1) return null;
    db.bookings[idx] = {
      ...db.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(db);
    return db.bookings[idx];
  },

  // ---------------- PAYMENTS ----------------
  async createPayment(payload) {
    if (isMongoConnected()) {
      const payment = await Payment.create(payload);
      return payment.toObject();
    }
    const db = readLocalStore();
    const now = new Date().toISOString();
    const payment = {
      _id: generateObjectId(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    db.payments.push(payment);
    writeLocalStore(db);
    return payment;
  },

  async findPaymentByOrderId(razorpayOrderId) {
    if (isMongoConnected()) {
      return Payment.findOne({ razorpayOrderId }).lean();
    }
    const db = readLocalStore();
    return db.payments.find((p) => p.razorpayOrderId === razorpayOrderId) || null;
  },

  async updatePayment(id, updates) {
    if (isMongoConnected()) {
      return Payment.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = readLocalStore();
    const idx = db.payments.findIndex((p) => String(p._id) === String(id));
    if (idx === -1) return null;
    db.payments[idx] = {
      ...db.payments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(db);
    return db.payments[idx];
  },

  async listPayments(filter = {}) {
    if (isMongoConnected()) {
      return Payment.find(filter).sort({ createdAt: -1 }).lean();
    }
    const db = readLocalStore();
    return db.payments
      .filter((p) =>
        Object.entries(filter).every(([k, v]) => String(p[k]) === String(v))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ---------------- REVIEWS ----------------
  async createReview(payload) {
    if (isMongoConnected()) {
      const review = await Review.create(payload);
      return review.toObject();
    }
    const db = readLocalStore();
    const duplicate = db.reviews.find(
      (r) =>
        String(r.userId) === String(payload.userId) &&
        String(r.bookingId) === String(payload.bookingId)
    );
    if (duplicate) {
      const err = new Error('Duplicate review for this booking');
      err.statusCode = 400;
      throw err;
    }
    const now = new Date().toISOString();
    const review = {
      _id: generateObjectId(),
      ...payload,
      isApproved: true,
      createdAt: now,
      updatedAt: now,
    };
    db.reviews.push(review);
    writeLocalStore(db);
    return review;
  },

  async findReviewByBooking(userId, bookingId) {
    if (isMongoConnected()) {
      return Review.findOne({ userId, bookingId }).lean();
    }
    const db = readLocalStore();
    return (
      db.reviews.find(
        (r) => String(r.userId) === String(userId) && String(r.bookingId) === String(bookingId)
      ) || null
    );
  },

  async listReviews(filter = {}) {
    if (isMongoConnected()) {
      return Review.find(filter).sort({ createdAt: -1 }).lean();
    }
    const db = readLocalStore();
    return db.reviews
      .filter((r) =>
        Object.entries(filter).every(([k, v]) => String(r[k]) === String(v))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async deleteReview(id) {
    if (isMongoConnected()) {
      return Review.findByIdAndDelete(id).lean();
    }
    const db = readLocalStore();
    const idx = db.reviews.findIndex((r) => String(r._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.reviews.splice(idx, 1);
    writeLocalStore(db);
    return removed;
  },

  // ---------------- NOTIFICATIONS ----------------
  async createNotification(payload) {
    if (isMongoConnected()) {
      const notif = await Notification.create(payload);
      return notif.toObject();
    }
    const db = readLocalStore();
    const notif = {
      _id: generateObjectId(),
      ...payload,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notif);
    writeLocalStore(db);
    return notif;
  },

  async listNotifications(userId) {
    if (isMongoConnected()) {
      return Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
    }
    const db = readLocalStore();
    return db.notifications
      .filter((n) => String(n.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
  },

  async markNotificationRead(id, userId) {
    if (isMongoConnected()) {
      return Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      ).lean();
    }
    const db = readLocalStore();
    const idx = db.notifications.findIndex(
      (n) => String(n._id) === String(id) && String(n.userId) === String(userId)
    );
    if (idx === -1) return null;
    db.notifications[idx].isRead = true;
    writeLocalStore(db);
    return db.notifications[idx];
  },

  // ---------------- NEWSLETTER & CONTACT ----------------
  async addSubscriber(email) {
    const normalized = email.trim().toLowerCase();
    if (isMongoConnected()) {
      const existing = await Subscriber.findOne({ email: normalized });
      if (existing) return { alreadySubscribed: true, subscriber: existing.toObject() };
      const created = await Subscriber.create({ email: normalized });
      return { alreadySubscribed: false, subscriber: created.toObject() };
    }
    const db = readLocalStore();
    const existing = db.subscribers.find((s) => s.email === normalized);
    if (existing) return { alreadySubscribed: true, subscriber: existing };
    const created = {
      _id: generateObjectId(),
      email: normalized,
      createdAt: new Date().toISOString(),
    };
    db.subscribers.push(created);
    writeLocalStore(db);
    return { alreadySubscribed: false, subscriber: created };
  },

  async addContactMessage(payload) {
    if (isMongoConnected()) {
      const msg = await ContactMessage.create(payload);
      return msg.toObject();
    }
    const db = readLocalStore();
    const msg = {
      _id: generateObjectId(),
      ...payload,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    db.contacts.push(msg);
    writeLocalStore(db);
    return msg;
  },
};

/**
 * backend/models/Event.js
 * Mongoose model for the `events` collection.
 * Includes ticket categories with atomic seat availability tracking.
 */

import mongoose from 'mongoose';

const ticketCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ticket tier name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Ticket price in INR is required'],
      min: [0, 'Price cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats count is required'],
      min: [1, 'At least 1 seat is required'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats count is required'],
      min: [0, 'Available seats cannot be negative'],
    },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [140, 'Event title cannot exceed 140 characters'],
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short summary is required'],
      trim: true,
      maxlength: [260, 'Short summary cannot exceed 260 characters'],
    },
    description: {
      type: String,
      required: [true, 'Full event description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      required: true,
      trim: true,
    },
    organizerEmail: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Venue address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    bannerImage: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    ticketCategories: {
      type: [ticketCategorySchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one ticket category is required',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    cancellationPolicy: {
      type: String,
      default: 'Full refund available up to 24 hours prior to the event start time.',
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

eventSchema.index({ title: 'text', shortDescription: 'text', city: 'text', category: 'text' });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;

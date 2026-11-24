/**
 * backend/controllers/publicController.js
 * Handles Newsletter subscriptions and Contact page inquiries.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { isValidEmail } from '../middleware/validateMiddleware.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const result = await store.addSubscriber(email);
  res.status(result.alreadySubscribed ? 200 : 201).json({
    success: true,
    message: result.alreadySubscribed
      ? 'You are already subscribed to UtsavVerse updates.'
      : 'Subscribed! You will receive curated event updates across India.',
  });
});

export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !isValidEmail(email) || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in your name, valid email, subject, and message.',
    });
  }

  const saved = await store.addContactMessage({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
  });

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been received. Our team will respond within 24 hours.',
    ticket: saved,
  });
});

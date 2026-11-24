/**
 * backend/controllers/userController.js
 * Handles user profile retrieval, profile updates, and user notifications.
 */

import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await store.findUserById(req.user._id);
  res.json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city } = req.body;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters.',
    });
  }

  const updated = await store.updateUser(req.user._id, {
    name: name.trim(),
    phone: phone?.trim() || '',
    city: city?.trim() || 'Mumbai',
  });

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: updated,
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await store.listNotifications(req.user._id);
  res.json({ success: true, notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await store.markNotificationRead(req.params.id, req.user._id);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Notification not found.' });
  }
  res.json({ success: true, notification: updated });
});

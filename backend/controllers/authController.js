/**
 * backend/controllers/authController.js
 * Handles registration, login, logout, forgot/reset password, and password changes.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { store } from '../utils/dataStore.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city, role, organizationName, bio, gstNumber } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await store.findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email address already exists.',
    });
  }

  let assignedRole = role || 'user';

  // Admin creation: allowed automatically if no admin exists yet, or when valid setup code from .env is provided
  if (assignedRole === 'admin') {
    const adminCount = await store.countUsers({ role: 'admin' });
    const configuredSetupCode = process.env.ADMIN_SETUP_CODE;
    if (adminCount > 0 && (!configuredSetupCode || req.body.adminSetupCode !== configuredSetupCode)) {
      return res.status(403).json({
        success: false,
        message: 'An administrator account already exists. Additional admins must be authorized.',
      });
    }
  }

  const userPayload = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone?.trim() || '',
    city: city?.trim() || 'Mumbai',
    role: assignedRole,
    organizerProfile:
      assignedRole === 'organizer'
        ? {
            organizationName: organizationName.trim(),
            bio: bio?.trim() || '',
            gstNumber: gstNumber?.trim() || '',
            city: city?.trim() || 'Mumbai',
            approvalStatus: 'pending',
            rejectionReason: '',
          }
        : undefined,
  };

  const user = await store.createUser(userPayload);

  // Welcome notification
  await store.createNotification({
    userId: user._id,
    title: 'Welcome to UtsavVerse',
    message:
      assignedRole === 'organizer'
        ? 'Your organizer account is pending admin review. You will be notified once approved.'
        : 'Your account is active. Start exploring events across India.',
    type: 'system',
    link: assignedRole === 'organizer' ? '/organizer/dashboard' : '/events',
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message:
      assignedRole === 'organizer'
        ? 'Organizer account registered and submitted for admin approval.'
        : 'Registration successful.',
    token,
    user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userWithPassword = await store.findUserByEmail(email, true);

  if (!userWithPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  if (userWithPassword.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated by an administrator.',
    });
  }

  const isMatch = await bcrypt.compare(password, userWithPassword.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const sanitizedUser = await store.findUserById(userWithPassword._id);
  const token = generateToken(sanitizedUser._id, sanitizedUser.role);

  res.json({
    success: true,
    message: 'Signed in successfully.',
    token,
    user: sanitizedUser,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const adminCount = await store.countUsers({ role: 'admin' });
  res.json({
    success: true,
    user: req.user,
    hasAdmin: adminCount > 0,
  });
});

export const getAuthStatus = asyncHandler(async (req, res) => {
  const adminCount = await store.countUsers({ role: 'admin' });
  res.json({
    success: true,
    hasAdmin: adminCount > 0,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await store.findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with that email address.',
    });
  }

  const resetCode = crypto.randomInt(100000, 999999).toString();
  const hashedReset = crypto.createHash('sha256').update(resetCode).digest('hex');

  await store.updateUser(user._id, {
    resetPasswordToken: hashedReset,
    resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  res.json({
    success: true,
    message: 'Password reset verification code generated (valid for 15 minutes).',
    // Returned in development/test mode when SMTP is not configured
    resetCode: process.env.NODE_ENV === 'production' ? undefined : resetCode,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !resetCode || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Valid email, 6-digit verification code, and new password (min 6 chars) are required.',
    });
  }

  const user = await store.findUserByEmail(email, true);
  if (!user || !user.resetPasswordToken) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset request.',
    });
  }

  const hashedCode = crypto.createHash('sha256').update(String(resetCode).trim()).digest('hex');
  const isExpired = !user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date();

  if (hashedCode !== user.resetPasswordToken || isExpired) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset code.',
    });
  }

  await store.updateUser(user._id, {
    password: newPassword,
    resetPasswordToken: null,
    resetPasswordExpire: null,
  });

  res.json({
    success: true,
    message: 'Password updated successfully. You can now sign in.',
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Provide your current password and a new password of at least 6 characters.',
    });
  }

  const user = await store.findUserById(req.user._id, true);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  await store.updateUser(req.user._id, { password: newPassword });

  res.json({
    success: true,
    message: 'Password changed successfully.',
  });
});

/**
 * backend/middleware/authMiddleware.js
 * Protects private routes with JWT verification and enforces Role-Based Access Control (RBAC).
 */

import { verifyToken } from '../utils/generateToken.js';
import { store } from '../utils/dataStore.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await store.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account associated with this token was not found.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact UtsavVerse support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.',
    });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
};

export const adminOnly = authorizeRoles('admin');
export const organizerOrAdmin = authorizeRoles('organizer', 'admin');

export const requireApprovedOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ success: false, message: 'Organizer privileges required.' });
  }
  const approval = req.user.organizerProfile?.approvalStatus || 'pending';
  if (approval !== 'approved') {
    return res.status(403).json({
      success: false,
      message: `Organizer account is currently "${approval}". Admin approval is required before creating or publishing events.`,
    });
  }
  next();
};

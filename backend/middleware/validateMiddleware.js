/**
 * backend/middleware/validateMiddleware.js
 * Reusable request body validation helpers.
 */

export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || '').trim());

export const validateRegister = (req, res, next) => {
  const { name, email, password, role, organizationName } = req.body;
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  if (role && !['user', 'organizer', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role selected.' });
  }
  if (role === 'organizer' && (!organizationName || String(organizationName).trim().length < 2)) {
    return res.status(400).json({
      success: false,
      message: 'Organization name is required for organizer registration.',
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email and password.',
    });
  }
  next();
};

export const validateEventPayload = (req, res, next) => {
  const { title, shortDescription, description, category, date, time, venue, address, city, ticketCategories } =
    req.body;

  if (!title || !shortDescription || !description || !category || !date || !time || !venue || !address || !city) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all required event details, venue address, and schedule fields.',
    });
  }

  if (!Array.isArray(ticketCategories) || ticketCategories.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please define at least one ticket category with price and seat count.',
    });
  }

  for (const tc of ticketCategories) {
    if (!tc.name || Number(tc.price) < 0 || Number(tc.totalSeats) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Each ticket category requires a valid name, non-negative price (INR), and at least 1 seat.',
      });
    }
  }

  next();
};

export const validateBookingPayload = (req, res, next) => {
  const { eventId, ticketCategoryId, quantity } = req.body;
  const qty = Number(quantity);
  if (!eventId || !ticketCategoryId || !Number.isInteger(qty) || qty < 1 || qty > 10) {
    return res.status(400).json({
      success: false,
      message: 'Select a valid ticket category and quantity between 1 and 10.',
    });
  }
  next();
};

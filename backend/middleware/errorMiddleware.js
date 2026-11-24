/**
 * backend/middleware/errorMiddleware.js
 * Centralized Express error handling and async route wrapper.
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req, res, next) => {
  const error = new Error(`API route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal server error';

  // Handle Mongoose duplicate key errors cleanly
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    message = `Duplicate value for ${field}. That ${field} already exists.`;
    return res.status(400).json({ success: false, message });
  }

  // Handle Mongoose validation errors cleanly
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

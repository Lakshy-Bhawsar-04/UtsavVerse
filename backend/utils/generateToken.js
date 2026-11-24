/**
 * backend/utils/generateToken.js
 * JWT token generation and verification helpers.
 */

import jwt from 'jsonwebtoken';

const getJwtSecret = () =>
  process.env.JWT_SECRET || 'UtsavVerse_dev_jwt_secret_fallback_change_in_env';

export const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

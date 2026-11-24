/**
 * backend/config/db.js
 * ---------------------
 * Establishes and manages the MongoDB Atlas connection using Mongoose.
 * Uses process.env.MONGO_URI so the exact same connection string works
 * in both the Express server and MongoDB Compass.
 */

import mongoose from 'mongoose';

let mongoConnected = false;

/**
 * Connect to MongoDB Atlas before starting the Express server.
 * Returns true if connected to MongoDB Atlas, false if MONGO_URI is not configured.
 */
export const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    console.warn(
      '[Database] MONGO_URI is not set in .env. Running in local JSON store mode until MongoDB Atlas URI is provided.'
    );
    mongoConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    mongoConnected = true;
    console.log(
      `[Database] MongoDB Atlas connected successfully -> Host: ${conn.connection.host} | DB: ${conn.connection.name}`
    );

    mongoose.connection.on('disconnected', () => {
      mongoConnected = false;
      console.warn('[Database] MongoDB Atlas disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      mongoConnected = true;
      console.log('[Database] MongoDB Atlas reconnected.');
    });

    return true;
  } catch (error) {
    mongoConnected = false;
    console.error(`[Database] MongoDB connection failure: ${error.message}`);
    console.warn(
      '[Database] Verify your MONGO_URI in .env and IP whitelist in MongoDB Atlas. Falling back to local store so the server remains accessible.'
    );
    return false;
  }
};

export const isMongoConnected = () => mongoConnected && mongoose.connection.readyState === 1;

export default connectDB;

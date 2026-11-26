
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

export const getGridFSBucket = () => {
  if (
    mongoose.connection.readyState !== 1 ||
    !mongoose.connection.db
  ) {
    throw new Error('MongoDB Atlas is not connected.');
  }

  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'eventImages',
  });
};

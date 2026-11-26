
import mongoose from 'mongoose';

export const getGridFSBucket = () => {
  if (
    mongoose.connection.readyState !== 1 ||
    !mongoose.connection.db
  ) {
    throw new Error('MongoDB Atlas is not connected.');
  }

  return new mongoose.mongo.GridFSBucket(
    mongoose.connection.db,
    {
      bucketName: 'eventImages',
    }
  );
};

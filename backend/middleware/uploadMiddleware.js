
import multer from 'multer';

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedMimes.includes(file.mimetype)) {
    const error = new Error(
      'Only JPG, PNG and WebP images are allowed.'
    );

    error.statusCode = 400;
    return cb(error);
  }

  cb(null, true);
};

export const uploadEventImage = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

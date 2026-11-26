/**
 * backend/middleware/uploadMiddleware.js
 * Multer configuration for uploading event banner and gallery images to backend/uploads/.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `event_${Date.now()}_${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ];
  const allowedExt = /\.(jpe?g|png|webp|gif|avif)$/i;
  if (allowedMimes.includes(file.mimetype) || allowedExt.test(file.originalname || '')) {
    cb(null, true);
  } else {
    const err = new Error('Only JPG, PNG, WebP, GIF, and AVIF image files are permitted.');
    err.statusCode = 400;
    cb(err, false);
  }
};

export const uploadEventImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export { UPLOAD_DIR };

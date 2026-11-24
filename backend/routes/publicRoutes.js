import express from 'express';
import { subscribeNewsletter, submitContactMessage } from '../controllers/publicController.js';

const router = express.Router();

router.post('/newsletter', subscribeNewsletter);
router.post('/contact', submitContactMessage);

export default router;

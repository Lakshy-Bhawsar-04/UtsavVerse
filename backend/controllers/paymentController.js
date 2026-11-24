/**
 * backend/controllers/paymentController.js
 * Razorpay Test Mode order creation & backend HMAC-SHA256 signature verification.
 * Never trusts payment success solely from frontend responses.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const getRazorpayKeys = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_UtsavVerse_demo_key',
  keySecret: process.env.RAZORPAY_KEY_SECRET || 'UtsavVerse_razorpay_test_secret_key',
});

const hasLiveRazorpayKeys = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return (
    keyId.startsWith('rzp_') &&
    !keyId.includes('demo') &&
    !keyId.includes('xxxx') &&
    keySecret.length > 10 &&
    !keySecret.includes('xxxx')
  );
};

export const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'Booking ID is required.' });
  }

  const booking = await store.findBookingById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (String(booking.userId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Unauthorized booking access.' });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'This booking is already paid.' });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled booking.' });
  }

  const { keyId } = getRazorpayKeys();
  const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
  let orderId = `order_test_${crypto.randomBytes(6).toString('hex')}`;
  let checkoutMode = 'test_sandbox';

  if (hasLiveRazorpayKeys()) {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingCode,
      notes: {
        bookingId: String(booking._id),
        eventTitle: booking.eventTitle,
      },
    });
    orderId = order.id;
    checkoutMode = 'razorpay_checkout';
  }

  const payment = await store.createPayment({
    bookingId: booking._id,
    bookingCode: booking.bookingCode,
    userId: req.user._id,
    eventId: booking.eventId,
    razorpayOrderId: orderId,
    amount: booking.totalAmount,
    currency: 'INR',
    status: 'created',
    method: checkoutMode,
    verifiedOnServer: false,
  });

  await store.updateBooking(booking._id, {
    razorpayOrderId: orderId,
    paymentId: payment._id,
  });

  // Issue a server-authenticated sandbox authorization token ONLY for test_sandbox checkout
  // so verifyPayment can validate server-issued orders without trusting raw frontend flags.
  const sandboxChallenge =
    checkoutMode === 'test_sandbox'
      ? crypto
          .createHmac('sha256', getRazorpayKeys().keySecret)
          .update(`${orderId}|${booking._id}|${amountInPaise}`)
          .digest('hex')
      : undefined;

  res.status(201).json({
    success: true,
    order: {
      id: orderId,
      amount: amountInPaise,
      amountInInr: booking.totalAmount,
      currency: 'INR',
      receipt: booking.bookingCode,
    },
    keyId,
    checkoutMode,
    sandboxChallenge,
    booking,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    sandboxChallenge,
    paymentMethod = 'UPI / Card (Test)',
  } = req.body;

  if (!bookingId || !razorpay_order_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required payment verification details.',
    });
  }

  const booking = await store.findBookingById(bookingId);
  if (!booking || String(booking.userId) !== String(req.user._id)) {
    return res.status(404).json({ success: false, message: 'Booking record not found.' });
  }

  const payment = await store.findPaymentByOrderId(razorpay_order_id);
  if (!payment || String(payment.bookingId) !== String(booking._id)) {
    return res.status(400).json({
      success: false,
      message: 'Order ID does not match the booking payment record.',
    });
  }

  const { keySecret } = getRazorpayKeys();
  let isSignatureValid = false;
  let finalPaymentId = razorpay_payment_id;
  let finalSignature = razorpay_signature || '';

  if (payment.method === 'razorpay_checkout') {
    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay payment ID and signature are required for verification.',
      });
    }
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    isSignatureValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
  } else {
    // Verify server-issued HMAC challenge for Test Sandbox mode
    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
    const expectedChallenge = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${booking._id}|${amountInPaise}`)
      .digest('hex');

    if (
      sandboxChallenge &&
      expectedChallenge.length === sandboxChallenge.length &&
      crypto.timingSafeEqual(Buffer.from(expectedChallenge), Buffer.from(sandboxChallenge))
    ) {
      isSignatureValid = true;
      finalPaymentId = finalPaymentId || `pay_test_${crypto.randomBytes(6).toString('hex')}`;
      finalSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${finalPaymentId}`)
        .digest('hex');
    }
  }

  if (!isSignatureValid) {
    await store.updatePayment(payment._id, {
      status: 'failed',
      verifiedOnServer: false,
    });
    await store.updateBooking(booking._id, {
      paymentStatus: 'failed',
    });
    return res.status(400).json({
      success: false,
      message: 'Payment signature verification failed. Transaction rejected by server.',
    });
  }

  // Payment verified! Update payment and confirm booking
  const updatedPayment = await store.updatePayment(payment._id, {
    razorpayPaymentId: finalPaymentId,
    razorpaySignature: finalSignature,
    status: 'verified',
    method: paymentMethod,
    verifiedOnServer: true,
  });

  const confirmedBooking = await store.updateBooking(booking._id, {
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    razorpayPaymentId: finalPaymentId,
  });

  await store.createNotification({
    userId: booking.userId,
    title: `Booking Confirmed (${booking.bookingCode})`,
    message: `Payment of ₹${booking.totalAmount} verified for ${booking.eventTitle}. Your e-ticket is ready.`,
    type: 'payment',
    link: `/booking/${booking._id}`,
  });

  res.json({
    success: true,
    message: 'Payment verified and booking confirmed.',
    booking: confirmedBooking,
    payment: updatedPayment,
  });
});

export const recordPaymentFailure = asyncHandler(async (req, res) => {
  const { bookingId, razorpay_order_id, reason } = req.body;
  const booking = await store.findBookingById(bookingId);
  if (!booking || String(booking.userId) !== String(req.user._id)) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (razorpay_order_id) {
    const payment = await store.findPaymentByOrderId(razorpay_order_id);
    if (payment) {
      await store.updatePayment(payment._id, { status: 'failed' });
    }
  }

  // Restore seats and mark booking cancelled/failed if user abandoned payment
  if (booking.paymentStatus !== 'paid' && booking.bookingStatus !== 'cancelled') {
    await store.restoreTicketSeats(booking.eventId, booking.ticketCategoryId, booking.quantity);
    await store.updateBooking(booking._id, {
      paymentStatus: 'failed',
      bookingStatus: 'cancelled',
      cancellationReason: reason || 'Payment failed or cancelled',
    });
  }

  res.json({
    success: true,
    message: 'Payment failure recorded and reserved seats released.',
  });
});

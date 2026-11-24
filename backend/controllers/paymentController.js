
/**
 * backend/controllers/paymentController.js
 *
 * Razorpay Test Mode payment controller.
 * - Creates genuine Razorpay orders.
 * - Verifies HMAC-SHA256 signatures.
 * - Fetches payment details directly from Razorpay.
 * - Validates amount, currency, order ID and captured status.
 * - Prevents duplicate payment verification.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { store } from '../utils/dataStore.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// --------------------------------------------------
// Razorpay configuration
// --------------------------------------------------

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are missing.');
  }

  // This controller is configured for Test Mode.
  if (!keyId.startsWith('rzp_test_')) {
    throw new Error('Invalid Razorpay Test Mode Key ID.');
  }

  return {
    keyId,
    keySecret,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
};

// --------------------------------------------------
// Create Razorpay Order
// --------------------------------------------------

export const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required.',
    });
  }

  const booking = await store.findBookingById(bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found.',
    });
  }

  // Verify booking ownership
  if (String(booking.userId) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized booking access.',
    });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'This booking is already paid.',
    });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot pay for a cancelled booking.',
    });
  }

  // Validate booking amount from database
  const amountInRupees = Number(booking.totalAmount);
  const amountInPaise = Math.round(amountInRupees * 100);

  if (
    !Number.isFinite(amountInRupees) ||
    amountInPaise <= 0 ||
    !Number.isSafeInteger(amountInPaise) ||
    Math.abs(amountInRupees * 100 - amountInPaise) > 0.000001
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking amount.',
    });
  }

  const { keyId, client } = getRazorpay();

  // Create actual Razorpay order
  const razorpayOrder = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: String(booking.bookingCode).slice(0, 40),
    notes: {
      bookingId: String(booking._id),
      bookingCode: String(booking.bookingCode),
      eventTitle: String(booking.eventTitle || ''),
    },
  });

  // Save payment record in database
  const payment = await store.createPayment({
    bookingId: booking._id,
    bookingCode: booking.bookingCode,
    userId: req.user._id,
    eventId: booking.eventId,

    razorpayOrderId: razorpayOrder.id,

    amount: amountInRupees,
    currency: 'INR',

    status: 'created',
    method: 'razorpay_checkout',

    verifiedOnServer: false,
  });

  // Update booking with Razorpay order information
  await store.updateBooking(booking._id, {
    razorpayOrderId: razorpayOrder.id,
    paymentId: payment._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Razorpay order created successfully.',

    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      amountInInr: amountInRupees,
    },

    keyId,

    checkoutMode: 'razorpay_checkout',

    booking: {
      _id: booking._id,
      bookingCode: booking.bookingCode,
      eventTitle: booking.eventTitle,
      totalAmount: amountInRupees,
    },
  });
});

// --------------------------------------------------
// Verify Razorpay Payment
// --------------------------------------------------

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !bookingId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required payment verification details.',
    });
  }

  const booking = await store.findBookingById(bookingId);

  if (!booking || String(booking.userId) !== String(req.user._id)) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found.',
    });
  }

  const payment = await store.findPaymentByOrderId(razorpay_order_id);

  if (
    !payment ||
    String(payment.bookingId) !== String(booking._id) ||
    String(payment.userId) !== String(req.user._id)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Payment order does not match this booking.',
    });
  }

  if (payment.method !== 'razorpay_checkout') {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method.',
    });
  }

  if (booking.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({
      success: false,
      message: 'Razorpay order ID does not match the booking.',
    });
  }

  if (payment.status === 'verified' || booking.paymentStatus === 'paid') {
    return res.status(409).json({
      success: false,
      message: 'This payment has already been verified.',
    });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'This booking has been cancelled.',
    });
  }

  const { keySecret, client } = getRazorpay();

  // Step 1: Verify Razorpay HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = /^[a-f0-9]{64}$/i.test(razorpay_signature)
    ? Buffer.from(razorpay_signature, 'hex')
    : Buffer.alloc(0);

  const isSignatureValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isSignatureValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Razorpay payment signature.',
    });
  }

  // Step 2: Fetch actual payment details from Razorpay
  const razorpayPayment = await client.payments.fetch(
    razorpay_payment_id
  );

  // Step 3: Validate order ID
  if (razorpayPayment.order_id !== razorpay_order_id) {
    return res.status(400).json({
      success: false,
      message: 'Payment order ID mismatch.',
    });
  }

  // Step 4: Validate amount and currency
  const expectedAmount = Math.round(Number(booking.totalAmount) * 100);

  if (
    razorpayPayment.amount !== expectedAmount ||
    razorpayPayment.currency !== 'INR' ||
    Number(payment.amount) !== Number(booking.totalAmount)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount or currency mismatch.',
    });
  }

  // Step 5: Only captured payments can confirm bookings
  if (razorpayPayment.status !== 'captured') {
    return res.status(400).json({
      success: false,
      message: `Payment is not captured. Current status: ${razorpayPayment.status}`,
    });
  }

  // Step 6: Save verified payment
  const updatedPayment = await store.updatePayment(payment._id, {
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,

    status: 'verified',
    method: razorpayPayment.method || 'unknown',

    verifiedOnServer: true,
  });

  // Step 7: Confirm booking
  const confirmedBooking = await store.updateBooking(booking._id, {
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    razorpayPaymentId: razorpay_payment_id,
  });

  // Step 8: Create notification
  await store.createNotification({
    userId: booking.userId,

    title: `Booking Confirmed (${booking.bookingCode})`,

    message: `Payment of ₹${booking.totalAmount} verified for ${booking.eventTitle}. Your e-ticket is ready.`,

    type: 'payment',

    link: `/booking/${booking._id}`,
  });

  return res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed.',

    booking: confirmedBooking,
    payment: updatedPayment,
  });
});

// --------------------------------------------------
// Record Payment Failure
// --------------------------------------------------

export const recordPaymentFailure = asyncHandler(async (req, res) => {
  const {
    bookingId,
    razorpay_order_id,
    reason,
  } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required.',
    });
  }

  const booking = await store.findBookingById(bookingId);

  if (!booking || String(booking.userId) !== String(req.user._id)) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found.',
    });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Paid booking cannot be marked as failed.',
    });
  }

  // Verify supplied order belongs to this booking
  if (razorpay_order_id) {
    const payment = await store.findPaymentByOrderId(razorpay_order_id);

    if (
      !payment ||
      String(payment.bookingId) !== String(booking._id) ||
      String(payment.userId) !== String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment order.',
      });
    }

    if (payment.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Verified payment cannot be marked as failed.',
      });
    }

    await store.updatePayment(payment._id, {
      status: 'failed',
      verifiedOnServer: false,
    });
  }

  // Do not release seats more than once
  if (booking.bookingStatus === 'cancelled') {
    return res.json({
      success: true,
      message: 'Booking is already cancelled.',
    });
  }

  // Release reserved seats only for unpaid bookings
  await store.updateBooking(booking._id, {
    paymentStatus: 'failed',
    bookingStatus: 'cancelled',

    cancellationReason:
      String(reason || 'Payment failed or cancelled').slice(0, 250),
  });

  await store.restoreTicketSeats(
    booking.eventId,
    booking.ticketCategoryId,
    booking.quantity
  );

  return res.status(200).json({
    success: true,
    message: 'Payment failure recorded and reserved seats released.',
  });
});

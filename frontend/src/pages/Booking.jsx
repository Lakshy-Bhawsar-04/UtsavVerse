
import { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap';

import { useParams, useSearchParams, Link } from 'react-router-dom';

import {
  FiCheckCircle,
  FiDownload,
  FiShield,
  FiCalendar,
  FiMapPin,
} from 'react-icons/fi';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatEventDate } from '../data/eventsData';
import { downloadBookingTicketPDF } from '../services/pdfTicket';
import TicketQRCode from '../components/TicketQRCode';

export default function Booking() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);

  const [selectedTierId, setSelectedTierId] = useState(
    searchParams.get('tier') || ''
  );

  const [quantity, setQuantity] = useState(1);
  const [attendeePhone, setAttendeePhone] = useState(user?.phone || '');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load Event or Booking Confirmation
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        if (window.location.pathname.startsWith('/booking/confirmation/')) {
          const { data } = await api.get(`/bookings/${id}`);

          setConfirmedBooking(data.booking);
        } else {
          const { data } = await api.get(`/events/${id}`);

          setEvent(data.event);

          const tiers = data.event?.ticketCategories || [];
          const requestedTier = searchParams.get('tier');

          const availableTier =
            tiers.find(
              (t) =>
                String(t._id) === String(requestedTier) &&
                t.availableSeats > 0
            ) ||
            tiers.find((t) => t.availableSeats > 0) ||
            tiers[0];

          if (availableTier) {
            setSelectedTierId(String(availableTier._id));
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Unable to load booking information.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, searchParams]);

  const selectedTier = (event?.ticketCategories || []).find(
    (t) => String(t._id) === String(selectedTierId)
  );

  const unitPrice = Number(selectedTier?.price || 0);

  const subtotal = unitPrice * quantity;

  const convenienceFee = Math.round(subtotal * 0.05);

  const totalAmount = subtotal + convenienceFee;

  // Reserve Seats and Open Razorpay Checkout
  const handleReserveAndPay = async (e) => {
    e.preventDefault();

    if (!selectedTier || selectedTier.availableSeats < quantity) {
      setError('Not enough seats remaining in this ticket tier.');
      return;
    }

    setProcessing(true);
    setError('');

    let booking = null;

    try {
      // 1. Create Pending Booking and Reserve Seats
      const bookingRes = await api.post('/bookings', {
        eventId: event._id,
        ticketCategoryId: selectedTier._id,
        quantity,
        attendeePhone,
      });

      booking = bookingRes.data.booking;

      // 2. Create Razorpay Order on Backend
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking._id,
      });

      const { order, keyId, checkoutMode } = orderRes.data;

      // 3. Check Actual Razorpay Checkout Configuration
      if (
        checkoutMode !== 'razorpay_checkout' ||
        !window.Razorpay ||
        !keyId ||
        !keyId.startsWith('rzp_test_') ||
        !order?.id
      ) {
        throw new Error(
          'Razorpay Test Checkout is not configured correctly. Please contact support.'
        );
      }

      // 4. Open Razorpay Checkout
      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'UtsavVerse',
        description: `${event.title} (${selectedTier.name} × ${quantity})`,
        order_id: order.id,

        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: attendeePhone || user?.phone || '',
        },

        theme: {
          color: '#6C3BFF',
        },

        // 5. Verify Payment on Backend
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentMethod: 'Razorpay Checkout',
            });

            setConfirmedBooking(verifyRes.data.booking);
          } catch (verifyErr) {
            setError(
              verifyErr.response?.data?.message ||
                'Server payment verification failed. Please contact support before retrying.'
            );
          } finally {
            setProcessing(false);
          }
        },

        // 6. Checkout Closed
        modal: {
          ondismiss: async () => {
            try {
              await api.post('/payments/failure', {
                bookingId: booking._id,
                razorpay_order_id: order.id,
                reason: 'Checkout closed by user',
              });
            } catch (err) {
              console.error('Payment failure update:', err);
            } finally {
              setError('Payment cancelled. Please try again.');
              setProcessing(false);
            }
          },
        },
      });

      rzp.on('payment.failed', async (response) => {
        try {
          await api.post('/payments/failure', {
            bookingId: booking._id,
            razorpay_order_id: order.id,
            reason:
              response.error?.description || 'Payment failed',
          });
        } catch (err) {
          console.error('Payment failure update:', err);
        } finally {
          setError(
            response.error?.description || 'Payment failed. Please try again.'
          );
          setProcessing(false);
        }
      });

      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to start payment. Please try again.'
      );

      // Release reservation if order creation or checkout setup fails
      if (booking?._id) {
        try {
          await api.post('/payments/failure', {
            bookingId: booking._id,
            reason: 'Unable to initialize Razorpay Checkout',
          });
        } catch (failureErr) {
          console.error('Booking failure update:', failureErr);
        }
      }

      setProcessing(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <Spinner
          animation="border"
          style={{ color: 'var(--ev-primary)' }}
        />
      </Container>
    );
  }

  // Booking Confirmation Screen
  if (confirmedBooking) {
    return (
      <section
        className="ev-section ev-section-light"
        style={{ minHeight: '75vh' }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="ev-panel p-4 p-md-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'var(--ev-success-bg)',
                      color: 'var(--ev-success)',
                    }}
                  >
                    <FiCheckCircle size={24} />
                  </div>

                  <div>
                    <h1 className="h4 fw-bold mb-1">
                      Booking Confirmed
                    </h1>

                    <p className="small text-muted mb-0">
                      Payment verified on server · Reference{' '}
                      <strong className="ev-mono text-dark">
                        {confirmedBooking.bookingCode}
                      </strong>
                    </p>
                  </div>
                </div>

                <Row className="g-4 align-items-center mb-4">
                  <Col md={8}>
                    <div
                      className="p-3 p-md-4 h-100"
                      style={{
                        backgroundColor: 'var(--ev-bg-light)',
                        borderRadius: 'var(--ev-radius-md)',
                      }}
                    >
                      <h2 className="h5 fw-bold mb-2">
                        {confirmedBooking.eventTitle}
                      </h2>

                      <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                        <span className="d-inline-flex align-items-center gap-1">
                          <FiCalendar size={14} />
                          {formatEventDate(confirmedBooking.eventDate)} ·{' '}
                          {confirmedBooking.eventTime}
                        </span>

                        <span className="d-inline-flex align-items-center gap-1">
                          <FiMapPin size={14} />
                          {confirmedBooking.eventVenue},{' '}
                          {confirmedBooking.eventCity}
                        </span>
                      </div>

                      <Row
                        className="g-3 small pt-3 border-top"
                        style={{ borderColor: 'var(--ev-border)' }}
                      >
                        <Col sm={4}>
                          <div className="text-muted">Ticket Tier</div>
                          <div className="fw-semibold">
                            {confirmedBooking.ticketCategoryName}
                          </div>
                        </Col>

                        <Col sm={4}>
                          <div className="text-muted">Quantity</div>
                          <div className="fw-semibold ev-num">
                            {confirmedBooking.quantity} Pass(es)
                          </div>
                        </Col>

                        <Col sm={4}>
                          <div className="text-muted">Total Paid (INR)</div>
                          <div className="fw-bold ev-mono">
                            {formatINR(confirmedBooking.totalAmount)}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  <Col md={4}>
                    <TicketQRCode
                      booking={confirmedBooking}
                      size={140}
                    />
                  </Col>
                </Row>

                <div className="d-flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() =>
                      downloadBookingTicketPDF(confirmedBooking)
                    }
                    className="btn-ev-primary d-inline-flex align-items-center gap-2"
                  >
                    <FiDownload size={16} />
                    <span>Download Ticket (PDF)</span>
                  </Button>

                  <Link to="/dashboard" className="btn btn-ev-outline">
                    View in My Bookings
                  </Link>

                  <Link to="/events" className="btn btn-ev-outline">
                    Explore More Events
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  // Event Not Found
  if (!event) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Event not found.'}
        </Alert>

        <Link to="/events" className="btn btn-ev-outline">
          Back to Events
        </Link>
      </Container>
    );
  }

  const maxQuantity = Math.min(
    10,
    Number(selectedTier?.availableSeats || 0)
  );

  // Booking Form
  return (
    <section
      className="ev-section ev-section-light"
      style={{ minHeight: '75vh' }}
    >
      <Container>
        <div className="mb-4">
          <h1 className="ev-section-title">
            Complete Your Booking
          </h1>

          <p className="ev-section-subtitle mb-0">
            Select your ticket category and quantity for{' '}
            <strong>{event.title}</strong>.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-4 align-items-start">
          <Col lg={7}>
            <div className="ev-panel">
              <Form onSubmit={handleReserveAndPay}>
                <h2 className="h5 fw-bold mb-3">
                  1. Select Ticket Category
                </h2>

                <div className="d-flex flex-column gap-2 mb-4">
                  {(event.ticketCategories || []).map((tier) => {
                    const isSelected =
                      String(tier._id) === String(selectedTierId);

                    const soldOut = tier.availableSeats <= 0;

                    return (
                      <label
                        key={tier._id}
                        className="p-3 d-flex justify-content-between align-items-center"
                        style={{
                          borderRadius: 'var(--ev-radius-sm)',
                          border: isSelected
                            ? '2px solid var(--ev-primary)'
                            : '1px solid var(--ev-border)',
                          backgroundColor: isSelected
                            ? 'var(--ev-primary-soft)'
                            : '#FFFFFF',
                          cursor: soldOut ? 'not-allowed' : 'pointer',
                          opacity: soldOut ? 0.6 : 1,
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <Form.Check
                            type="radio"
                            name="ticketCategory"
                            disabled={soldOut}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedTierId(String(tier._id));
                              setQuantity(1);
                            }}
                          />

                          <div>
                            <div className="fw-bold">{tier.name}</div>

                            <div className="small text-muted">
                              {tier.description}
                            </div>

                            <div className="small text-muted ev-num mt-1">
                              {soldOut
                                ? 'Sold Out'
                                : `${tier.availableSeats} seats available`}
                            </div>
                          </div>
                        </div>

                        <div className="ev-mono fw-bold fs-5">
                          {formatINR(tier.price)}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <h2 className="h5 fw-bold mb-3">
                  2. Quantity &amp; Contact
                </h2>

                <Row className="g-3 mb-4">
                  <Col sm={5}>
                    <Form.Label className="small fw-semibold">
                      Number of Tickets
                    </Form.Label>

                    <Form.Select
                      value={quantity}
                      disabled={maxQuantity <= 0}
                      onChange={(e) =>
                        setQuantity(Number(e.target.value))
                      }
                    >
                      {Array.from(
                        { length: Math.max(1, maxQuantity) },
                        (_, i) => i + 1
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Ticket' : 'Tickets'}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col sm={7}>
                    <Form.Label className="small fw-semibold">
                      Attendee Phone (For Entry SMS)
                    </Form.Label>

                    <Form.Control
                      type="tel"
                      value={attendeePhone}
                      onChange={(e) =>
                        setAttendeePhone(e.target.value)
                      }
                      placeholder="+91 98XXXXXXXX"
                    />
                  </Col>
                </Row>

                <Button
                  type="submit"
                  disabled={
                    processing ||
                    !selectedTier ||
                    selectedTier.availableSeats < quantity
                  }
                  className="btn-ev-primary w-100 py-2"
                >
                  {processing
                    ? 'Processing Payment...'
                    : `Proceed to Pay ${formatINR(totalAmount)}`}
                </Button>
              </Form>
            </div>
          </Col>

          {/* Booking Summary */}
          <Col lg={5}>
            <div className="ev-panel">
              <h2 className="h5 fw-bold mb-3">
                Booking Summary
              </h2>

              <div
                className="mb-3 pb-3 border-bottom"
                style={{ borderColor: 'var(--ev-border)' }}
              >
                <div className="fw-bold">{event.title}</div>

                <div className="small text-muted mt-1">
                  {formatEventDate(event.date)} · {event.time}
                </div>

                <div className="small text-muted">
                  {event.venue}, {event.city}
                </div>
              </div>

              <div
                className="d-flex flex-column gap-2 small mb-3 pb-3 border-bottom"
                style={{ borderColor: 'var(--ev-border)' }}
              >
                <div className="d-flex justify-content-between">
                  <span className="text-muted">
                    {selectedTier?.name} × {quantity}
                  </span>

                  <span className="ev-mono fw-semibold">
                    {formatINR(subtotal)}
                  </span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-muted">
                    Platform &amp; Payment Fee (5%)
                  </span>

                  <span className="ev-mono">
                    {formatINR(convenienceFee)}
                  </span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold">
                  Total Payable (INR)
                </span>

                <span
                  className="h4 fw-bold mb-0 ev-mono"
                  style={{ color: 'var(--ev-primary)' }}
                >
                  {formatINR(totalAmount)}
                </span>
              </div>

              <div className="small text-muted d-flex align-items-start gap-2">
                <FiShield
                  size={15}
                  className="mt-1 flex-shrink-0"
                />

                <span>
                  Razorpay Test Mode integration verifies payment
                  signatures on our Express server before confirming
                  tickets.
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

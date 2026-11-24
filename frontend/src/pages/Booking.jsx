/**
 * src/pages/Booking.jsx
 * Complete ticket selection, overbooking-safe reservation, Razorpay Test Mode checkout,
 * server-side HMAC verification, booking confirmation, and PDF ticket download.
 */

import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiShield, FiCalendar, FiMapPin } from 'react-icons/fi';
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
  const [selectedTierId, setSelectedTierId] = useState(searchParams.get('tier') || '');
  const [quantity, setQuantity] = useState(1);
  const [attendeePhone, setAttendeePhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Payment & confirmation states
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [sandboxModal, setSandboxModal] = useState(null);
  const [sandboxMethod, setSandboxMethod] = useState('UPI (Google Pay / PhonePe)');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Check if id is a booking ID confirmation view OR an event ID
        if (window.location.pathname.startsWith('/booking/confirmation/')) {
          const { data } = await api.get(`/bookings/${id}`);
          setConfirmedBooking(data.booking);
        } else {
          const { data } = await api.get(`/events/${id}`);
          setEvent(data.event);
          const tiers = data.event?.ticketCategories || [];
          const requestedTier = searchParams.get('tier');
          const availableTier =
            tiers.find((t) => String(t._id) === String(requestedTier) && t.availableSeats > 0) ||
            tiers.find((t) => t.availableSeats > 0) ||
            tiers[0];
          if (availableTier) setSelectedTierId(String(availableTier._id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load booking information.');
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

  const handleReserveAndPay = async (e) => {
    e.preventDefault();
    if (!selectedTier || selectedTier.availableSeats < quantity) {
      setError('Not enough seats remaining in this ticket tier.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 1. Atomically reserve seats & create pending booking
      const bookingRes = await api.post('/bookings', {
        eventId: event._id,
        ticketCategoryId: selectedTier._id,
        quantity,
        attendeePhone,
      });

      const booking = bookingRes.data.booking;

      // 2. Create Razorpay payment order on backend
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking._id,
      });

      const { order, keyId, checkoutMode, sandboxChallenge } = orderRes.data;

      // 3. Use Razorpay Checkout if live test keys are active, otherwise open server-verified Test Sandbox
      if (checkoutMode === 'razorpay_checkout' && window.Razorpay) {
        const rzp = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'UtsavVerse',
          description: `${event.title} (${selectedTier.name} × ${quantity})`,
          order_id: order.id,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: attendeePhone || user?.phone,
          },
          theme: { color: '#6C3BFF' },
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
                verifyErr.response?.data?.message || 'Server payment verification failed.'
              );
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: async () => {
              await api.post('/payments/failure', {
                bookingId: booking._id,
                razorpay_order_id: order.id,
                reason: 'Checkout closed by user',
              });
              setError('Payment cancelled. Reserved seats have been released.');
              setProcessing(false);
            },
          },
        });
        rzp.open();
      } else {
        // Server-signed Razorpay Test Sandbox Modal
        setSandboxModal({
          booking,
          order,
          sandboxChallenge,
        });
        setProcessing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to initiate booking.');
      setProcessing(false);
    }
  };

  const handleSandboxConfirm = async () => {
    if (!sandboxModal) return;
    setProcessing(true);
    setError('');
    try {
      const verifyRes = await api.post('/payments/verify', {
        bookingId: sandboxModal.booking._id,
        razorpay_order_id: sandboxModal.order.id,
        sandboxChallenge: sandboxModal.sandboxChallenge,
        paymentMethod: sandboxMethod,
      });
      setConfirmedBooking(verifyRes.data.booking);
      setSandboxModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSandboxFail = async () => {
    if (!sandboxModal) return;
    setProcessing(true);
    try {
      await api.post('/payments/failure', {
        bookingId: sandboxModal.booking._id,
        razorpay_order_id: sandboxModal.order.id,
        reason: 'Simulated test payment failure',
      });
      setSandboxModal(null);
      setError('Payment declined in test mode. Your reserved seats were safely released.');
      // Refresh event seat counts
      const { data } = await api.get(`/events/${event._id}`);
      setEvent(data.event);
    } catch {
      setSandboxModal(null);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
      </Container>
    );
  }

  // Booking Confirmation Screen
  if (confirmedBooking) {
    return (
      <section className="ev-section ev-section-light" style={{ minHeight: '75vh' }}>
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
                    <h1 className="h4 fw-bold mb-1">Booking Confirmed</h1>
                    <p className="small text-muted mb-0">
                      Payment verified on server · Reference{' '}
                      <strong className="ev-mono text-dark">{confirmedBooking.bookingCode}</strong>
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
                      <h2 className="h5 fw-bold mb-2">{confirmedBooking.eventTitle}</h2>
                      <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
                        <span className="d-inline-flex align-items-center gap-1">
                          <FiCalendar size={14} />
                          {formatEventDate(confirmedBooking.eventDate)} · {confirmedBooking.eventTime}
                        </span>
                        <span className="d-inline-flex align-items-center gap-1">
                          <FiMapPin size={14} />
                          {confirmedBooking.eventVenue}, {confirmedBooking.eventCity}
                        </span>
                      </div>

                      <Row className="g-3 small pt-3 border-top" style={{ borderColor: 'var(--ev-border)' }}>
                        <Col sm={4}>
                          <div className="text-muted">Ticket Tier</div>
                          <div className="fw-semibold">{confirmedBooking.ticketCategoryName}</div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted">Quantity</div>
                          <div className="fw-semibold ev-num">{confirmedBooking.quantity} Pass(es)</div>
                        </Col>
                        <Col sm={4}>
                          <div className="text-muted">Total Paid (INR)</div>
                          <div className="fw-bold ev-mono">{formatINR(confirmedBooking.totalAmount)}</div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                  <Col md={4}>
                    <TicketQRCode booking={confirmedBooking} size={140} />
                  </Col>
                </Row>

                <div className="d-flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => downloadBookingTicketPDF(confirmedBooking)}
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

  if (!event) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Event not found.'}</Alert>
        <Link to="/events" className="btn btn-ev-outline">
          Back to Events
        </Link>
      </Container>
    );
  }

  const maxQuantity = Math.min(10, Number(selectedTier?.availableSeats || 0));

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '75vh' }}>
      <Container>
        <div className="mb-4">
          <h1 className="ev-section-title">Complete Your Booking</h1>
          <p className="ev-section-subtitle mb-0">
            Select your ticket category and quantity for <strong>{event.title}</strong>.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-4 align-items-start">
          <Col lg={7}>
            <div className="ev-panel">
              <Form onSubmit={handleReserveAndPay}>
                <h2 className="h5 fw-bold mb-3">1. Select Ticket Category</h2>
                <div className="d-flex flex-column gap-2 mb-4">
                  {(event.ticketCategories || []).map((tier) => {
                    const isSelected = String(tier._id) === String(selectedTierId);
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
                          backgroundColor: isSelected ? 'var(--ev-primary-soft)' : '#FFFFFF',
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
                            <div className="small text-muted">{tier.description}</div>
                            <div className="small text-muted ev-num mt-1">
                              {soldOut ? 'Sold Out' : `${tier.availableSeats} seats available`}
                            </div>
                          </div>
                        </div>
                        <div className="ev-mono fw-bold fs-5">{formatINR(tier.price)}</div>
                      </label>
                    );
                  })}
                </div>

                <h2 className="h5 fw-bold mb-3">2. Quantity &amp; Contact</h2>
                <Row className="g-3 mb-4">
                  <Col sm={5}>
                    <Form.Label className="small fw-semibold">Number of Tickets</Form.Label>
                    <Form.Select
                      value={quantity}
                      disabled={maxQuantity <= 0}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    >
                      {Array.from({ length: Math.max(1, maxQuantity) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Ticket' : 'Tickets'}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col sm={7}>
                    <Form.Label className="small fw-semibold">Attendee Phone (For Entry SMS)</Form.Label>
                    <Form.Control
                      type="tel"
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                    />
                  </Col>
                </Row>

                <Button
                  type="submit"
                  disabled={processing || !selectedTier || selectedTier.availableSeats < quantity}
                  className="btn-ev-primary w-100 py-2"
                >
                  {processing
                    ? 'Reserving Seats...'
                    : `Proceed to Pay ${formatINR(totalAmount)}`}
                </Button>
              </Form>
            </div>
          </Col>

          {/* Booking Summary Sidebar */}
          <Col lg={5}>
            <div className="ev-panel">
              <h2 className="h5 fw-bold mb-3">Booking Summary</h2>

              <div className="mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--ev-border)' }}>
                <div className="fw-bold">{event.title}</div>
                <div className="small text-muted mt-1">
                  {formatEventDate(event.date)} · {event.time}
                </div>
                <div className="small text-muted">
                  {event.venue}, {event.city}
                </div>
              </div>

              <div className="d-flex flex-column gap-2 small mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--ev-border)' }}>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">
                    {selectedTier?.name} × {quantity}
                  </span>
                  <span className="ev-mono fw-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Platform &amp; Payment Fee (5%)</span>
                  <span className="ev-mono">{formatINR(convenienceFee)}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold">Total Payable (INR)</span>
                <span className="h4 fw-bold mb-0 ev-mono" style={{ color: 'var(--ev-primary)' }}>
                  {formatINR(totalAmount)}
                </span>
              </div>

              <div className="small text-muted d-flex align-items-start gap-2">
                <FiShield size={15} className="mt-1 flex-shrink-0" />
                <span>
                  Razorpay Test Mode integration verifies cryptographic payment signatures on our
                  Express server before confirming tickets.
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Razorpay Test Mode Interactive Verification Modal */}
      <Modal
        show={Boolean(sandboxModal)}
        onHide={handleSandboxFail}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Razorpay Test Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sandboxModal && (
            <>
              <div
                className="p-3 mb-3"
                style={{
                  backgroundColor: 'var(--ev-bg-light)',
                  borderRadius: 'var(--ev-radius-sm)',
                }}
              >
                <div className="small text-muted">Order ID</div>
                <div className="ev-mono small fw-semibold mb-2">{sandboxModal.order.id}</div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small fw-semibold">Amount Payable</span>
                  <span className="h5 fw-bold mb-0 ev-mono" style={{ color: 'var(--ev-primary)' }}>
                    {formatINR(sandboxModal.order.amountInInr)}
                  </span>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Select Test Payment Method</Form.Label>
                <Form.Select
                  value={sandboxMethod}
                  onChange={(e) => setSandboxMethod(e.target.value)}
                >
                  <option value="UPI (Google Pay / PhonePe)">UPI (Google Pay / PhonePe)</option>
                  <option value="Credit / Debit Card (Test)">Credit / Debit Card (Test)</option>
                  <option value="NetBanking (HDFC / ICICI Test)">NetBanking (HDFC / ICICI Test)</option>
                </Form.Select>
              </Form.Group>

              <p className="small text-muted mb-3">
                Confirming sends the server-signed challenge to <code>/api/payments/verify</code>{' '}
                for cryptographic verification before issuing your e-ticket.
              </p>

              <div className="d-flex gap-2">
                <Button
                  type="button"
                  disabled={processing}
                  onClick={handleSandboxConfirm}
                  className="btn-ev-primary flex-grow-1"
                >
                  {processing ? 'Verifying on Server...' : 'Authorize Test Payment'}
                </Button>
                <Button
                  type="button"
                  disabled={processing}
                  onClick={handleSandboxFail}
                  variant="outline-danger"
                >
                  Simulate Failure
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
}

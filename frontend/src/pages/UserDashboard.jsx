/**
 * src/pages/UserDashboard.jsx
 * Attendee workspace: Profile, Upcoming & Previous Bookings, Booking Details,
 * PDF Ticket Download, Cancel Booking, Event Reviews, Notifications, and Password Change.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Tabs,
  Tab,
  Table,
  Button,
  Form,
  Alert,
  Modal,
  Spinner,
} from 'react-bootstrap';
import { FiDownload, FiEye, FiXCircle, FiStar, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { formatINR, formatEventDate, INDIAN_CITIES } from '../data/eventsData';
import { downloadBookingTicketPDF } from '../services/pdfTicket';
import TicketQRCode from '../components/TicketQRCode';

export default function UserDashboard() {
  const { user, updateLocalUser } = useAuth();
  const { cities: contextCities } = useEvents();
  const cityOptions =
    contextCities.length > 0 ? contextCities.map((c) => c.name) : INDIAN_CITIES;

  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Profile & password forms
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || 'Mumbai',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Modals
  const [detailBooking, setDetailBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, notifRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/users/notifications'),
      ]);
      setBookings(bookRes.data.bookings || []);
      setNotifications(notifRes.data.notifications || []);
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to load your dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => b.bookingStatus !== 'cancelled' && new Date(b.eventDate) >= now
  );
  const previousBookings = bookings.filter(
    (b) => b.bookingStatus === 'cancelled' || new Date(b.eventDate) < now
  );

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const { data } = await api.put('/users/profile', profileForm);
      updateLocalUser(data.user);
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'danger', text: 'New passwords do not match.' });
      return;
    }
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setFeedback({ type: 'success', text: data.message });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Could not change password.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const { data } = await api.put(`/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by user from dashboard',
      });
      setFeedback({ type: 'success', text: data.message });
      await loadDashboardData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Cancellation failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setActionLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const { data } = await api.post('/reviews', {
        bookingId: reviewBooking._id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      setFeedback({ type: 'success', text: data.message });
      setReviewBooking(null);
      setReviewForm({ rating: 5, title: '', comment: '' });
      await loadDashboardData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to submit review.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await api.put(`/users/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (String(n._id) === String(notifId) ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const renderBookingTable = (items, emptyText) => {
    if (items.length === 0) {
      return (
        <div className="py-4 text-center">
          <p className="text-muted mb-3">{emptyText}</p>
          <Link to="/events" className="btn btn-ev-primary btn-sm">
            Explore Events
          </Link>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table className="ev-table mb-0">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Event</th>
              <th>Date</th>
              <th>Tier &amp; Qty</th>
              <th className="text-end">Total (INR)</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id}>
                <td className="ev-mono fw-semibold">{b.bookingCode}</td>
                <td>
                  <div className="fw-semibold">{b.eventTitle}</div>
                  <div className="small text-muted">
                    {b.eventVenue}, {b.eventCity}
                  </div>
                </td>
                <td className="ev-num">{formatEventDate(b.eventDate)}</td>
                <td>
                  <div>{b.ticketCategoryName}</div>
                  <div className="small text-muted ev-num">{b.quantity} ticket(s)</div>
                </td>
                <td className="text-end ev-mono fw-semibold">{formatINR(b.totalAmount)}</td>
                <td>
                  <span
                    className={`ev-status-text ${
                      b.bookingStatus === 'confirmed'
                        ? 'ev-status-success'
                        : b.bookingStatus === 'cancelled'
                        ? 'ev-status-danger'
                        : 'ev-status-warning'
                    }`}
                  >
                    {b.bookingStatus.toUpperCase()}
                  </span>
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => setDetailBooking(b)}
                      title="Booking Details"
                    >
                      <FiEye size={14} />
                    </Button>
                    {b.bookingStatus === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => downloadBookingTicketPDF(b)}
                        title="Download PDF Ticket"
                      >
                        <FiDownload size={14} />
                      </Button>
                    )}
                    {b.bookingStatus === 'confirmed' && b.paymentStatus === 'paid' && !b.hasReviewed && (
                      <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => setReviewBooking(b)}
                        title="Write Review"
                      >
                        <FiStar size={14} />
                      </Button>
                    )}
                    {b.bookingStatus !== 'cancelled' && new Date(b.eventDate) >= now && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={actionLoading}
                        onClick={() => handleCancelBooking(b._id)}
                        title="Cancel Booking"
                      >
                        <FiXCircle size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '78vh' }}>
      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="ev-section-title mb-1">My Dashboard</h1>
            <p className="text-muted mb-0">
              Signed in as <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>
          <Link to="/events" className="btn btn-ev-primary align-self-start">
            Book New Event
          </Link>
        </div>

        {/* Summary KPIs */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Total Bookings</div>
              <div className="ev-kpi-value">{bookings.length}</div>
            </div>
          </Col>
          <Col md={4}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Upcoming Confirmed</div>
              <div className="ev-kpi-value">{upcomingBookings.length}</div>
            </div>
          </Col>
          <Col md={4}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Total Spent (INR)</div>
              <div className="ev-kpi-value ev-mono">
                {formatINR(
                  bookings
                    .filter((b) => b.paymentStatus === 'paid')
                    .reduce((s, b) => s + Number(b.totalAmount || 0), 0)
                )}
              </div>
            </div>
          </Col>
        </Row>

        {feedback.text && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: '', text: '' })}
          >
            {feedback.text}
          </Alert>
        )}

        <div className="ev-panel">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            </div>
          ) : (
            <Tabs defaultActiveKey="upcoming" className="mb-4">
              <Tab eventKey="upcoming" title={`Upcoming Bookings (${upcomingBookings.length})`}>
                {renderBookingTable(upcomingBookings, 'You have no upcoming event bookings yet.')}
              </Tab>

              <Tab eventKey="previous" title={`Previous & Cancelled (${previousBookings.length})`}>
                {renderBookingTable(previousBookings, 'No past or cancelled bookings found.')}
              </Tab>

              <Tab eventKey="notifications" title={`Notifications (${notifications.length})`}>
                {notifications.length === 0 ? (
                  <p className="text-muted py-3 mb-0">No notifications yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className="p-3 d-flex justify-content-between align-items-start gap-3"
                        style={{
                          borderRadius: 'var(--ev-radius-sm)',
                          border: '1px solid var(--ev-border)',
                          backgroundColor: n.isRead ? '#FFFFFF' : 'var(--ev-primary-soft)',
                        }}
                      >
                        <div>
                          <div className="fw-semibold d-flex align-items-center gap-2">
                            <FiBell size={14} />
                            <span>{n.title}</span>
                          </div>
                          <p className="small text-muted mb-1">{n.message}</p>
                          <div className="small text-muted ev-num">
                            {formatEventDate(n.createdAt)}
                          </div>
                        </div>
                        {!n.isRead && (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => handleMarkNotificationRead(n._id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Tab>

              <Tab eventKey="profile" title="Profile & Password">
                <Row className="g-4 pt-2">
                  <Col lg={6}>
                    <h2 className="h5 fw-bold mb-3">Update Profile</h2>
                    <Form onSubmit={handleProfileSave}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">City</Form.Label>
                        <Form.Select
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        >
                          {cityOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Button type="submit" disabled={actionLoading} className="btn-ev-primary">
                        Save Profile
                      </Button>
                    </Form>
                  </Col>

                  <Col lg={6}>
                    <h2 className="h5 fw-bold mb-3">Change Password</h2>
                    <Form onSubmit={handlePasswordChange}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">New Password</Form.Label>
                        <Form.Control
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-semibold">Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                        />
                      </Form.Group>
                      <Button type="submit" disabled={actionLoading} className="btn-ev-outline">
                        Update Password
                      </Button>
                    </Form>
                  </Col>
                </Row>
              </Tab>
            </Tabs>
          )}
        </div>
      </Container>

      {/* Booking Details Modal */}
      <Modal show={Boolean(detailBooking)} onHide={() => setDetailBooking(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailBooking && (
            <div className="small d-flex flex-column gap-3">
              {detailBooking.bookingStatus === 'confirmed' && (
                <div className="d-flex justify-content-center">
                  <TicketQRCode booking={detailBooking} size={148} />
                </div>
              )}

              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Booking ID</span>
                  <strong className="ev-mono">{detailBooking.bookingCode}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Event</span>
                  <strong>{detailBooking.eventTitle}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Schedule</span>
                  <span>
                    {formatEventDate(detailBooking.eventDate)} · {detailBooking.eventTime}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Venue</span>
                  <span>
                    {detailBooking.eventVenue}, {detailBooking.eventCity}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Ticket Tier</span>
                  <span>
                    {detailBooking.ticketCategoryName} × {detailBooking.quantity}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Total Paid (INR)</span>
                  <strong className="ev-mono">{formatINR(detailBooking.totalAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Payment Reference</span>
                  <span className="ev-mono">{detailBooking.razorpayPaymentId || 'Pending'}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {detailBooking?.bookingStatus === 'confirmed' && (
            <Button
              onClick={() => downloadBookingTicketPDF(detailBooking)}
              className="btn-ev-primary"
            >
              Download PDF Ticket
            </Button>
          )}
          <Button variant="secondary" onClick={() => setDetailBooking(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Modal */}
      <Modal show={Boolean(reviewBooking)} onHide={() => setReviewBooking(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Review Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reviewBooking && (
            <Form onSubmit={handleSubmitReview}>
              <p className="small text-muted mb-3">
                Sharing feedback for <strong>{reviewBooking.eventTitle}</strong>
              </p>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Star Rating</Form.Label>
                <Form.Select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                >
                  <option value={5}>5 Stars — Exceptional</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Good</option>
                  <option value={2}>2 Stars — Fair</option>
                  <option value={1}>1 Star — Needs Improvement</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Headline (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Memorable evening and seamless check-in"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Your Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share details about the venue, acoustics, and organization..."
                />
              </Form.Group>
              <Button type="submit" disabled={actionLoading} className="btn-ev-primary w-100">
                {actionLoading ? 'Publishing...' : 'Submit Review'}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
}

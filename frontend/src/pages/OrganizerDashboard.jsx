/**
 * src/pages/OrganizerDashboard.jsx
 * Organizer Studio: Approval status, Create/Edit/Delete events, Multer image uploads,
 * Ticket Categories management, Bookings, Attendees, and Revenue Performance Analytics.
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
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiImage } from 'react-icons/fi';
import api, { resolveImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import {
  EVENT_CATEGORIES,
  INDIAN_CITIES,
  EVENTORA_IMAGES,
  formatINR,
  formatEventDate,
} from '../data/eventsData';

const DEFAULT_TICKET_TIER = {
  name: 'General Admission',
  description: 'Standard entry pass',
  price: 999,
  totalSeats: 100,
  availableSeats: 100,
};

const EMPTY_EVENT_FORM = {
  title: '',
  shortDescription: '',
  description: '',
  category: 'Music Concerts',
  date: '2027-02-15',
  time: '6:30 PM IST',
  venue: '',
  address: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  bannerImage: EVENTORA_IMAGES.heroConcert,
  ticketCategories: [{ ...DEFAULT_TICKET_TIER }],
};

export default function OrganizerDashboard() {
  const { user, refreshUser } = useAuth();
  const { categories: contextCategories, cities: contextCities } = useEvents();

  const categoryOptions =
    contextCategories.length > 0
      ? contextCategories.map((c) => c.name)
      : EVENT_CATEGORIES;
  const cityOptions =
    contextCities.length > 0 ? contextCities.map((c) => c.name) : INDIAN_CITIES;

  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Create / Edit Event Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ type: '', text: '' });
  const [previewError, setPreviewError] = useState(false);

  // Organizer Profile Form
  const [orgProfile, setOrgProfile] = useState({
    organizationName: user?.organizerProfile?.organizationName || '',
    city: user?.organizerProfile?.city || user?.city || 'Mumbai',
    gstNumber: user?.organizerProfile?.gstNumber || '',
    website: user?.organizerProfile?.website || '',
    bio: user?.organizerProfile?.bio || '',
  });

  const loadOrganizerData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, evRes, bookRes, attRes] = await Promise.all([
        api.get('/organizer/dashboard'),
        api.get('/organizer/events'),
        api.get('/organizer/bookings'),
        api.get('/organizer/attendees'),
      ]);
      setDashboard(dashRes.data);
      setEvents(evRes.data.events || []);
      setBookings(bookRes.data.bookings || []);
      setAttendees(attRes.data.attendees || []);
      await refreshUser();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to load organizer dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    loadOrganizerData();
  }, [loadOrganizerData]);

  const approvalStatus =
    dashboard?.approvalStatus || user?.organizerProfile?.approvalStatus || 'pending';
  const isApproved = approvalStatus === 'approved' || user?.role === 'admin';

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setModalFeedback({ type: '', text: '' });
    setPreviewError(false);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/events/upload', formData, {
        headers: { 'Content-Type': undefined },
      });
      setEventForm((prev) => ({ ...prev, bannerImage: data.imageUrl }));
      setModalFeedback({
        type: 'success',
        text: 'Image uploaded successfully! Preview updated below.',
      });
    } catch (err) {
      setModalFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Image upload failed. Please try a JPG, PNG, or WebP file under 10MB.',
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setEventForm(EMPTY_EVENT_FORM);
    setModalFeedback({ type: '', text: '' });
    setPreviewError(false);
    setShowEventModal(true);
  };

  const openEditModal = (ev) => {
    setEditingEventId(ev._id);
    setEventForm({
      title: ev.title,
      shortDescription: ev.shortDescription,
      description: ev.description,
      category: ev.category,
      date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '2027-02-15',
      time: ev.time,
      venue: ev.venue,
      address: ev.address,
      city: ev.city,
      state: ev.state || '',
      bannerImage: ev.bannerImage,
      ticketCategories:
        ev.ticketCategories?.length > 0 ? ev.ticketCategories : [{ ...DEFAULT_TICKET_TIER }],
    });
    setModalFeedback({ type: '', text: '' });
    setPreviewError(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSavingEvent(true);
    setFeedback({ type: '', text: '' });
    setModalFeedback({ type: '', text: '' });

    try {
      if (editingEventId) {
        const { data } = await api.put(`/events/${editingEventId}`, eventForm);
        setFeedback({ type: 'success', text: data.message });
      } else {
        const { data } = await api.post('/events', eventForm);
        setFeedback({ type: 'success', text: data.message });
      }
      setShowEventModal(false);
      await loadOrganizerData();
    } catch (err) {
      setModalFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Could not save event.',
      });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const { data } = await api.delete(`/events/${eventId}`);
      setFeedback({ type: 'success', text: data.message });
      await loadOrganizerData();
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to delete event.',
      });
    }
  };

  const updateTicketTier = (idx, field, val) => {
    setEventForm((prev) => {
      const nextTiers = [...prev.ticketCategories];
      nextTiers[idx] = { ...nextTiers[idx], [field]: val };
      if (field === 'totalSeats' && !editingEventId) {
        nextTiers[idx].availableSeats = Number(val);
      }
      return { ...prev, ticketCategories: nextTiers };
    });
  };

  const addTicketTier = () => {
    setEventForm((prev) => ({
      ...prev,
      ticketCategories: [
        ...prev.ticketCategories,
        {
          name: 'VIP Pass',
          description: 'Priority seating & lounge access',
          price: 2499,
          totalSeats: 50,
          availableSeats: 50,
        },
      ],
    }));
  };

  const removeTicketTier = (idx) => {
    setEventForm((prev) => ({
      ...prev,
      ticketCategories: prev.ticketCategories.filter((_, i) => i !== idx),
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/organizer/profile', orgProfile);
      setFeedback({ type: 'success', text: data.message });
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Update failed.' });
    }
  };

  const stats = dashboard?.stats || {};

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '78vh' }}>
      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="ev-section-title mb-1">Organizer Studio</h1>
            <p className="text-muted mb-0">
              {user?.organizerProfile?.organizationName || user?.name} · Approval Status:{' '}
              <strong
                className={
                  approvalStatus === 'approved'
                    ? 'ev-status-success'
                    : approvalStatus === 'rejected'
                    ? 'ev-status-danger'
                    : 'ev-status-warning'
                }
              >
                {approvalStatus.toUpperCase()}
              </strong>
            </p>
          </div>
          <Button
            type="button"
            disabled={!isApproved}
            onClick={openCreateModal}
            className="btn-ev-primary d-inline-flex align-items-center gap-2 align-self-start"
          >
            <FiPlus size={16} />
            <span>Create New Event</span>
          </Button>
        </div>

        {!isApproved && (
          <Alert variant={approvalStatus === 'rejected' ? 'danger' : 'warning'} className="mb-4">
            {approvalStatus === 'rejected'
              ? `Your organizer application was rejected: ${
                  user?.organizerProfile?.rejectionReason || 'Contact support.'
                }`
              : 'Your organizer account is pending administrator approval. Once approved in the Admin Panel, you can publish events and manage ticket inventory.'}
          </Alert>
        )}

        {feedback.text && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: '', text: '' })}
          >
            {feedback.text}
          </Alert>
        )}

        {/* KPI Grid */}
        <Row className="g-3 mb-4">
          <Col md={3} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Total Events</div>
              <div className="ev-kpi-value">{stats.totalEvents ?? 0}</div>
            </div>
          </Col>
          <Col md={3} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Approved &amp; Live</div>
              <div className="ev-kpi-value">{stats.approvedEvents ?? 0}</div>
            </div>
          </Col>
          <Col md={3} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Tickets Sold</div>
              <div className="ev-kpi-value">{stats.totalTicketsSold ?? 0}</div>
            </div>
          </Col>
          <Col md={3} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Gross Revenue (INR)</div>
              <div className="ev-kpi-value ev-mono">{formatINR(stats.totalRevenue || 0)}</div>
            </div>
          </Col>
        </Row>

        <div className="ev-panel">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            </div>
          ) : (
            <Tabs defaultActiveKey="events" className="mb-4">
              <Tab eventKey="events" title={`My Events (${events.length})`}>
                {events.length === 0 ? (
                  <p className="text-muted py-3 mb-0">
                    No events created yet. Once approved, click &ldquo;Create New Event&rdquo; to
                    publish your first listing.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table className="ev-table mb-0">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th className="text-end">Remaining Seats</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((ev) => {
                          const remSeats = (ev.ticketCategories || []).reduce(
                            (s, t) => s + Number(t.availableSeats || 0),
                            0
                          );
                          return (
                            <tr key={ev._id}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '56px',
                                      height: '42px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--ev-bg-light)',
                                      border: '1px solid var(--ev-border)',
                                    }}
                                  >
                                    {ev.bannerImage ? (
                                      <img
                                        src={resolveImageUrl(ev.bannerImage)}
                                        alt={ev.title}
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <FiImage size={16} className="text-muted" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{ev.title}</div>
                                    <div className="small text-muted">{ev.city}</div>
                                  </div>
                                </div>
                              </td>
                              <td>{ev.category}</td>
                              <td className="ev-num">{formatEventDate(ev.date)}</td>
                              <td>
                                <span
                                  className={`ev-status-text ${
                                    ev.status === 'approved'
                                      ? 'ev-status-success'
                                      : ev.status === 'rejected'
                                      ? 'ev-status-danger'
                                      : 'ev-status-warning'
                                  }`}
                                >
                                  {ev.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="text-end ev-num">{remSeats}</td>
                              <td className="text-end">
                                <div className="d-inline-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={() => openEditModal(ev)}
                                    title="Edit Event"
                                  >
                                    <FiEdit2 size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteEvent(ev._id)}
                                    title="Delete Event"
                                  >
                                    <FiTrash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab>

              <Tab eventKey="analytics" title="Revenue & Performance">
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>City</th>
                        <th className="text-end">Tickets Sold</th>
                        <th className="text-end">Remaining</th>
                        <th className="text-end">Revenue (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard?.eventPerformance || []).map((ep) => (
                        <tr key={ep._id}>
                          <td className="fw-semibold">{ep.title}</td>
                          <td>{ep.city}</td>
                          <td className="text-end ev-num">
                            {ep.ticketsSold} / {ep.totalCapacity}
                          </td>
                          <td className="text-end ev-num">{ep.availableSeats}</td>
                          <td className="text-end ev-mono fw-bold">{formatINR(ep.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="bookings" title={`Bookings (${bookings.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Event</th>
                        <th>Attendee</th>
                        <th>Tier &amp; Qty</th>
                        <th className="text-end">Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id}>
                          <td className="ev-mono fw-semibold">{b.bookingCode}</td>
                          <td>{b.eventTitle}</td>
                          <td>
                            <div>{b.userName}</div>
                            <div className="small text-muted">{b.userEmail}</div>
                          </td>
                          <td>
                            {b.ticketCategoryName} × {b.quantity}
                          </td>
                          <td className="text-end ev-mono fw-semibold">{formatINR(b.totalAmount)}</td>
                          <td>
                            <span
                              className={`ev-status-text ${
                                b.bookingStatus === 'confirmed'
                                  ? 'ev-status-success'
                                  : 'ev-status-warning'
                              }`}
                            >
                              {b.bookingStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="attendees" title={`Attendees (${attendees.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Pass Code</th>
                        <th>Attendee Name</th>
                        <th>Email / Phone</th>
                        <th>Event</th>
                        <th>Tier</th>
                        <th className="text-end">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((a) => (
                        <tr key={a.bookingId}>
                          <td className="ev-mono">{a.bookingCode}</td>
                          <td className="fw-semibold">{a.attendeeName}</td>
                          <td>
                            <div>{a.attendeeEmail}</div>
                            <div className="small text-muted">{a.attendeePhone || '-'}</div>
                          </td>
                          <td>{a.eventTitle}</td>
                          <td>{a.ticketCategory}</td>
                          <td className="text-end ev-num">{a.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="profile" title="Organizer Profile">
                <Form onSubmit={handleProfileUpdate} style={{ maxWidth: '640px' }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Label className="small fw-semibold">Organization Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={orgProfile.organizationName}
                        onChange={(e) =>
                          setOrgProfile({ ...orgProfile, organizationName: e.target.value })
                        }
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small fw-semibold">City</Form.Label>
                      <Form.Select
                        value={orgProfile.city}
                        onChange={(e) => setOrgProfile({ ...orgProfile, city: e.target.value })}
                      >
                        {cityOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small fw-semibold">GST Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={orgProfile.gstNumber}
                        onChange={(e) =>
                          setOrgProfile({ ...orgProfile, gstNumber: e.target.value })
                        }
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small fw-semibold">Website</Form.Label>
                      <Form.Control
                        type="url"
                        value={orgProfile.website}
                        onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })}
                      />
                    </Col>
                    <Col xs={12}>
                      <Form.Label className="small fw-semibold">Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={orgProfile.bio}
                        onChange={(e) => setOrgProfile({ ...orgProfile, bio: e.target.value })}
                      />
                    </Col>
                    <Col xs={12}>
                      <Button type="submit" className="btn-ev-primary">
                        Save Organizer Profile
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Tab>
            </Tabs>
          )}
        </div>
      </Container>

      {/* Create / Edit Event Modal */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">
            {editingEventId ? 'Edit Event' : 'Create New Event'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalFeedback.text && (
            <Alert
              variant={modalFeedback.type}
              dismissible
              onClose={() => setModalFeedback({ type: '', text: '' })}
              className="mb-3"
            >
              {modalFeedback.text}
            </Alert>
          )}
          <Form onSubmit={handleSaveEvent}>
            <Row className="g-3">
              <Col md={8}>
                <Form.Label className="small fw-semibold">Event Title</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Jaipur Monsoon Music Night"
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Category</Form.Label>
                <Form.Select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12}>
                <Form.Label className="small fw-semibold">Short Summary</Form.Label>
                <Form.Control
                  type="text"
                  required
                  maxLength={240}
                  value={eventForm.shortDescription}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, shortDescription: e.target.value })
                  }
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="small fw-semibold">Full Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </Col>

              <Col md={4}>
                <Form.Label className="small fw-semibold">Date</Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Time</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">City</Form.Label>
                <Form.Select
                  value={eventForm.city}
                  onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                >
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label className="small fw-semibold">Venue Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Full Address</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={eventForm.address}
                  onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                />
              </Col>

              <Col xs={12}>
                <Form.Label className="small fw-semibold">
                  Event Banner Image (Upload via Multer or Choose Preset)
                </Form.Label>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                  <label className="btn btn-ev-outline btn-sm d-inline-flex align-items-center gap-2 mb-0">
                    <FiUpload size={14} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                    />
                  </label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={eventForm.bannerImage}
                    onChange={(e) => {
                      setPreviewError(false);
                      setEventForm({ ...eventForm, bannerImage: e.target.value });
                    }}
                    placeholder="/uploads/... or https://..."
                    style={{ maxWidth: '420px' }}
                  />
                </div>

                {/* Live Banner Image Preview */}
                {eventForm.bannerImage && (
                  <div
                    className="overflow-hidden mb-2 d-flex align-items-center justify-content-center"
                    style={{
                      maxWidth: '340px',
                      aspectRatio: '16 / 9',
                      borderRadius: 'var(--ev-radius-sm)',
                      border: '1px solid var(--ev-border)',
                      backgroundColor: 'var(--ev-bg-light)',
                    }}
                  >
                    {!previewError ? (
                      <img
                        src={resolveImageUrl(eventForm.bannerImage)}
                        alt="Banner Preview"
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={() => setPreviewError(true)}
                      />
                    ) : (
                      <div className="p-3 text-center small text-danger">
                        Unable to preview image URL. Please upload a valid JPG, PNG, or WebP file.
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="small text-muted">Quick Presets:</span>
                  {[
                    { label: 'Concert', url: EVENTORA_IMAGES.heroConcert },
                    { label: 'Wedding', url: EVENTORA_IMAGES.wedding },
                    { label: 'Festival', url: EVENTORA_IMAGES.festival },
                    { label: 'Tech', url: EVENTORA_IMAGES.tech },
                    { label: 'Workshop', url: EVENTORA_IMAGES.workshop },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant={eventForm.bannerImage === preset.url ? 'primary' : 'outline-secondary'}
                      onClick={() => {
                        setPreviewError(false);
                        setEventForm({ ...eventForm, bannerImage: preset.url });
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </Col>

              <Col xs={12} className="pt-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="small fw-bold mb-0">Ticket Categories &amp; Pricing (INR)</Form.Label>
                  <Button type="button" size="sm" variant="outline-primary" onClick={addTicketTier}>
                    + Add Tier
                  </Button>
                </div>

                {eventForm.ticketCategories.map((tier, idx) => (
                  <Row key={idx} className="g-2 mb-2 align-items-end">
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        size="sm"
                        required
                        placeholder="Tier Name"
                        value={tier.name}
                        onChange={(e) => updateTicketTier(idx, 'name', e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="0"
                        required
                        placeholder="Price (₹)"
                        value={tier.price}
                        onChange={(e) => updateTicketTier(idx, 'price', Number(e.target.value))}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="number"
                        size="sm"
                        min="1"
                        required
                        placeholder="Total Seats"
                        value={tier.totalSeats}
                        onChange={(e) =>
                          updateTicketTier(idx, 'totalSeats', Number(e.target.value))
                        }
                      />
                    </Col>
                    <Col md={2}>
                      {eventForm.ticketCategories.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-danger"
                          onClick={() => removeTicketTier(idx)}
                          className="w-100"
                        >
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowEventModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEvent} className="btn-ev-primary">
                {savingEvent ? 'Saving...' : editingEventId ? 'Save Changes' : 'Publish Event'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </section>
  );
}

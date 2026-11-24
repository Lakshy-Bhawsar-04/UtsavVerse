/**
 * src/pages/AdminDashboard.jsx
 * Complete Admin Console: Overview KPIs, Organizer Approvals, Event Approvals,
 * User Management, Category Management, Bookings, Payments Ledger, Reviews, and Analytics.
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
  Spinner,
} from 'react-bootstrap';
import { FiCheck, FiX, FiStar, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import { useEvents } from '../context/EventContext';
import { formatINR, formatEventDate } from '../data/eventsData';

export default function AdminDashboard() {
  const { refreshCatalog } = useEvents();
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newCity, setNewCity] = useState({ name: '', state: '' });

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        dashRes,
        usersRes,
        orgRes,
        evRes,
        catRes,
        cityRes,
        bookRes,
        payRes,
        revRes,
      ] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/organizers'),
        api.get('/admin/events'),
        api.get('/admin/categories'),
        api.get('/admin/cities'),
        api.get('/admin/bookings'),
        api.get('/admin/payments'),
        api.get('/admin/reviews'),
      ]);

      setStats(dashRes.data.stats);
      setCategoryStats(dashRes.data.categoryStats || []);
      setUsers(usersRes.data.users || []);
      setOrganizers(orgRes.data.organizers || []);
      setEvents(evRes.data.events || []);
      setCategories(catRes.data.categories || []);
      setCities(cityRes.data.cities || []);
      setBookings(bookRes.data.bookings || []);
      setPayments(payRes.data.payments || []);
      setReviews(revRes.data.reviews || []);
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to load admin console data.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleOrganizerApproval = async (id, status) => {
    try {
      const { data } = await api.put(`/admin/organizers/${id}/approval`, { status });
      setFeedback({ type: 'success', text: data.message });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleEventApproval = async (id, payload) => {
    try {
      const { data } = await api.put(`/admin/events/${id}/approval`, payload);
      setFeedback({ type: 'success', text: data.message });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      setFeedback({ type: 'success', text: data.message });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/categories', newCategory);
      setFeedback({ type: 'success', text: data.message });
      setNewCategory({ name: '', description: '' });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to add category.' });
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const { data } = await api.delete(`/admin/categories/${id}`);
      setFeedback({ type: 'success', text: data.message });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/cities', newCity);
      setFeedback({ type: 'success', text: data.message });
      setNewCity({ name: '', state: '' });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Failed to add city.' });
    }
  };

  const handleDeleteCity = async (id) => {
    try {
      const { data } = await api.delete(`/admin/cities/${id}`);
      setFeedback({ type: 'success', text: data.message });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      const { data } = await api.delete(`/admin/reviews/${id}`);
      setFeedback({ type: 'success', text: data.message });
      await loadAdminData();
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '80vh' }}>
      <Container>
        <div className="mb-4">
          <h1 className="ev-section-title mb-1">Admin Console</h1>
          <p className="text-muted mb-0">
            Monitor platform revenue, approve organizers &amp; events, and manage categories,
            bookings, and payments.
          </p>
        </div>

        {feedback.text && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: '', text: '' })}
          >
            {feedback.text}
          </Alert>
        )}

        {/* Overview KPI Row */}
        <Row className="g-3 mb-4">
          <Col lg={2} md={4} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Users</div>
              <div className="ev-kpi-value">{stats?.totalUsers ?? 0}</div>
            </div>
          </Col>
          <Col lg={2} md={4} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Organizers</div>
              <div className="ev-kpi-value">{stats?.totalOrganizers ?? 0}</div>
            </div>
          </Col>
          <Col lg={2} md={4} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Events</div>
              <div className="ev-kpi-value">{stats?.totalEvents ?? 0}</div>
            </div>
          </Col>
          <Col lg={3} md={6} sm={6}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Confirmed Bookings</div>
              <div className="ev-kpi-value">{stats?.confirmedBookings ?? 0}</div>
            </div>
          </Col>
          <Col lg={3} md={6} sm={12}>
            <div className="ev-kpi-card">
              <div className="ev-kpi-label">Total Revenue (INR)</div>
              <div className="ev-kpi-value ev-mono" style={{ color: 'var(--ev-primary)' }}>
                {formatINR(stats?.totalRevenue || 0)}
              </div>
            </div>
          </Col>
        </Row>

        <div className="ev-panel">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            </div>
          ) : (
            <Tabs defaultActiveKey="organizers" className="mb-4">
              <Tab
                eventKey="organizers"
                title={`Organizers (${organizers.length})`}
              >
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Contact</th>
                        <th>City</th>
                        <th>Approval Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizers.map((org) => {
                        const status = org.organizerProfile?.approvalStatus || 'pending';
                        return (
                          <tr key={org._id}>
                            <td>
                              <div className="fw-semibold">
                                {org.organizerProfile?.organizationName || org.name}
                              </div>
                              <div className="small text-muted">{org.name}</div>
                            </td>
                            <td>
                              <div>{org.email}</div>
                              <div className="small text-muted">{org.phone || '-'}</div>
                            </td>
                            <td>{org.organizerProfile?.city || org.city}</td>
                            <td>
                              <span
                                className={`ev-status-text ${
                                  status === 'approved'
                                    ? 'ev-status-success'
                                    : status === 'rejected'
                                    ? 'ev-status-danger'
                                    : 'ev-status-warning'
                                }`}
                              >
                                {status.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleOrganizerApproval(org._id, 'approved')}
                                  title="Approve Organizer"
                                >
                                  <FiCheck size={14} /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleOrganizerApproval(org._id, 'rejected')}
                                  title="Reject Organizer"
                                >
                                  <FiX size={14} /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="events" title={`Events (${events.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Organizer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev._id}>
                          <td>
                            <div className="fw-semibold">{ev.title}</div>
                            <div className="small text-muted">
                              {ev.category} · {ev.city}
                            </div>
                          </td>
                          <td>{ev.organizerName}</td>
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
                          <td>{ev.isFeatured ? 'Featured' : 'Standard'}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleEventApproval(ev._id, { status: 'approved' })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleEventApproval(ev._id, { status: 'rejected' })}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() =>
                                  handleEventApproval(ev._id, { isFeatured: !ev.isFeatured })
                                }
                              >
                                <FiStar size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="users" title={`Users (${users.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>City</th>
                        <th>Account Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td className="fw-semibold">{u.name}</td>
                          <td>{u.email}</td>
                          <td className="text-capitalize">{u.role}</td>
                          <td>{u.city}</td>
                          <td>
                            <span
                              className={`ev-status-text ${
                                u.isActive !== false ? 'ev-status-success' : 'ev-status-danger'
                              }`}
                            >
                              {u.isActive !== false ? 'ACTIVE' : 'DISABLED'}
                            </span>
                          </td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant={u.isActive !== false ? 'outline-danger' : 'outline-success'}
                              onClick={() => handleToggleUser(u._id)}
                            >
                              {u.isActive !== false ? 'Disable' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="categories" title={`Categories (${categories.length})`}>
                <Form onSubmit={handleCreateCategory} className="mb-4">
                  <Row className="g-2 align-items-end">
                    <Col md={4}>
                      <Form.Label className="small fw-semibold">Category Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g. Literary Festivals"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small fw-semibold">Description</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCategory.description}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, description: e.target.value })
                        }
                        placeholder="Short category overview"
                      />
                    </Col>
                    <Col md={2}>
                      <Button type="submit" className="btn-ev-primary w-100">
                        Add Category
                      </Button>
                    </Col>
                  </Row>
                </Form>

                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Slug</th>
                        <th>Description</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c._id}>
                          <td className="fw-semibold">{c.name}</td>
                          <td className="ev-mono small">{c.slug}</td>
                          <td className="small text-muted">{c.description}</td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteCategory(c._id)}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="cities" title={`Cities (${cities.length})`}>
                <Form onSubmit={handleCreateCity} className="mb-4">
                  <Row className="g-2 align-items-end">
                    <Col md={5}>
                      <Form.Label className="small fw-semibold">City Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={newCity.name}
                        onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                        placeholder="e.g. Indore"
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Label className="small fw-semibold">State</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCity.state}
                        onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
                        placeholder="e.g. Madhya Pradesh"
                      />
                    </Col>
                    <Col md={2}>
                      <Button type="submit" className="btn-ev-primary w-100">
                        Add City
                      </Button>
                    </Col>
                  </Row>
                </Form>

                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>City Name</th>
                        <th>State</th>
                        <th>Slug</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((ct) => (
                        <tr key={ct._id}>
                          <td className="fw-semibold">{ct.name}</td>
                          <td className="small text-muted">{ct.state || '-'}</td>
                          <td className="ev-mono small">{ct.slug}</td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteCity(ct._id)}
                              title="Delete City"
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </td>
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
                        <th>Booking Code</th>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Tier &amp; Qty</th>
                        <th className="text-end">Amount (INR)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b._id}>
                          <td className="ev-mono fw-semibold">{b.bookingCode}</td>
                          <td>{b.userName}</td>
                          <td>{b.eventTitle}</td>
                          <td>
                            {b.ticketCategoryName} × {b.quantity}
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="payments" title={`Payments (${payments.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Razorpay Order ID</th>
                        <th>Payment ID</th>
                        <th>Method</th>
                        <th className="text-end">Amount (INR)</th>
                        <th>Server Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td className="ev-mono">{p.bookingCode || '-'}</td>
                          <td className="ev-mono small">{p.razorpayOrderId}</td>
                          <td className="ev-mono small">{p.razorpayPaymentId || '-'}</td>
                          <td>{p.method}</td>
                          <td className="text-end ev-mono fw-semibold">{formatINR(p.amount)}</td>
                          <td>
                            <span
                              className={`ev-status-text ${
                                p.verifiedOnServer ? 'ev-status-success' : 'ev-status-warning'
                              }`}
                            >
                              {p.verifiedOnServer ? 'VERIFIED' : p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r) => (
                        <tr key={r._id}>
                          <td className="fw-semibold">{r.userName}</td>
                          <td>{r.eventTitle}</td>
                          <td className="ev-num fw-semibold">{r.rating} / 5</td>
                          <td className="small text-muted">{r.comment}</td>
                          <td className="text-end">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteReview(r._id)}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="reports" title="Reports & Analytics">
                <h2 className="h5 fw-bold mb-3">Revenue Breakdown by Category</h2>
                <div className="table-responsive">
                  <Table className="ev-table mb-0">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-end">Events Listed</th>
                        <th className="text-end">Paid Bookings</th>
                        <th className="text-end">Revenue (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryStats.map((cs) => (
                        <tr key={cs.category}>
                          <td className="fw-semibold">{cs.category}</td>
                          <td className="text-end ev-num">{cs.eventCount}</td>
                          <td className="text-end ev-num">{cs.bookingCount}</td>
                          <td className="text-end ev-mono fw-bold">{formatINR(cs.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>
            </Tabs>
          )}
        </div>
      </Container>
    </section>
  );
}

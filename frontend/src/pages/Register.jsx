/**
 * src/pages/Register.jsx
 * Registration page supporting User, Organizer (pending admin approval), and initial Admin setup.
 */

import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import api from '../services/api';
import { INDIAN_CITIES } from '../data/eventsData';

export default function Register() {
  const { register } = useAuth();
  const { cities: contextCities } = useEvents();
  const cityOptions =
    contextCities.length > 0 ? contextCities.map((c) => c.name) : INDIAN_CITIES;
  const navigate = useNavigate();

  const [hasAdmin, setHasAdmin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Mumbai',
    role: 'user',
    organizationName: '',
    gstNumber: '',
    bio: '',
    adminSetupCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/auth/status')
      .then((res) => setHasAdmin(Boolean(res.data?.hasAdmin)))
      .catch(() => setHasAdmin(true));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await register(form);
      const role = data.user?.role;
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'organizer') navigate('/organizer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '80vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={9} lg={7}>
            <div className="ev-panel p-4 p-md-5">
              <h1 className="h3 fw-bold mb-1">Create Your UtsavVerse Account</h1>
              <p className="text-muted small mb-4">
                Join as an attendee to book passes or register as an event organizer.
              </p>

              {error && <Alert variant="danger">{error}</Alert>}

              {/* Account Role Selector */}
              <div className="mb-4">
                <Form.Label className="small fw-semibold">Account Type</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'user' })}
                    className={form.role === 'user' ? 'btn-ev-primary' : 'btn-ev-outline'}
                  >
                    Attendee (User)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'organizer' })}
                    className={form.role === 'organizer' ? 'btn-ev-primary' : 'btn-ev-outline'}
                  >
                    Event Organizer
                  </Button>
                  {!hasAdmin && (
                    <Button
                      type="button"
                      onClick={() => setForm({ ...form, role: 'admin' })}
                      className={form.role === 'admin' ? 'btn-ev-primary' : 'btn-ev-outline'}
                    >
                      Initial Admin Setup
                    </Button>
                  )}
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98XXXXXXXX"
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label className="small fw-semibold">City</Form.Label>
                    <Form.Select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    >
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  {form.role === 'organizer' && (
                    <>
                      <Col md={6}>
                        <Form.Label className="small fw-semibold">Organization / Studio Name</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={form.organizationName}
                          onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                          placeholder="e.g. Rhythm Live India"
                        />
                      </Col>

                      <Col md={6}>
                        <Form.Label className="small fw-semibold">GST / Business ID (Optional)</Form.Label>
                        <Form.Control
                          type="text"
                          value={form.gstNumber}
                          onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                          placeholder="27AABCU9603R1ZM"
                        />
                      </Col>

                      <Col xs={12}>
                        <Form.Label className="small fw-semibold">About Your Events</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          placeholder="Describe the concerts, weddings, or conferences you organize..."
                        />
                        <Form.Text className="text-muted">
                          Organizer accounts require administrator approval before publishing live
                          events.
                        </Form.Text>
                      </Col>
                    </>
                  )}
                </Row>

                <Button type="submit" disabled={loading} className="btn-ev-primary w-100 py-2 mt-4">
                  {loading
                    ? 'Creating Account...'
                    : form.role === 'organizer'
                    ? 'Submit Organizer Application'
                    : form.role === 'admin'
                    ? 'Initialize Admin Account'
                    : 'Create Account'}
                </Button>
              </Form>

              <p className="small text-muted text-center mt-4 mb-0">
                Already registered?{' '}
                <Link to="/login" className="fw-semibold" style={{ color: 'var(--ev-primary)' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

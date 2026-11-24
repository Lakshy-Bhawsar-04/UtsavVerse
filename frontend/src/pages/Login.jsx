/**
 * src/pages/Login.jsx
 * User, Organizer, and Admin login page with Forgot/Reset Password flow.
 */

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Modal } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(form);
      const role = data.user?.role;
      const from = location.state?.from;

      if (from) {
        navigate(from, { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const { data } = await api.post('/auth/forgot-password', { email: resetEmail });
      setForgotMsg({ type: 'success', text: data.message });
      if (data.resetCode) setDevCodeHint(data.resetCode);
      setResetStep(2);
    } catch (err) {
      setForgotMsg({
        type: 'danger',
        text: err.response?.data?.message || 'Could not generate reset code.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg({ type: '', text: '' });
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: resetEmail,
        resetCode,
        newPassword,
      });
      setForgotMsg({ type: 'success', text: data.message });
      setTimeout(() => {
        setShowForgot(false);
        setResetStep(1);
        setDevCodeHint('');
      }, 1400);
    } catch (err) {
      setForgotMsg({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to reset password.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <section className="ev-section ev-section-light" style={{ minHeight: '75vh' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={7} lg={5}>
            <div className="ev-panel p-4 p-md-5">
              <h1 className="h3 fw-bold mb-1">Welcome Back</h1>
              <p className="text-muted small mb-4">
                Sign in to access your tickets, organizer studio, or admin console.
              </p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="small fw-semibold mb-0">Password</Form.Label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(true);
                        setForgotMsg({ type: '', text: '' });
                      }}
                      className="btn btn-link p-0 small text-decoration-none"
                      style={{ color: 'var(--ev-primary)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Form.Control
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                  />
                </Form.Group>

                <Button type="submit" disabled={loading} className="btn-ev-primary w-100 py-2 mt-2">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form>

              <p className="small text-muted text-center mt-4 mb-0">
                New to UtsavVerse?{' '}
                <Link to="/register" className="fw-semibold" style={{ color: 'var(--ev-primary)' }}>
                  Create an account
                </Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Forgot Password Modal */}
      <Modal show={showForgot} onHide={() => setShowForgot(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold">Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {forgotMsg.message && <Alert variant={forgotMsg.type}>{forgotMsg.message}</Alert>}
          {forgotMsg.text && <Alert variant={forgotMsg.type}>{forgotMsg.text}</Alert>}

          {resetStep === 1 ? (
            <Form onSubmit={handleRequestReset}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Registered Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your account email"
                />
              </Form.Group>
              <Button type="submit" disabled={forgotLoading} className="btn-ev-primary w-100">
                {forgotLoading ? 'Generating Code...' : 'Send Verification Code'}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleConfirmReset}>
              {devCodeHint && (
                <Alert variant="info" className="small py-2">
                  Development verification code: <strong className="ev-mono">{devCodeHint}</strong>
                </Alert>
              )}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">6-Digit Verification Code</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">New Password</Form.Label>
                <Form.Control
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </Form.Group>
              <Button type="submit" disabled={forgotLoading} className="btn-ev-primary w-100">
                {forgotLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
}

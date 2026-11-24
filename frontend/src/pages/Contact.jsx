
/**
 * src/pages/Contact.jsx
 * Premium responsive contact page with Google Maps.
 * Dark/Light Mode support.
 */

import { useState } from 'react';

import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert
} from 'react-bootstrap';

import {
  FiMail,
  FiMapPin,
  FiPhone,
  FiClock,
  FiMessageCircle,
  FiArrowRight,
  FiHeadphones,
  FiCheckCircle,
  FiNavigation
} from 'react-icons/fi';

import api from '../services/api';

export default function Contact() {

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState({
    type: '',
    message: ''
  });

  // Contact Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.post('/public/contact', form);

      setStatus({
        type: 'success',
        message: data.message
      });

      setForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (err) {

      setStatus({
        type: 'danger',
        message:
          err.response?.data?.message ||
          'Unable to send message. Please try again.'
      });

    } finally {
      setSubmitting(false);
    }
  };

  return (

    <section className="ev-section ev-contact-page">

      <Container>

        {/* Page Heading */}
        <div className="ev-contact-heading mb-5">

          <span className="ev-contact-eyebrow">
            <FiMessageCircle />
            WE ARE HERE TO HELP
          </span>

          <h1 className="ev-section-title mt-3">
            Let's Start a <span>Conversation.</span>
          </h1>

          <p className="ev-section-subtitle">
            Have questions about bookings, events, or partnerships?
            Our team is ready to help you with every step.
          </p>

        </div>

        <Row className="g-4">

          {/* Left Contact Information */}
          <Col lg={5}>

            <div className="ev-contact-info h-100">

              <div className="ev-contact-info-content">

                <div className="ev-contact-icon-main">
                  <FiHeadphones size={30} />
                </div>

                <h2>Get in Touch</h2>

                <p className="ev-contact-description">
                  Whether you need booking assistance or want to
                  organize an event, we would love to hear from you.
                </p>

                {/* Address */}
                <div className="ev-contact-item">

                  <div className="ev-contact-icon">
                    <FiMapPin />
                  </div>

                  <div>
                    <h3>Our Office</h3>
                    <p>
                      Bhawarkua, Indore,
                      Madhya Pradesh 452001
                    </p>
                  </div>

                </div>

                {/* Email */}
                <div className="ev-contact-item">

                  <div className="ev-contact-icon">
                    <FiMail />
                  </div>

                  <div>
                    <h3>Email Support</h3>
                    <p>contact@universalinformatics.com</p>
                  </div>

                </div>

                {/* Phone */}
                <div className="ev-contact-item">

                  <div className="ev-contact-icon">
                    <FiPhone />
                  </div>

                  <div>
                    <h3>Organizer Desk</h3>
                    <p>+91 22 4000 8800</p>
                  </div>

                </div>

                {/* Working Hours */}
                <div className="ev-contact-item">

                  <div className="ev-contact-icon">
                    <FiClock />
                  </div>

                  <div>
                    <h3>Working Hours</h3>
                    <p>Monday – Saturday</p>
                    <p>9:30 AM – 7:30 PM IST</p>
                  </div>

                </div>

              </div>

              <div className="ev-contact-bottom">
                <FiCheckCircle />
                <span>We're always happy to assist you.</span>
              </div>

            </div>

          </Col>

          {/* Right Contact Form */}
          <Col lg={7}>

            <div className="ev-contact-form-panel">

              <div className="mb-4">

                <span className="ev-form-eyebrow">
                  CONTACT FORM
                </span>

                <h2>Send Us a Message</h2>

                <p>
                  Fill out the form below and our team will get back
                  to you as soon as possible.
                </p>

              </div>

              {/* Status Message */}
              {status.message && (
                <Alert
                  variant={status.type}
                  dismissible
                  onClose={() => setStatus({ type: '', message: '' })}
                >
                  {status.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>

                <Row className="g-3">

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Full Name *</Form.Label>

                      <Form.Control
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email Address *</Form.Label>

                      <Form.Control
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="you@example.com"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>Subject *</Form.Label>

                      <Form.Control
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                        placeholder="What would you like to discuss?"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>Your Message *</Form.Label>

                      <Form.Control
                        as="textarea"
                        rows={6}
                        required
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        placeholder="Tell us how we can help you..."
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="ev-contact-submit"
                    >
                      {submitting ? 'Sending Message...' : 'Send Message'}

                      {!submitting && <FiArrowRight size={19} />}
                    </Button>
                  </Col>

                </Row>

              </Form>

              <div className="ev-contact-form-note">
                <FiCheckCircle />
                Your message will be handled by our support team.
              </div>

            </div>

          </Col>

        </Row>

        {/* =================================
             GOOGLE MAP SECTION
        ================================= */}

        <div className="ev-contact-map-section mt-5">

          <div className="ev-contact-map-heading mb-3">

            <div>

              <span className="ev-contact-eyebrow">
                <FiMapPin />
                FIND OUR LOCATION
              </span>

              <h2>Visit Our Office</h2>

              <p>
                Bhawarkua, Indore, Madhya Pradesh 452001
              </p>

            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Bhawarkua%2C+Indore%2C+Madhya+Pradesh+452001"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ev-primary d-inline-flex align-items-center gap-2"
            >
              <FiNavigation />
              Get Directions
              <FiArrowRight />

            </a>

          </div>

          {/* Interactive Google Map */}
          <div className="ev-contact-map">

            <iframe
              title="UtsavVerse Office Location - Bhawarkua Indore"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3681.0551680573394!2d75.86149937454458!3d22.688990128696247!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcfaa753f05d%3A0x975c63c15cb23f0b!2sUniversal%20Informatics!5e0!3m2!1sen!2sin!4v1795435751238!5m2!1sen!2sin"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />


          </div>

          <p className="text-muted small mt-3">
            <FiMapPin className="me-2" />
            Find us around Bhawarkua, Indore.
            The map shows the area, not a verified exact office address.
          </p>

        </div>

      </Container>

    </section>

  );
}

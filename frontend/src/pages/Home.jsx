/**
 * src/pages/Home.jsx
 * Complete UtsavVerse homepage with Hero, Featured Events, Popular Categories,
 * Upcoming Events, Why Choose UtsavVerse, How It Works, Testimonials, and Newsletter.
 */

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import HeroSection from '../components/HeroSection';
import EventCard from '../components/EventCard';
import CategoryCard from '../components/CategoryCard';
import { useEvents } from '../context/EventContext';
import api from '../services/api';
import {
  WHY_CHOOSE_FEATURES,
  HOW_IT_WORKS_STEPS,
  TESTIMONIALS,
} from '../data/eventsData';

export default function Home() {
  const { categories, cities, featuredEvents, upcomingEvents, catalogLoading } = useEvents();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    setNewsletterStatus({ type: '', message: '' });

    try {
      const { data } = await api.post('/public/newsletter', { email: newsletterEmail });
      setNewsletterStatus({ type: 'success', message: data.message });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Unable to subscribe right now.',
      });
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <>
      <HeroSection categories={categories} cities={cities} />

      {/* Featured Events Section */}
      <section className="ev-section">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
            <div>
              <h2 className="ev-section-title">Featured Events</h2>
              <p className="ev-section-subtitle mb-0">
                Handpicked concerts, royal wedding showcases, tech conferences, and festivals
                happening across India.
              </p>
            </div>
            <Link
              to="/events"
              className="btn btn-ev-outline d-inline-flex align-items-center gap-2 align-self-start"
            >
              <span>Explore All Events</span>
              <FiArrowRight size={16} />
            </Link>
          </div>

          {catalogLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            </div>
          ) : (
            <Row className="g-4">
              {featuredEvents.slice(0, 3).map((event) => (
                <Col lg={4} md={6} key={event._id}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Popular Categories Section */}
      <section className="ev-section ev-section-light">
        <Container>
          <div className="mb-4">
            <h2 className="ev-section-title">Popular Categories</h2>
            <p className="ev-section-subtitle mb-0">
              Browse 10 curated categories tailored for celebrations, learning, music, and culture.
            </p>
          </div>

          <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-5">
            {categories.map((cat) => (
              <Col key={cat._id || cat.slug}>
                <CategoryCard category={cat} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Upcoming Events Section */}
      <section className="ev-section">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
            <div>
              <h2 className="ev-section-title">Upcoming on Calendar</h2>
              <p className="ev-section-subtitle mb-0">
                Lock your seats early with real-time ticket availability and instant PDF passes.
              </p>
            </div>
            <Link
              to="/events?dateFilter=upcoming"
              className="btn btn-ev-outline d-inline-flex align-items-center gap-2 align-self-start"
            >
              <span>View Full Calendar</span>
              <FiArrowRight size={16} />
            </Link>
          </div>

          {catalogLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            </div>
          ) : (
            <Row className="g-4">
              {upcomingEvents.slice(0, 6).map((event) => (
                <Col lg={4} md={6} key={event._id}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Why Choose UtsavVerse + How It Works */}
      <section className="ev-section ev-section-light">
        <Container>
          <Row className="g-5 align-items-start">
            <Col lg={6}>
              <h2 className="ev-section-title">Why Choose UtsavVerse</h2>
              <p className="ev-section-subtitle mb-4">
                Built from the ground up for transparent INR ticketing, verified organizers, and
                zero overbooking.
              </p>

              <Row className="g-3">
                {WHY_CHOOSE_FEATURES.map((item) => (
                  <Col sm={6} key={item.index}>
                    <div className="ev-panel h-100">
                      <div className="ev-step-index">{item.index}</div>
                      <h3 className="h6 fw-bold mb-2">{item.title}</h3>
                      <p className="small text-muted mb-0">{item.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>

            <Col lg={6}>
              <h2 className="ev-section-title">How It Works</h2>
              <p className="ev-section-subtitle mb-4">
                From discovery to venue entry in three straightforward steps.
              </p>

              <div className="ev-panel">
                <div className="d-flex flex-column gap-4">
                  {HOW_IT_WORKS_STEPS.map((s, idx) => (
                    <div
                      key={s.step}
                      className={`d-flex gap-3 ${
                        idx < HOW_IT_WORKS_STEPS.length - 1 ? 'pb-4 border-bottom' : ''
                      }`}
                      style={{ borderColor: 'var(--ev-border)' }}
                    >
                      <div
                        className="ev-mono fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--ev-primary-soft)',
                          color: 'var(--ev-primary)',
                        }}
                      >
                        {s.step}
                      </div>
                      <div>
                        <h3 className="h6 fw-bold mb-1">{s.title}</h3>
                        <p className="small text-muted mb-0">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Customer Testimonials */}
      <section className="ev-section">
        <Container>
          <div className="mb-4">
            <h2 className="ev-section-title">Trusted by Attendees &amp; Organizers</h2>
            <p className="ev-section-subtitle mb-0">
              Real feedback from guests and event hosts running live gatherings on UtsavVerse.
            </p>
          </div>

          <Row className="g-4">
            {TESTIMONIALS.map((t) => (
              <Col lg={4} key={t.name}>
                <div className="ev-panel h-100 d-flex flex-column">
                  <p className="mb-4 text-dark" style={{ lineHeight: 1.65 }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--ev-border)' }}>
                    <div className="fw-bold">{t.name}</div>
                    <div className="small text-muted">
                      {t.role} · {t.city}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Newsletter Section */}
      <section className="ev-section ev-section-light">
        <Container>
          <div
            className="ev-panel p-4 p-md-5"
            style={{ backgroundColor: '#161129', borderColor: '#2B2250', color: '#FFFFFF' }}
          >
            <Row className="align-items-center gy-4">
              <Col lg={6}>
                <h2 className="h3 fw-bold text-white mb-2">Never Miss a Major Drop</h2>
                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Receive weekly dispatches on newly approved concerts, festivals, and conferences in
                  your city.
                </p>
              </Col>
              <Col lg={6}>
                <Form onSubmit={handleNewsletterSubmit}>
                  <Row className="g-2">
                    <Col sm={8}>
                      <Form.Control
                        type="email"
                        required
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        style={{ minHeight: '46px' }}
                        aria-label="Newsletter email address"
                      />
                    </Col>
                    <Col sm={4}>
                      <Button
                        type="submit"
                        disabled={submittingNewsletter}
                        className="btn-ev-secondary w-100"
                        style={{ minHeight: '46px' }}
                      >
                        {submittingNewsletter ? 'Joining...' : 'Subscribe'}
                      </Button>
                    </Col>
                  </Row>
                </Form>
                {newsletterStatus.message && (
                  <Alert variant={newsletterStatus.type} className="mt-3 mb-0 py-2 small">
                    {newsletterStatus.type === 'success' && <FiCheckCircle className="me-1" />}
                    {newsletterStatus.message}
                  </Alert>
                )}
              </Col>
            </Row>
          </div>
        </Container>
      </section>
    </>
  );
}

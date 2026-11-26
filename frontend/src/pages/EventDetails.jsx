/**
 * src/pages/EventDetails.jsx
 * Full event showcase: banner, detailed description, venue & address, organizer info,
 * ticket tiers with availability, photo gallery, attendee reviews, and related events.
 */

import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiStar,
  FiArrowLeft,
  FiShield,
} from 'react-icons/fi';
import api, { resolveImageUrl } from '../services/api';
import EventCard from '../components/EventCard';
import { formatINR, formatEventDate } from '../data/eventsData';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data.event);
        setReviews(data.reviews || []);
        setRelatedEvents(data.relatedEvents || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load event details.');
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container className="py-5" style={{ minHeight: '60vh' }}>
        <Alert variant="danger">{error || 'Event not found.'}</Alert>
        <Link to="/events" className="btn btn-ev-outline">
          Back to Explore Events
        </Link>
      </Container>
    );
  }

  const totalAvailableSeats = (event.ticketCategories || []).reduce(
    (sum, t) => sum + Number(t.availableSeats || 0),
    0
  );
  const startingPrice =
    event.ticketCategories?.length > 0
      ? Math.min(...event.ticketCategories.map((t) => Number(t.price || 0)))
      : 0;

  return (
    <section className="ev-section pt-4">
      <Container>
        <div className="mb-3">
          <Link
            to="/events"
            className="text-decoration-none d-inline-flex align-items-center gap-2 small fw-semibold"
            style={{ color: 'var(--ev-ink-secondary)' }}
          >
            <FiArrowLeft size={15} />
            <span>Back to Explore Events</span>
          </Link>
        </div>

        {/* Large Event Banner */}
        <div className="ev-detail-banner mb-4">
          <img
            src={resolveImageUrl(event.bannerImage)}
            alt={event.title}
            referrerPolicy="no-referrer"
          />
        </div>

        <Row className="g-4 align-items-start">
          {/* Left Main Column */}
          <Col lg={8}>
            <div className="ev-meta-line mb-2">
              <span className="ev-meta-category">{event.category}</span>
              <span aria-hidden="true">·</span>
              <span>{event.city}</span>
              {event.ratingCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="d-inline-flex align-items-center gap-1 fw-semibold text-dark ev-num">
                    <FiStar size={14} fill="#F59E0B" color="#F59E0B" />
                    {event.ratingAverage} ({event.ratingCount} reviews)
                  </span>
                </>
              )}
            </div>

            <h1 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.45rem)' }}>
              {event.title}
            </h1>
            <p className="lead text-muted mb-4">{event.shortDescription}</p>

            {/* About Event */}
            <div className="ev-panel mb-4">
              <h2 className="h5 fw-bold mb-3">About This Event</h2>
              <p className="mb-0" style={{ whiteSpace: 'pre-line', color: 'var(--ev-ink-secondary)' }}>
                {event.description}
              </p>
            </div>

            {/* Ticket Categories & Live Availability */}
            <div className="ev-panel mb-4">
              <h2 className="h5 fw-bold mb-3">Ticket Categories &amp; Pricing</h2>
              <div className="table-responsive">
                <Table className="ev-table mb-0">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Access</th>
                      <th className="text-end">Available</th>
                      <th className="text-end">Price (INR)</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(event.ticketCategories || []).map((tier) => (
                      <tr key={tier._id || tier.name}>
                        <td className="fw-semibold">{tier.name}</td>
                        <td className="text-muted small">{tier.description || 'Standard entry'}</td>
                        <td className="text-end ev-num">
                          {tier.availableSeats > 0 ? (
                            <span>{tier.availableSeats} left</span>
                          ) : (
                            <span className="text-danger fw-semibold">Sold Out</span>
                          )}
                        </td>
                        <td className="text-end fw-bold ev-mono">{formatINR(tier.price)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            disabled={tier.availableSeats <= 0}
                            onClick={() =>
                              navigate(`/booking/${event._id}?tier=${encodeURIComponent(tier._id)}`)
                            }
                            className="btn btn-ev-primary btn-sm"
                          >
                            {tier.availableSeats > 0 ? 'Select' : 'Full'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Event Gallery */}
            {Array.isArray(event.galleryImages) && event.galleryImages.length > 0 && (
              <div className="ev-panel mb-4">
                <h2 className="h5 fw-bold mb-3">Event Gallery</h2>
                <Row className="g-3">
                  {event.galleryImages.map((imgUrl, idx) => (
                    <Col sm={4} key={`${imgUrl}-${idx}`}>
                      <div
                        className="overflow-hidden"
                        style={{
                          aspectRatio: '4 / 3',
                          borderRadius: 'var(--ev-radius-sm)',
                          backgroundColor: 'var(--ev-bg-light)',
                        }}
                      >
                        <img
                          src={resolveImageUrl(imgUrl)}
                          alt={`${event.title} gallery ${idx + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Verified Attendee Reviews */}
            <div className="ev-panel">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 fw-bold mb-0">Attendee Reviews</h2>
                <span className="small text-muted ev-num">{reviews.length} verified reviews</span>
              </div>

              {reviews.length === 0 ? (
                <p className="text-muted small mb-0">
                  No reviews yet. Attend this event and share your experience from your User
                  Dashboard.
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="pb-3 border-bottom"
                      style={{ borderColor: 'var(--ev-border)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold">{rev.userName}</span>
                        <span className="d-inline-flex align-items-center gap-1 small fw-semibold ev-num">
                          <FiStar size={13} fill="#F59E0B" color="#F59E0B" />
                          {rev.rating}/5
                        </span>
                      </div>
                      {rev.title && <div className="fw-semibold small mb-1">{rev.title}</div>}
                      <p className="small text-muted mb-0">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>

          {/* Right Sticky Summary Sidebar */}
          <Col lg={4}>
            <div className="ev-panel position-sticky" style={{ top: '92px' }}>
              <div className="mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--ev-border)' }}>
                <div className="small text-muted">Tickets starting from</div>
                <div className="h3 fw-bold mb-0 ev-mono">{formatINR(startingPrice)}</div>
              </div>

              <div className="d-flex flex-column gap-3 mb-4 small">
                <div className="d-flex align-items-start gap-2">
                  <FiCalendar size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--ev-primary)' }} />
                  <div>
                    <div className="fw-semibold">Date</div>
                    <div className="text-muted">{formatEventDate(event.date)}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2">
                  <FiClock size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--ev-primary)' }} />
                  <div>
                    <div className="fw-semibold">Time</div>
                    <div className="text-muted">{event.time}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2">
                  <FiMapPin size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--ev-primary)' }} />
                  <div>
                    <div className="fw-semibold">{event.venue}</div>
                    <div className="text-muted">{event.address}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2">
                  <FiUser size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--ev-primary)' }} />
                  <div>
                    <div className="fw-semibold">Organized by</div>
                    <div className="text-muted">{event.organizerName}</div>
                  </div>
                </div>
              </div>

              <Link
                to={`/booking/${event._id}`}
                className={`btn btn-ev-primary w-100 py-2 mb-3 ${
                  totalAvailableSeats <= 0 ? 'disabled' : ''
                }`}
              >
                {totalAvailableSeats > 0 ? 'Book Now' : 'Currently Sold Out'}
              </Link>

              <div className="small text-muted d-flex align-items-start gap-2">
                <FiShield size={15} className="mt-1 flex-shrink-0" />
                <span>{event.cancellationPolicy}</span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-5 pt-4 border-top" style={{ borderColor: 'var(--ev-border)' }}>
            <h2 className="h4 fw-bold mb-4">Related Events You May Enjoy</h2>
            <Row className="g-4">
              {relatedEvents.map((rel) => (
                <Col lg={4} md={6} key={rel._id}>
                  <EventCard event={rel} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Container>
    </section>
  );
}

/**
 * src/components/EventCard.jsx
 * Reusable event card displaying image, category, date/time, location, INR price,
 * View Details button, and Book Now button.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiStar } from 'react-icons/fi';
import { formatINR, formatEventDate } from '../data/eventsData';
import { resolveImageUrl } from '../services/api';

export default function EventCard({ event }) {
  const [imgError, setImgError] = useState(false);
  const bannerSrc = resolveImageUrl(event.bannerImage);

  useEffect(() => {
    setImgError(false);
  }, [bannerSrc]);

  const startingPrice =
    Array.isArray(event.ticketCategories) && event.ticketCategories.length > 0
      ? Math.min(...event.ticketCategories.map((t) => Number(t.price || 0)))
      : 0;

  const totalAvailable =
    Array.isArray(event.ticketCategories) && event.ticketCategories.length > 0
      ? event.ticketCategories.reduce((sum, t) => sum + Number(t.availableSeats || 0), 0)
      : 0;

  return (
    <article className="ev-card">
      <Link to={`/events/${event._id}`} className="ev-card-media text-decoration-none">
        {!imgError && bannerSrc ? (
          <img
            src={bannerSrc}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-100 h-100 d-flex flex-column justify-content-end p-3 text-white">
            <span className="small opacity-75">{event.category}</span>
            <span className="fw-bold">{event.title}</span>
          </div>
        )}
      </Link>

      <div className="ev-card-body">
        <div className="ev-meta-line">
          <span className="ev-meta-category">{event.category}</span>
          <span aria-hidden="true">·</span>
          <span>{event.city}</span>
          {event.ratingAverage > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="d-inline-flex align-items-center gap-1 text-dark fw-medium ev-num">
                <FiStar size={13} fill="#F59E0B" color="#F59E0B" />
                {event.ratingAverage}
              </span>
            </>
          )}
        </div>

        <h3 className="ev-card-title">
          <Link to={`/events/${event._id}`} className="text-decoration-none text-reset">
            {event.title}
          </Link>
        </h3>

        <div className="ev-card-venue d-flex flex-column gap-1">
          <span className="d-inline-flex align-items-center gap-2">
            <FiCalendar size={14} className="flex-shrink-0 text-muted" />
            <span>
              {formatEventDate(event.date)} · {event.time}
            </span>
          </span>
          <span className="d-inline-flex align-items-center gap-2 text-truncate">
            <FiMapPin size={14} className="flex-shrink-0 text-muted" />
            <span className="text-truncate">
              {event.venue}, {event.city}
            </span>
          </span>
        </div>

        <div className="ev-card-footer">
          <div>
            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
              {totalAvailable > 0 ? 'Starting from' : 'Sold out'}
            </div>
            <div className="ev-price-tag ev-num">
              {startingPrice === 0 ? 'Free' : formatINR(startingPrice)}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to={`/events/${event._id}`} className="btn btn-ev-outline btn-sm px-3 py-2">
              View Details
            </Link>
            <Link
              to={totalAvailable > 0 ? `/booking/${event._id}` : `/events/${event._id}`}
              className="btn btn-ev-primary btn-sm px-3 py-2"
            >
              {totalAvailable > 0 ? 'Book Now' : 'Waitlist'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

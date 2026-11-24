/**
 * src/components/HeroSection.jsx
 * Full-width hero section with "Discover Events. Create Memories." headline
 * and interactive search bar filtering by event name, category, and location.
 */

import { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiTag } from 'react-icons/fi';
import { UtsavVerse_IMAGES, EVENT_CATEGORIES, INDIAN_CITIES } from '../data/eventsData';

export default function HeroSection({ categories = [], cities = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const categoryOptions =
    categories.length > 0 ? categories.map((c) => c.name) : EVENT_CATEGORIES;
  const cityOptions =
    cities.length > 0 ? cities.map((c) => c.name) : INDIAN_CITIES;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    navigate(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <section className="ev-hero">
      <img
        src={UtsavVerse_IMAGES.heroConcert}
        alt="Live open-air music concert in Mumbai at twilight"
        className="ev-hero-bg" 
        referrerPolicy="no-referrer" 
      />
      <div className="ev-hero-scrim" />

      <Container className="ev-hero-content">
        <Row className="align-items-center">
          <Col lg={10} xl={9}>
            <p className="small fw-semibold mb-2" style={{ color: '#C4B0FF', letterSpacing: '0.02em' }}>
              Curated Experiences Across India
            </p>
            <h1 className="ev-hero-title">Discover Events. Create Memories.</h1>
            <p className="ev-hero-lead">
              Book verified passes for live music concerts, royal wedding showcases, classical
              cultural festivals, technology conferences, and artisan workshops in INR.
            </p>

            <Form onSubmit={handleSearchSubmit} className="ev-search-bar">
              <Row className="g-2 align-items-center">
                <Col lg={4} md={12}>
                  <div className="position-relative">
                    <FiSearch
                      size={16}
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: '14px' }}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Search concerts, workshops, summits..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="ev-search-input ps-5"
                      aria-label="Search events by name"
                    />
                  </div>
                </Col>

                <Col lg={3} md={6}>
                  <div className="position-relative">
                    <FiTag
                      size={15}
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: '14px', pointerEvents: 'none' }}
                    />
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="ev-search-input ps-5"
                      aria-label="Filter by category"
                    >
                      <option value="">All Categories</option>
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col lg={3} md={6}>
                  <div className="position-relative">
                    <FiMapPin
                      size={15}
                      className="position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: '14px', pointerEvents: 'none' }}
                    />
                    <Form.Select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="ev-search-input ps-5"
                      aria-label="Filter by location"
                    >
                      <option value="">All Cities</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col lg={2} md={12}>
                  <Button type="submit" className="btn-ev-primary w-100" style={{ minHeight: '44px' }}>
                    Explore
                  </Button>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

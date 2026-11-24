/**
 * src/pages/Events.jsx
 * Explore Events page with search, category, location, date, price filters, sorting, and pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Pagination, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiRotateCcw } from 'react-icons/fi';
import EventCard from '../components/EventCard';
import api from '../services/api';
import { useEvents } from '../context/EventContext';
import { EVENT_CATEGORIES, INDIAN_CITIES } from '../data/eventsData';

export default function Events() {
  const { categories: contextCategories, cities: contextCities } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    dateFilter: searchParams.get('dateFilter') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'date_asc',
    page: Number(searchParams.get('page')) || 1,
  });

  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState(INDIAN_CITIES);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryOptions =
    contextCategories.length > 0
      ? contextCategories.map((c) => c.name)
      : EVENT_CATEGORIES;

  const fetchEvents = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/events', {
        params: {
          search: activeFilters.search,
          category: activeFilters.category,
          location: activeFilters.location,
          dateFilter: activeFilters.dateFilter,
          minPrice: activeFilters.minPrice,
          maxPrice: activeFilters.maxPrice,
          sort: activeFilters.sort,
          page: activeFilters.page,
          limit: 9,
        },
      });
      setEvents(data.events || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      const managedCityNames = contextCities.map((c) => c.name);
      if (data.availableCities?.length > 0 || managedCityNames.length > 0) {
        setCities(
          Array.from(new Set([...(data.availableCities || []), ...managedCityNames])).sort()
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(filters);
  }, [filters, fetchEvents]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: key === 'page' ? value : 1 };
    setFilters(next);

    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== 'all' && !(k === 'page' && v === 1)) {
        params.set(k, String(v));
      }
    });
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const cleared = {
      search: '',
      category: '',
      location: '',
      dateFilter: 'all',
      minPrice: '',
      maxPrice: '',
      sort: 'date_asc',
      page: 1,
    };
    setFilters(cleared);
    setSearchParams({}, { replace: true });
  };

  return (
    <section className="ev-section" style={{ minHeight: '75vh' }}>
      <Container>
        <div className="mb-4">
          <h1 className="ev-section-title">Explore Events</h1>
          <p className="ev-section-subtitle mb-0">
            Filter live events across India by category, city, date window, and INR ticket price.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="ev-panel mb-4">
          <Row className="g-3">
            <Col lg={4} md={6}>
              <Form.Label className="small fw-semibold text-muted">Search</Form.Label>
              <div className="position-relative">
                <FiSearch
                  size={15}
                  className="position-absolute top-50 translate-middle-y text-muted"
                  style={{ left: '12px' }}
                />
                <Form.Control
                  type="text"
                  placeholder="Title, venue, or organizer..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="ps-5"
                />
              </div>
            </Col>

            <Col lg={3} md={6}>
              <Form.Label className="small fw-semibold text-muted">Category</Form.Label>
              <Form.Select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col lg={2} md={4}>
              <Form.Label className="small fw-semibold text-muted">City</Form.Label>
              <Form.Select
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col lg={3} md={4}>
              <Form.Label className="small fw-semibold text-muted">Date Window</Form.Label>
              <Form.Select
                value={filters.dateFilter}
                onChange={(e) => updateFilter('dateFilter', e.target.value)}
              >
                <option value="all">Any Date</option>
                <option value="upcoming">All Upcoming</option>
                <option value="this_week">Next 7 Days</option>
                <option value="next_30_days">Next 30 Days</option>
                <option value="this_month">This Month</option>
              </Form.Select>
            </Col>

            <Col lg={2} md={4}>
              <Form.Label className="small fw-semibold text-muted">Min Price (₹)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
              />
            </Col>

            <Col lg={2} md={4}>
              <Form.Label className="small fw-semibold text-muted">Max Price (₹)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                placeholder="10000"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
              />
            </Col>

            <Col lg={4} md={4}>
              <Form.Label className="small fw-semibold text-muted">Sort By</Form.Label>
              <Form.Select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
              >
                <option value="date_asc">Date: Soonest First</option>
                <option value="price_asc">Price: Low to High (INR)</option>
                <option value="price_desc">Price: High to Low (INR)</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="newest">Recently Added</option>
              </Form.Select>
            </Col>

            <Col lg={4} md={12} className="d-flex align-items-end justify-content-between gap-3">
              <span className="small text-muted ev-num">
                Showing <strong>{events.length}</strong> of <strong>{pagination.total}</strong>{' '}
                events
              </span>
              <Button
                variant="outline-secondary"
                onClick={resetFilters}
                className="btn-ev-outline d-inline-flex align-items-center gap-2"
              >
                <FiRotateCcw size={14} />
                <span>Reset Filters</span>
              </Button>
            </Col>
          </Row>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
            <p className="text-muted small mt-2">Loading curated events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="ev-panel text-center py-5">
            <h3 className="h5 fw-bold mb-2">No events match your current filters</h3>
            <p className="text-muted mb-3">
              Try broadening your city, category, or INR price ceiling to discover more events.
            </p>
            <Button onClick={resetFilters} className="btn-ev-primary">
              Show All Events
            </Button>
          </div>
        ) : (
          <>
            <Row className="g-4">
              {events.map((event) => (
                <Col lg={4} md={6} key={event._id}>
                  <EventCard event={event} />
                </Col>
              ))}
            </Row>

            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5">
                <Pagination>
                  <Pagination.Prev
                    disabled={pagination.page <= 1}
                    onClick={() => updateFilter('page', pagination.page - 1)}
                  />
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNo) => (
                    <Pagination.Item
                      key={pageNo}
                      active={pageNo === pagination.page}
                      onClick={() => updateFilter('page', pageNo)}
                    >
                      {pageNo}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateFilter('page', pagination.page + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}

/**
 * src/components/Footer.jsx
 * Professional footer with navigation links, categories, social links, and developer credit.
 */

import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiLinkedin, FiYoutube, FiMail, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ev-footer">
      <Container>
        <Row className="gy-4 pb-4">
          <Col lg={4} md={6}>
            <div className="ev-brand text-white mb-3" style={{ fontSize: '1.4rem' }}>
              Utsav<span style={{ color: '#9D7BFF' }}>Verse</span>
            </div>
            <p className="small mb-3" style={{ color: 'rgba(255,255,255,0.72)', maxWidth: '34ch' }}>
              Discover Events. Create Memories. India&apos;s curated platform for live music
              concerts, heritage weddings, cultural recitals, technology summits, and hands-on
              workshops.
            </p>
            <div className="d-flex align-items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FiInstagram size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <FiTwitter size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FiLinkedin size={18} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <FiYoutube size={18} />
              </a>
            </div>
          </Col>

          <Col lg={2} md={6} xs={6}>
            <h3 className="ev-footer-heading">Platform</h3>
            <ul className="list-unstyled d-flex flex-column gap-2 small mb-0">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/events">Explore Events</Link>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/register">Become an Organizer</Link>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={6} xs={6}>
            <h3 className="ev-footer-heading">Popular Categories</h3>
            <ul className="list-unstyled d-flex flex-column gap-2 small mb-0">
              <li>
                <Link to="/events?category=Music+Concerts">Music Concerts</Link>
              </li>
              <li>
                <Link to="/events?category=Wedding+Events">Wedding Events</Link>
              </li>
              <li>
                <Link to="/events?category=Cultural+Events">Cultural Events</Link>
              </li>
              <li>
                <Link to="/events?category=Technology+Conferences">Technology Conferences</Link>
              </li>
              <li>
                <Link to="/events?category=Workshops">Creative Workshops</Link>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h3 className="ev-footer-heading">Get in Touch</h3>
            <ul className="list-unstyled d-flex flex-column gap-2 small mb-0">
              <li className="d-flex align-items-center gap-2">
                <FiMapPin size={15} />
                <span>Indore · Bhopal · Ujjain</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <FiMail size={15} />
                <a href="mailto:support@UtsavVerse.in">contact@universalinformatics.com</a>
              </li>
            </ul>
          </Col>
        </Row>

        <div
          className="pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
        >
          <span>© {currentYear} UtsavVerse. All rights reserved.</span>
          <span>
            Designed &amp; Engineered by <strong className="text-white">Lakshy Bhawsar</strong>
          </span>
        </div>
      </Container>
    </footer>
  );
}

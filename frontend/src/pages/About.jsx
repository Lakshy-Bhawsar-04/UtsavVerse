/**
 * src/pages/About.jsx
 * Platform mission, architecture overview, developer & mentor section, and technology stack.
 */

import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiCode, FiServer, FiDatabase, FiShield } from 'react-icons/fi';
import { UtsavVerse_IMAGES } from '../data/eventsData';

const TEAM_PROFILES = [
  {
    name: 'Lakshy Bhawsar',
    role: 'Developer',
    subtitle: 'Full-Stack MERN Engineer',
    image: UtsavVerse_IMAGES.lakshyBhawsar,
    bio: 'Designed and built the complete UtsavVerse full-stack architecture—covering the responsive React JSX interface, Node.js and Express REST APIs, MongoDB Atlas schema design, role-based dashboards, Razorpay verification, and Digital QR / PDF e-ticketing.',
  },
  {
    name: 'Arpit Gaveshinde',
    role: 'Project Mentor',
    subtitle: 'Technical Guidance & Architecture Review',
    image: UtsavVerse_IMAGES.arpitGaveshinde,
    bio: 'Guided the overall engineering direction of UtsavVerse, advising on modular MERN separation, secure authentication practices, atomic booking workflows, scalable database modeling, and production code quality.',
  },
];

const TECH_STACK = [
  {
    icon: <FiCode size={22} />,
    category: 'Frontend Layer',
    title: 'React.js (JSX) & Bootstrap 5',
    description:
      'Built with React.js (.jsx), React Router DOM, Context API for global authentication and event state, Axios HTTP client with JWT interceptors, React Bootstrap, React Icons, HTML5, and custom CSS3 design tokens.',
    items: ['React.js (.jsx)', 'React Router DOM', 'Bootstrap 5 & React Bootstrap', 'Context API & Axios'],
  },
  {
    icon: <FiServer size={22} />,
    category: 'Backend Layer',
    title: 'Node.js & Express.js MVC',
    description:
      'Structured into modular Express routes, controllers, and middleware following the MVC pattern—featuring Multer image upload handling, request validation, centralized error handling, and clean REST APIs.',
    items: ['Node.js', 'Express.js', 'Multer File Uploads', 'Modular MVC Architecture'],
  },
  {
    icon: <FiDatabase size={22} />,
    category: 'Database & Persistence',
    title: 'MongoDB Atlas & Mongoose ODM',
    description:
      'Powered by MongoDB Atlas with 10 structured Mongoose collections (users, events, bookings, payments, categories, cities, reviews, notifications, subscribers, and contact messages) plus atomic ticket inventory updates.',
    items: ['MongoDB Atlas', 'Mongoose ODM', 'Atomic Seat Updates', 'MongoDB Compass Ready'],
  },
  {
    icon: <FiShield size={22} />,
    category: 'Security, Payments & Passes',
    title: 'JWT Auth, Razorpay & Digital QR',
    description:
      'Protected with bcryptjs password hashing, JWT Role-Based Access Control (User, Organizer, Admin), backend HMAC-SHA256 Razorpay test payment verification, scannable QR passes, and instant PDF ticket downloads.',
    items: ['JWT & bcryptjs RBAC', 'Razorpay HMAC Verification', 'QRCode Digital Passes', 'jsPDF E-Ticket Export'],
  },
];

export default function About() {
  return (
    <>
      <section className="ev-section">
        <Container>
          <Row className="align-items-center g-5 mb-5">
            <Col lg={6}>
              <p className="small fw-semibold mb-2" style={{ color: 'var(--ev-primary)' }}>
                About UtsavVerse
              </p>
              <h1 className="ev-section-title mb-3">
                Connecting India&apos;s Creators, Venues, and Audiences
              </h1>
              <p className="text-muted mb-3">
                UtsavVerse is a full-stack event discovery and ticketing platform built for India&apos;s
                vibrant live experiences—spanning open-air music concerts, heritage palace wedding
                showcases, classical dance recitals, technology summits, and community workshops.
              </p>
              <p className="text-muted mb-4">
                Engineered by <strong>Lakshy Bhawsar</strong> under the mentorship of{' '}
                <strong>Arpit Gaveshinde</strong> on the MERN stack, UtsavVerse enforces atomic
                ticket reservations, role-based organizer verification, server-side Razorpay
                signature verification, scannable Digital QR passes, and instant PDF e-ticket
                generation.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/events" className="btn btn-ev-primary">
                  Explore Live Events
                </Link>
                <Link to="/register" className="btn btn-ev-outline">
                  Register as Organizer
                </Link>
              </div>
            </Col>

            <Col lg={6}>
              <div
                className="overflow-hidden"
                style={{
                  borderRadius: 'var(--ev-radius-lg)',
                  aspectRatio: '4 / 3',
                  border: '1px solid var(--ev-border)',
                }}
              >
                <img
                  src={UtsavVerse_IMAGES.festival}
                  alt="Cultural lantern celebration in Udaipur"
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={4}>
              <div className="ev-panel h-100">
                <div className="ev-step-index">01.</div>
                <h2 className="h5 fw-bold mb-2">Verified Organizers</h2>
                <p className="small text-muted mb-0">
                  Every organizer application is reviewed by a platform administrator prior to
                  publishing events or collecting INR ticket revenue.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="ev-panel h-100">
                <div className="ev-step-index">02.</div>
                <h2 className="h5 fw-bold mb-2">Overbooking Protection</h2>
                <p className="small text-muted mb-0">
                  Ticket categories update atomically in MongoDB at reservation time so seat counts
                  stay accurate even during peak drops.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="ev-panel h-100">
                <div className="ev-step-index">03.</div>
                <h2 className="h5 fw-bold mb-2">Cryptographic Verification</h2>
                <p className="small text-muted mb-0">
                  Payments are never trusted on frontend redirects alone—HMAC-SHA256 signatures are
                  verified strictly on the Express backend.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Developer & Mentor Section */}
      <section className="ev-section ev-section-light">
        <Container>
          <div className="mb-4">
            <p className="small fw-semibold mb-1" style={{ color: 'var(--ev-primary)' }}>
              People Behind UtsavVerse
            </p>
            <h2 className="ev-section-title mb-2">Developer &amp; Project Mentor</h2>
            <p className="text-muted mb-0" style={{ maxWidth: '64ch' }}>
              Meet the developer and mentor who collaborated on the architecture, full-stack
              engineering, and real-world workflows of UtsavVerse.
            </p>
          </div>

          <Row className="g-4">
            {TEAM_PROFILES.map((member) => (
              <Col lg={6} key={member.name}>
                <div className="ev-panel h-100 d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
                  <div
                    className="flex-shrink-0 overflow-hidden"
                    style={{
                      width: '140px',
                      height: '156px',
                      borderRadius: 'var(--ev-radius-md)',
                      border: '2px solid var(--ev-primary-soft)',
                      backgroundColor: 'var(--ev-bg-light)',
                    }}
                  >
                    <img
                      src={member.image}
                      alt={`${member.name} — ${member.role}`}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover', objectPosition: 'top center' }}
                    />
                  </div>
                  <div className="text-center text-sm-start">
                    <div
                      className="small fw-bold text-uppercase mb-1"
                      style={{ color: 'var(--ev-primary)', letterSpacing: '0.04em' }}
                    >
                      {member.role}
                    </div>
                    <h3 className="h4 fw-bold mb-1">{member.name}</h3>
                    <div className="small fw-semibold text-muted mb-2">{member.subtitle}</div>
                    <p className="small text-muted mb-0" style={{ lineHeight: 1.65 }}>
                      {member.bio}
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Technology Stack Section */}
      <section className="ev-section">
        <Container>
          <div className="mb-4">
            <p className="small fw-semibold mb-1" style={{ color: 'var(--ev-primary)' }}>
              Engineering &amp; Stack
            </p>
            <h2 className="ev-section-title mb-2">Technologies Used to Develop UtsavVerse</h2>
            <p className="text-muted mb-0" style={{ maxWidth: '66ch' }}>
              UtsavVerse is built as a separated full-stack MERN application with distinct frontend
              and backend codebases designed for maintainability, security, and responsive speed.
            </p>
          </div>

          <Row className="g-4">
            {TECH_STACK.map((tech) => (
              <Col md={6} key={tech.title}>
                <div className="ev-panel h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="ev-category-icon mb-0">{tech.icon}</div>
                    <div>
                      <div className="small fw-semibold" style={{ color: 'var(--ev-primary)' }}>
                        {tech.category}
                      </div>
                      <h3 className="h5 fw-bold mb-0">{tech.title}</h3>
                    </div>
                  </div>
                  <p className="small text-muted mb-3" style={{ lineHeight: 1.65 }}>
                    {tech.description}
                  </p>
                  <div
                    className="pt-3 d-flex flex-wrap gap-3 small fw-semibold"
                    style={{
                      borderTop: '1px solid var(--ev-border)',
                      color: 'var(--ev-ink-secondary)',
                    }}
                  >
                    {tech.items.map((item) => (
                      <span key={item}>• {item}</span>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
}

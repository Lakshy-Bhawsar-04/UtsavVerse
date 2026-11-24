/**
 * src/components/Navbar.jsx
 * Responsive single-row navigation bar using React Bootstrap.
 */

import { Navbar as BsNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiGrid } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'organizer') return '/organizer/dashboard';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'admin') return 'Admin Panel';
    if (user.role === 'organizer') return 'Organizer Studio';
    return 'My Bookings';
  };

  return (
    <BsNavbar expand="lg" sticky="top" className="ev-navbar">
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="ev-brand">
          Utsav<span className="ev-brand-accent">Verse</span>
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="UtsavVerse-main-nav" />

        <BsNavbar.Collapse id="UtsavVerse-main-nav">
          <Nav className="mx-auto gap-lg-4 gap-2 my-2 my-lg-0">
            <Nav.Link as={NavLink} to="/" end className="ev-nav-link">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/events" className="ev-nav-link">
              Explore Events
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="ev-nav-link">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="ev-nav-link">
              Contact
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-ev-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-ev-primary">
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link to={getDashboardRoute()} className="btn btn-ev-primary d-inline-flex align-items-center gap-2">
                  <FiGrid size={16} />
                  <span>{getDashboardLabel()}</span>
                </Link>
                <NavDropdown
                  align="end"
                  title={
                    <span className="d-inline-flex align-items-center gap-1 fw-semibold text-dark">
                      <FiUser size={16} />
                      <span className="text-truncate" style={{ maxWidth: '120px' }}>
                        {user?.name?.split(' ')[0]}
                      </span>
                    </span>
                  }
                  id="user-nav-dropdown"
                >
                  <NavDropdown.Item as={Link} to={getDashboardRoute()}>
                    <FiGrid className="me-2" />
                    {getDashboardLabel()}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    <FiLogOut className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}
          </div>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}

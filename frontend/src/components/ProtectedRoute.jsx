/**
 * src/components/ProtectedRoute.jsx
 * Enforces JWT login and Role-Based Access Control (user, organizer, admin).
 */

import { Navigate, useLocation } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: 'var(--ev-primary)' }} />
        <p className="mt-3 text-muted small">Verifying your session...</p>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

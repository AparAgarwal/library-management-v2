import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

/**
 * PrivateRoute - Requires user to be logged in
 * Redirects to /login if not authenticated
 */
export const PrivateRoute = ({ children, redirectTo = '/login' }) => {
  const user = useSelector(selectUser);

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * ProtectedRoute - Requires user to be logged in AND have specific role(s)
 * Redirects to /login if not authenticated
 * Redirects to / if authenticated but doesn't have required role
 */
export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireLibrarian = false,
  redirectTo = '/',
  loginRedirect = '/login'
}) => {
  const user = useSelector(selectUser);

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={loginRedirect} replace />;
  }

  const userRole = (user.role || '').toString().toLowerCase();

  // Check for specific roles
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const allowed = allowedRoles.map(r => r.toString().toLowerCase());
    if (!allowed.includes(userRole)) {
      return <Navigate to={redirectTo} replace />;
    }
    return children;
  }

  // Legacy librarian check
  if (requireLibrarian) {
    const isLibrarian = userRole === 'librarian' || userRole === 'admin';
    if (!isLibrarian) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

/**
 * RestrictedRoute - Prevents authenticated users from accessing (e.g., login/register pages)
 * Redirects logged-in users to dashboard or specified route
 */
export const RestrictedRoute = ({ children, redirectTo }) => {
  const user = useSelector(selectUser);

  if (user) {
    // Determine redirect based on user role if not specified
    if (!redirectTo) {
      const userRole = (user.role || '').toString().toLowerCase();
      if (userRole === 'librarian' || userRole === 'admin') {
        redirectTo = '/dashboard/admin';
      } else if (userRole === 'member') {
        redirectTo = '/dashboard/member';
      } else {
        redirectTo = '/';
      }
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Default export for backward compatibility
export default ProtectedRoute;

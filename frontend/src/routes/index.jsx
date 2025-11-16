import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, ProtectedRoute, RestrictedRoute } from '../components/ProtectedRoute';

// Lazy load pages for code splitting
const Home = lazy(() => import('../pages/home/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const BookCatalog = lazy(() => import('../pages/books/BookCatalog'));
const BookDetail = lazy(() => import('../pages/books/BookDetail'));
const AdminMembers = lazy(() => import('../pages/admin/AdminMembers'));
const AdminMemberDetails = lazy(() => import('../pages/admin/AdminMemberDetails'));
const DashboardRouter = lazy(() => import('../pages/dashboard/DashboardRouter'));
const UserProfile = lazy(() => import('../pages/user/UserProfile'));

// Loading fallback
const LoadingFallback = () => (
  <div className="loading">Loading...</div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookCatalog />} />
        <Route path="/books/:id" element={<BookDetail />} />
        
        {/* Restricted Routes - Redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <RestrictedRoute>
              <Login />
            </RestrictedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <RestrictedRoute>
              <Register />
            </RestrictedRoute>
          }
        />
        
        {/* Private Routes - Require authentication only */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        
        {/* Protected Routes - Require specific roles (Admin/Librarian) */}
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <AdminMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <AdminMemberDetails />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

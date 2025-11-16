import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for code splitting
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const BookCatalog = lazy(() => import('../pages/BookCatalog'));
const BookDetail = lazy(() => import('../pages/BookDetail'));
const AdminMembers = lazy(() => import('../pages/AdminMembers'));
const AdminMemberDetails = lazy(() => import('../pages/AdminMemberDetails'));
const DashboardRouter = lazy(() => import('../pages/DashboardRouter'));

// Loading fallback
const LoadingFallback = () => (
  <div className="loading">Loading...</div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books" element={<BookCatalog />} />
        <Route path="/books/:id" element={<BookDetail />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute requireLibrarian>
              <AdminMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members/:id"
          element={
            <ProtectedRoute requireLibrarian>
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

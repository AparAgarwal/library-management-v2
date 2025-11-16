import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

const ProtectedRoute = ({ children, requireLibrarian = false }) => {
  const user = useSelector(selectUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireLibrarian && user.role !== 'LIBRARIAN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

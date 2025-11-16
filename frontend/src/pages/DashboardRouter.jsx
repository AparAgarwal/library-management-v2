import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import MemberDashboard from './MemberDashboard';
import LibrarianDashboard from './LibrarianDashboard';

export default function DashboardRouter() {
  const user = useSelector(selectUser);
  
  if (user?.role === 'LIBRARIAN') {
    return <LibrarianDashboard />;
  }
  
  return <MemberDashboard />;
}
